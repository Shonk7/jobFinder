import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError } from '../errors/customErrors';

interface MatchResult {
  matchScore: number;
  skillScore: number;
  experienceScore: number;
  locationScore: number;
  industryScore: number;
  jobTypeScore: number;
  salaryScore: number;
  matchReasons: MatchReason[];
  skillGaps: string[];
}

interface MatchReason {
  category: string;
  score: number;
  description: string;
}

const EXPERIENCE_LEVEL_YEARS: Record<string, [number, number]> = {
  entry: [0, 2],
  junior: [0, 3],
  mid: [2, 5],
  intermediate: [2, 5],
  senior: [5, 10],
  lead: [7, 15],
  principal: [10, 20],
  executive: [12, 30],
  manager: [5, 20],
  director: [10, 25],
};

function normalizeLocation(location: string): string[] {
  return location
    .toLowerCase()
    .split(/[,/|]/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function calculateSkillScore(
  userSkills: string[],
  jobSkills: string[]
): { score: number; gaps: string[] } {
  if (jobSkills.length === 0) {
    return { score: 1.0, gaps: [] };
  }

  const normalizedUserSkills = userSkills.map((s) => s.toLowerCase().trim());
  const normalizedJobSkills = jobSkills.map((s) => s.toLowerCase().trim());

  const matchedSkills = normalizedJobSkills.filter((jobSkill) =>
    normalizedUserSkills.some(
      (userSkill) =>
        userSkill === jobSkill ||
        userSkill.includes(jobSkill) ||
        jobSkill.includes(userSkill)
    )
  );

  const gaps = jobSkills.filter(
    (jobSkill) =>
      !normalizedUserSkills.some(
        (userSkill) =>
          userSkill === jobSkill.toLowerCase() ||
          userSkill.includes(jobSkill.toLowerCase()) ||
          jobSkill.toLowerCase().includes(userSkill)
      )
  );

  const score = matchedSkills.length / normalizedJobSkills.length;
  return { score, gaps };
}

function calculateExperienceScore(
  userYears: number | null,
  jobLevel: string
): number {
  if (userYears === null) {
    return 0.5;
  }

  const levelLower = jobLevel.toLowerCase();
  let range = EXPERIENCE_LEVEL_YEARS[levelLower];

  if (!range) {
    const matchedKey = Object.keys(EXPERIENCE_LEVEL_YEARS).find((key) =>
      levelLower.includes(key)
    );
    range = matchedKey ? EXPERIENCE_LEVEL_YEARS[matchedKey] : [0, 5];
  }

  const [minYears, maxYears] = range;

  if (userYears >= minYears && userYears <= maxYears) {
    return 1.0;
  }

  if (userYears < minYears) {
    const deficit = minYears - userYears;
    return Math.max(0, 1 - deficit * 0.15);
  }

  const surplus = userYears - maxYears;
  return Math.max(0.5, 1 - surplus * 0.05);
}

function calculateLocationScore(
  userLocations: string[],
  jobLocation: string,
  willingToRelocate: boolean
): number {
  if (willingToRelocate) {
    return 0.8;
  }

  const jobLocationParts = normalizeLocation(jobLocation);

  if (
    jobLocationParts.some(
      (part) =>
        part.includes('remote') ||
        part.includes('anywhere') ||
        part.includes('worldwide')
    )
  ) {
    return 1.0;
  }

  const normalizedUserLocations = userLocations.map((l) => l.toLowerCase().trim());

  const hasMatch = normalizedUserLocations.some((userLoc) =>
    jobLocationParts.some(
      (jobLoc) =>
        jobLoc.includes(userLoc) ||
        userLoc.includes(jobLoc) ||
        jobLoc === userLoc
    )
  );

  return hasMatch ? 1.0 : 0.0;
}

function calculateIndustryScore(
  userIndustries: string[],
  jobIndustry: string
): number {
  const normalizedUserIndustries = userIndustries.map((i) =>
    i.toLowerCase().trim()
  );
  const normalizedJobIndustry = jobIndustry.toLowerCase().trim();

  const exactMatch = normalizedUserIndustries.includes(normalizedJobIndustry);
  if (exactMatch) return 1.0;

  const partialMatch = normalizedUserIndustries.some(
    (i) =>
      i.includes(normalizedJobIndustry) || normalizedJobIndustry.includes(i)
  );
  return partialMatch ? 0.7 : 0.3;
}

function calculateJobTypeScore(
  userJobTypes: string[],
  jobType: string
): number {
  const normalizedUserTypes = userJobTypes.map((t) => t.toLowerCase().trim());
  const normalizedJobType = jobType.toLowerCase().trim();

  return normalizedUserTypes.includes(normalizedJobType) ? 1.0 : 0.0;
}

function calculateSalaryScore(
  userSalaryMin: number | null,
  userSalaryMax: number | null,
  jobSalaryMin: number | null,
  jobSalaryMax: number | null
): number {
  if (!userSalaryMin && !userSalaryMax) return 0.8;
  if (!jobSalaryMin && !jobSalaryMax) return 0.5;

  const userMin = userSalaryMin || 0;
  const userMax = userSalaryMax || Number.MAX_SAFE_INTEGER;
  const jobMin = jobSalaryMin || 0;
  const jobMax = jobSalaryMax || Number.MAX_SAFE_INTEGER;

  const overlapMin = Math.max(userMin, jobMin);
  const overlapMax = Math.min(userMax, jobMax);

  if (overlapMin <= overlapMax) {
    return 1.0;
  }

  if (userMin > (jobSalaryMax || 0)) {
    const gap = userMin - (jobSalaryMax || 0);
    const percentage = gap / userMin;
    return Math.max(0, 1 - percentage);
  }

  return 0.3;
}

export class JobMatchingService {
  async calculateJobMatch(userId: string, jobId: string): Promise<MatchResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        preferences: true,
        resumes: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    const job = await prisma.jobListing.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundError('Job listing');
    }

    const preferences = user.preferences;
    const activeResume = user.resumes[0] || null;
    const userSkills = activeResume?.skills || [];
    const userExperienceYears = activeResume?.experienceYears || null;

    const { score: skillScore, gaps: skillGaps } = calculateSkillScore(
      userSkills,
      job.skills
    );

    const experienceScore = calculateExperienceScore(
      userExperienceYears,
      job.experienceLevel
    );

    const locationScore = calculateLocationScore(
      preferences?.locations || [],
      job.location,
      preferences?.willingToRelocate || false
    );

    const industryScore = calculateIndustryScore(
      preferences?.industries || [],
      job.industry
    );

    const jobTypeScore = calculateJobTypeScore(
      preferences?.jobTypes || [],
      job.jobType
    );

    const salaryScore = calculateSalaryScore(
      preferences?.salaryMin || null,
      preferences?.salaryMax || null,
      job.salaryMin,
      job.salaryMax
    );

    const matchScore =
      skillScore * 0.4 +
      experienceScore * 0.25 +
      locationScore * 0.1 +
      industryScore * 0.1 +
      jobTypeScore * 0.1 +
      salaryScore * 0.05;

    const matchReasons: MatchReason[] = [];

    if (skillScore >= 0.7) {
      matchReasons.push({
        category: 'skills',
        score: skillScore,
        description: `Strong skill match: ${Math.round(skillScore * 100)}% of required skills matched`,
      });
    } else if (skillScore >= 0.4) {
      matchReasons.push({
        category: 'skills',
        score: skillScore,
        description: `Moderate skill match: ${Math.round(skillScore * 100)}% of required skills matched`,
      });
    }

    if (experienceScore >= 0.8) {
      matchReasons.push({
        category: 'experience',
        score: experienceScore,
        description: `Experience level aligns well with ${job.experienceLevel} requirement`,
      });
    }

    if (locationScore === 1.0) {
      matchReasons.push({
        category: 'location',
        score: locationScore,
        description: job.location.toLowerCase().includes('remote')
          ? 'Remote position matches your work preferences'
          : `Location matches your preferred areas`,
      });
    }

    if (industryScore >= 0.7) {
      matchReasons.push({
        category: 'industry',
        score: industryScore,
        description: `Industry alignment with ${job.industry}`,
      });
    }

    if (jobTypeScore === 1.0) {
      matchReasons.push({
        category: 'jobType',
        score: jobTypeScore,
        description: `Job type (${job.jobType}) matches your preferences`,
      });
    }

    if (salaryScore >= 0.8) {
      matchReasons.push({
        category: 'salary',
        score: salaryScore,
        description: 'Salary range aligns with your expectations',
      });
    }

    return {
      matchScore: Math.round(matchScore * 100) / 100,
      skillScore: Math.round(skillScore * 100) / 100,
      experienceScore: Math.round(experienceScore * 100) / 100,
      locationScore: Math.round(locationScore * 100) / 100,
      industryScore: Math.round(industryScore * 100) / 100,
      jobTypeScore: Math.round(jobTypeScore * 100) / 100,
      salaryScore: Math.round(salaryScore * 100) / 100,
      matchReasons,
      skillGaps,
    };
  }

  async computeAndSaveMatch(userId: string, jobId: string): Promise<void> {
    const result = await this.calculateJobMatch(userId, jobId);

    await prisma.jobMatch.upsert({
      where: { userId_jobId: { userId, jobId } },
      create: {
        userId,
        jobId,
        matchScore: result.matchScore,
        skillScore: result.skillScore,
        experienceScore: result.experienceScore,
        locationScore: result.locationScore,
        matchReasons: result.matchReasons as unknown as Prisma.JsonArray,
        skillGaps: result.skillGaps,
      },
      update: {
        matchScore: result.matchScore,
        skillScore: result.skillScore,
        experienceScore: result.experienceScore,
        locationScore: result.locationScore,
        matchReasons: result.matchReasons as unknown as Prisma.JsonArray,
        skillGaps: result.skillGaps,
      },
    });
  }
}

export const jobMatchingService = new JobMatchingService();

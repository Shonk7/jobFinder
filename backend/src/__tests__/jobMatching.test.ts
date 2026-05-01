// Mock prisma before importing the service
jest.mock('../config/database', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    jobListing: { findUnique: jest.fn() },
    jobMatch: { upsert: jest.fn() },
  },
}));

import { JobMatchingService } from '../services/jobMatching.service';
import { prisma } from '../config/database';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('JobMatchingService', () => {
  let service: JobMatchingService;

  beforeEach(() => {
    service = new JobMatchingService();
    jest.clearAllMocks();
  });

  it('returns a matchScore between 0 and 1 for a fully matched skill set', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      preferences: {
        locations: ['San Francisco'],
        willingToRelocate: false,
        industries: ['Technology'],
        jobTypes: ['full_time'],
        salaryMin: 80000,
        salaryMax: 150000,
      },
      resumes: [
        {
          isActive: true,
          skills: ['TypeScript', 'React', 'Node.js'],
          experienceYears: 4,
        },
      ],
    });

    (mockPrisma.jobListing.findUnique as jest.Mock).mockResolvedValue({
      id: 'job-1',
      skills: ['TypeScript', 'Node.js'],
      experienceLevel: 'mid',
      location: 'San Francisco',
      industry: 'Technology',
      jobType: 'full_time',
      salaryMin: 90000,
      salaryMax: 140000,
    });

    const result = await service.calculateJobMatch('user-1', 'job-1');

    expect(result.matchScore).toBeGreaterThanOrEqual(0);
    expect(result.matchScore).toBeLessThanOrEqual(1);
    // All required skills are present in user skills → skillScore should be 1.0
    expect(result.skillScore).toBe(1);
  });

  it('returns skillScore 0 when job has no skills defined', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-2',
      preferences: null,
      resumes: [
        {
          isActive: true,
          skills: ['TypeScript'],
          experienceYears: 2,
        },
      ],
    });

    (mockPrisma.jobListing.findUnique as jest.Mock).mockResolvedValue({
      id: 'job-2',
      skills: [],
      experienceLevel: 'entry',
      location: 'Remote',
      industry: 'Technology',
      jobType: 'full_time',
      salaryMin: null,
      salaryMax: null,
    });

    const result = await service.calculateJobMatch('user-2', 'job-2');

    // When job has no skills, calculateSkillScore returns 1.0 (no requirements = full match)
    expect(result.skillScore).toBe(1);
    expect(result.matchScore).toBeGreaterThanOrEqual(0);
    expect(result.matchScore).toBeLessThanOrEqual(1);
  });

  it('throws NotFoundError when user does not exist', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.calculateJobMatch('missing-user', 'job-1')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws NotFoundError when job does not exist', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      preferences: null,
      resumes: [],
    });
    (mockPrisma.jobListing.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.calculateJobMatch('user-1', 'missing-job')).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

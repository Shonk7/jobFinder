import fs from 'fs';
import path from 'path';

export interface ParsedResume {
  skills: string[];
  experienceYears: number;
  educationLevel: string;
  rawText: string;
  summary: string;
  jobTitles: string[];
  languages: string[];
}

const SKILLS_DICTIONARY: Record<string, string[]> = {
  frontend: [
    'JavaScript',
    'TypeScript',
    'React',
    'Vue.js',
    'Angular',
    'HTML',
    'CSS',
    'Sass',
    'Tailwind CSS',
    'Next.js',
  ],
  backend: [
    'Node.js',
    'Express',
    'Python',
    'Django',
    'FastAPI',
    'Java',
    'Spring Boot',
    'Go',
    'Rust',
    'PHP',
    'Laravel',
    'Ruby on Rails',
  ],
  database: [
    'PostgreSQL',
    'MySQL',
    'MongoDB',
    'Redis',
    'Elasticsearch',
    'SQLite',
    'DynamoDB',
    'Cassandra',
  ],
  devops: [
    'Docker',
    'Kubernetes',
    'AWS',
    'GCP',
    'Azure',
    'CI/CD',
    'Terraform',
    'Ansible',
    'Jenkins',
    'GitHub Actions',
  ],
  data: [
    'Python',
    'R',
    'TensorFlow',
    'PyTorch',
    'scikit-learn',
    'Pandas',
    'NumPy',
    'SQL',
    'Tableau',
    'Power BI',
  ],
  mobile: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'iOS', 'Android'],
};

const EDUCATION_LEVELS: Record<string, string> = {
  phd: 'PhD',
  doctorate: 'PhD',
  masters: 'Masters',
  msc: 'Masters',
  mba: 'Masters',
  bachelors: 'Bachelors',
  bsc: 'Bachelors',
  ba: 'Bachelors',
  be: 'Bachelors',
  btech: 'Bachelors',
  associate: 'Associate',
  diploma: 'Diploma',
  bootcamp: 'Bootcamp',
  certificate: 'Certificate',
};

function detectSkillsFromFileName(fileName: string): string[] {
  const lower = fileName.toLowerCase();
  const detected: Set<string> = new Set();

  for (const [category, skills] of Object.entries(SKILLS_DICTIONARY)) {
    if (lower.includes(category)) {
      skills.slice(0, 5).forEach((s) => detected.add(s));
    }
  }

  if (detected.size === 0) {
    const defaultSkills = [
      'JavaScript',
      'TypeScript',
      'Node.js',
      'React',
      'PostgreSQL',
    ];
    defaultSkills.forEach((s) => detected.add(s));
  }

  return Array.from(detected);
}

function detectExperienceFromFileName(fileName: string): number {
  const lower = fileName.toLowerCase();
  const yearMatch = lower.match(/(\d+)\s*(?:yr|year)/);
  if (yearMatch) {
    const years = parseInt(yearMatch[1], 10);
    return Math.min(years, 40);
  }
  if (lower.includes('senior') || lower.includes('sr')) return 6;
  if (lower.includes('mid') || lower.includes('intermediate')) return 3;
  if (lower.includes('junior') || lower.includes('jr')) return 1;
  if (lower.includes('lead') || lower.includes('principal')) return 8;
  return 3;
}

function detectEducationFromFileName(fileName: string): string {
  const lower = fileName.toLowerCase();
  for (const [keyword, level] of Object.entries(EDUCATION_LEVELS)) {
    if (lower.includes(keyword)) {
      return level;
    }
  }
  return 'Bachelors';
}

function readFileContent(filePath: string): string {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > 10 * 1024 * 1024) {
      return '';
    }
    const buffer = fs.readFileSync(filePath);
    return buffer.toString('utf-8', 0, Math.min(buffer.length, 50000));
  } catch {
    return '';
  }
}

function extractSkillsFromText(text: string): string[] {
  const allSkills = Object.values(SKILLS_DICTIONARY).flat();
  const found: Set<string> = new Set();

  for (const skill of allSkills) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(text)) {
      found.add(skill);
    }
  }

  return Array.from(found);
}

function extractExperienceFromText(text: string): number | null {
  const patterns = [
    /(\d+)\+?\s*years?\s+of\s+(?:professional\s+)?experience/i,
    /(\d+)\+?\s*years?\s+experience/i,
    /experience\s+of\s+(\d+)\+?\s*years?/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const years = parseInt(match[1], 10);
      if (years >= 0 && years <= 50) {
        return years;
      }
    }
  }

  return null;
}

function extractEducationFromText(text: string): string | null {
  const lower = text.toLowerCase();
  if (
    lower.includes('ph.d') ||
    lower.includes('phd') ||
    lower.includes('doctor of')
  ) {
    return 'PhD';
  }
  if (
    lower.includes('master') ||
    lower.includes('m.s.') ||
    lower.includes('m.sc') ||
    lower.includes('mba')
  ) {
    return 'Masters';
  }
  if (
    lower.includes('bachelor') ||
    lower.includes('b.s.') ||
    lower.includes('b.sc') ||
    lower.includes('b.a.') ||
    lower.includes('b.e.') ||
    lower.includes('b.tech')
  ) {
    return 'Bachelors';
  }
  if (lower.includes('associate')) {
    return 'Associate';
  }
  if (lower.includes('diploma')) {
    return 'Diploma';
  }
  return null;
}

export const parseResume = async (filePath: string): Promise<ParsedResume> => {
  const fileName = path.basename(filePath, path.extname(filePath));
  const fileContent = readFileContent(filePath);

  let skills: string[];
  let experienceYears: number;
  let educationLevel: string;

  if (fileContent.length > 100) {
    skills = extractSkillsFromText(fileContent);
    const textExperience = extractExperienceFromText(fileContent);
    experienceYears =
      textExperience !== null
        ? textExperience
        : detectExperienceFromFileName(fileName);
    const textEducation = extractEducationFromText(fileContent);
    educationLevel =
      textEducation !== null
        ? textEducation
        : detectEducationFromFileName(fileName);
  } else {
    skills = detectSkillsFromFileName(fileName);
    experienceYears = detectExperienceFromFileName(fileName);
    educationLevel = detectEducationFromFileName(fileName);
  }

  if (skills.length === 0) {
    skills = detectSkillsFromFileName(fileName);
  }

  const jobTitles = extractJobTitlesFromText(fileContent || fileName);
  const languages = extractLanguagesFromText(fileContent || fileName);

  return {
    skills,
    experienceYears,
    educationLevel,
    rawText: fileContent.slice(0, 5000),
    summary: `Professional with ${experienceYears} years of experience. Skills: ${skills.slice(0, 5).join(', ')}.`,
    jobTitles,
    languages,
  };
};

function extractJobTitlesFromText(text: string): string[] {
  const commonTitles = [
    'Software Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Data Scientist',
    'Product Manager',
    'DevOps Engineer',
    'Mobile Developer',
    'Machine Learning Engineer',
    'Cloud Architect',
    'QA Engineer',
    'UI/UX Designer',
    'Technical Lead',
    'Engineering Manager',
  ];

  return commonTitles.filter((title) =>
    new RegExp(title, 'i').test(text)
  );
}

function extractLanguagesFromText(text: string): string[] {
  const programmingLanguages = [
    'JavaScript',
    'TypeScript',
    'Python',
    'Java',
    'C++',
    'C#',
    'Go',
    'Rust',
    'Ruby',
    'PHP',
    'Swift',
    'Kotlin',
    'Scala',
    'R',
    'MATLAB',
  ];

  return programmingLanguages.filter((lang) =>
    new RegExp(`\\b${lang.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)
  );
}

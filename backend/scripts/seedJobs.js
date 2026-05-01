/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const jobs = [
  {
    externalId: 'local-frontend-1',
    title: 'Frontend Engineer',
    company: 'Northstar Labs',
    location: 'Remote',
    description: 'Build responsive product features with React and TypeScript.',
    requirements: ['3+ years frontend development', 'Strong React fundamentals'],
    responsibilities: ['Ship UI features', 'Work with designers and product managers'],
    skills: ['React', 'TypeScript', 'Next.js', 'CSS'],
    salaryMin: 120000,
    salaryMax: 160000,
    salaryCurrency: 'USD',
    jobType: 'full_time',
    industry: 'Technology',
    experienceLevel: 'mid',
    postedDate: new Date(),
    applicationDeadline: null,
    source: 'manual-local-seed',
  },
  {
    externalId: 'local-fullstack-2',
    title: 'Full Stack Developer',
    company: 'Orbit Commerce',
    location: 'Sydney, AU',
    description: 'Develop backend APIs and frontend experiences for ecommerce workflows.',
    requirements: ['Experience with Node.js and relational databases'],
    responsibilities: ['Own features end-to-end', 'Maintain system reliability'],
    skills: ['Node.js', 'PostgreSQL', 'React', 'REST APIs'],
    salaryMin: 110000,
    salaryMax: 145000,
    salaryCurrency: 'AUD',
    jobType: 'full_time',
    industry: 'E-commerce',
    experienceLevel: 'mid',
    postedDate: new Date(),
    applicationDeadline: null,
    source: 'manual-local-seed',
  },
  {
    externalId: 'local-product-3',
    title: 'Product Engineer',
    company: 'Pixel & Pine',
    location: 'Melbourne, AU',
    description: 'Work across product and engineering to rapidly ship customer-facing features.',
    requirements: ['Comfortable with fast-paced product development'],
    responsibilities: ['Prototype and ship', 'Collaborate with users and support'],
    skills: ['JavaScript', 'APIs', 'UX', 'Problem Solving'],
    salaryMin: 100000,
    salaryMax: 130000,
    salaryCurrency: 'AUD',
    jobType: 'contract',
    industry: 'Technology',
    experienceLevel: 'mid',
    postedDate: new Date(),
    applicationDeadline: null,
    source: 'manual-local-seed',
  },
]

async function main() {
  let created = 0
  let updated = 0

  for (const job of jobs) {
    const existing = await prisma.jobListing.findUnique({
      where: { externalId: job.externalId },
      select: { id: true },
    })

    if (existing) {
      await prisma.jobListing.update({
        where: { externalId: job.externalId },
        data: {
          ...job,
          isActive: true,
        },
      })
      updated += 1
    } else {
      await prisma.jobListing.create({
        data: {
          ...job,
          isActive: true,
          isFeatured: false,
        },
      })
      created += 1
    }
  }

  console.log(`Seed complete. Created: ${created}, Updated: ${updated}`)
}

main()
  .catch((err) => {
    console.error('Seeding failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

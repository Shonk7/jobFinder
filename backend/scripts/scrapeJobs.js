/* eslint-disable no-console */
'use strict'

const { PrismaClient } = require('@prisma/client')
const { load } = require('cheerio')

const prisma = new PrismaClient()

const args = process.argv.slice(2)
if (args.includes('--help')) {
  console.log(`
node scripts/scrapeJobs.js [options]

  --source=jora|indeed|wwr|remotive|remoteok|all   (default: all)
  --query=<keyword>    Extra filter on top of default tech queries
  --limit=<n>          Per-source cap (default: 200)
  --help
`)
  process.exit(0)
}

const SOURCE  = args.find(a => a.startsWith('--source='))?.split('=')[1] ?? 'all'
const QUERY   = args.find(a => a.startsWith('--query='))?.split('=')[1]  ?? null
const LIMIT   = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] ?? '200', 10)

// ─── Constants ─────────────────────────────────────────────────────────────

// Queries tuned to Aryan's profile: full-stack, React/TS, Python, C#/.NET, Laravel, data engineering, grad/junior roles
const TECH_QUERIES = [
  // Graduate / intern (highest priority — graduating Dec 2026)
  'graduate software engineer',
  'junior software engineer',
  'associate software engineer',
  'software engineering intern',
  'junior developer',
  'graduate developer',

  // General software
  'software engineer',
  'software developer',

  // Full-stack (core profile)
  'full stack developer',
  'full stack engineer',

  // Frontend — React/TypeScript
  'react developer',
  'frontend developer',
  'typescript developer',

  // Backend — Node.js, Python, C#, PHP/Laravel
  'backend developer',
  'backend engineer',
  'node.js developer',
  'python developer',
  'c# developer',
  '.net developer',
  'laravel developer',
  'php developer',

  // Data engineering (Transport for NSW experience)
  'data engineer',
  'junior data engineer',
]

const SKILL_TERMS = [
  'React','Vue','Angular','Next.js','Nuxt','Svelte','TypeScript','JavaScript',
  'Python','Ruby','Rails','Django','FastAPI','Flask','Go','Rust','Java',
  'Kotlin','Scala','PHP','Laravel','Swift','Flutter','React Native',
  'Node.js','Express','NestJS','GraphQL','REST','gRPC',
  'PostgreSQL','MySQL','MongoDB','DynamoDB','Redis','Elasticsearch','Kafka',
  'AWS','GCP','Azure','Docker','Kubernetes','Terraform','CI/CD','GitHub Actions',
  'Git','Linux','Bash','Nginx',
  'Machine Learning','TensorFlow','PyTorch','LangChain','OpenAI',
  'Prisma','SQLAlchemy','Jest','Pytest','Cypress','Playwright',
  'Agile','Scrum','Jira','Figma','Sketch','Tailwind','CSS','HTML',
]

// ─── Helpers ───────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function safeFetch(url, opts = {}) {
  const r = await fetch(url, {
    ...opts,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'en-AU,en;q=0.9',
      Accept: opts.json ? 'application/json' : 'text/html,application/xhtml+xml,*/*',
      ...(opts.headers ?? {}),
    },
    signal: AbortSignal.timeout(20_000),
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r
}

function parseSalary(str = '') {
  const currency = /€/.test(str) ? 'EUR' : /£/.test(str) ? 'GBP' : 'AUD'
  const nums = [...(str || '').matchAll(/(\d[\d,]*\.?\d*)\s*[kK]?/g)]
    .map(m => { const n = parseFloat(m[1].replace(/,/g, '')); return /[kK]/.test(m[0].slice(m[1].length)) ? n * 1000 : n })
    .filter(n => n >= 30_000 && n <= 1_500_000)
  if (!nums.length) return { min: null, max: null, currency }
  return { min: Math.min(...nums), max: Math.max(...nums), currency }
}

function inferExp(title = '', desc = '') {
  const t = (title + ' ' + desc.slice(0, 400)).toLowerCase()
  if (/\b(senior|sr\.?|lead|principal|staff|head|director|vp|l[456])\b/.test(t)) return 'senior'
  if (/\b(junior|jr\.?|entry.?level|associate|graduate|grad|intern|l[12])\b/.test(t)) return 'junior'
  return 'mid'
}

function normaliseType(t = '') {
  const s = (t || '').toLowerCase().replace(/[\s\-]/g, '_')
  if (s.includes('full')) return 'full_time'
  if (s.includes('part')) return 'part_time'
  if (s.includes('contract') || s.includes('freelance')) return 'contract'
  if (s.includes('intern')) return 'internship'
  return 'full_time'
}

function inferIndustry(tags = [], text = '') {
  const t = (tags.join(' ') + ' ' + text).toLowerCase()
  if (/\bdata|ml|machine.?learn|ai\b|llm|nlp|analytics/.test(t)) return 'Data & AI'
  if (/devops|platform|infra|cloud|sre|kubernetes|terraform/.test(t)) return 'DevOps'
  if (/design|ux|ui|figma/.test(t)) return 'Design'
  if (/product|scrum|agile/.test(t)) return 'Product'
  if (/security|cyber/.test(t)) return 'Security'
  if (/mobile|ios|android|flutter/.test(t)) return 'Mobile'
  return 'Technology'
}

function extractSkills(tags = [], text = '') {
  const tagSkills = tags.map(t => t.trim()).filter(Boolean)
    .map(t => t[0].toUpperCase() + t.slice(1))
  const textSkills = SKILL_TERMS.filter(s =>
    new RegExp(`\\b${s.replace(/[.+]/g, '\\$&')}\\b`, 'i').test(text)
  )
  return [...new Set([...tagSkills, ...textSkills])].slice(0, 18)
}

function stripHtml(h = '') {
  return (h || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim().slice(0, 3000)
}

function isAuOrRemote(loc = '') {
  const l = loc.toLowerCase()
  return l.includes('australia') || l.includes('sydney') || l.includes('melbourne')
    || l.includes('brisbane') || l.includes('perth') || l.includes('adelaide')
    || l.includes('canberra') || l.includes('remote') || l.includes('worldwide')
    || l.includes('anywhere') || l.includes('global') || l.includes('apac') || l === ''
}

// Exclude roles clearly outside Aryan's profile (designer, PM, ML researcher, network, etc.)
const ROLE_EXCLUDE = [
  'ux', 'ui designer', 'graphic designer', 'visual designer', 'product designer',
  'product manager', 'project manager', 'scrum master', 'agile coach',
  'machine learning', 'ml engineer', 'ai researcher', 'data scientist',
  'devops', 'sre ', 'site reliability', 'network engineer', 'systems administrator',
  'ios developer', 'android developer', 'mobile developer',
  'sales', 'marketing', 'recruiter', 'hr ', 'finance', 'accounting',
  'hardware engineer', 'electrical engineer', 'mechanical engineer',
]

function isRelevantRole(title = '') {
  const t = title.toLowerCase()
  return !ROLE_EXCLUDE.some(x => t.includes(x))
}

function matchesQuery(fields, q) {
  if (!q) return true
  const lq = q.toLowerCase()
  return fields.some(f => (f || '').toLowerCase().includes(lq))
}

function stableId(...parts) {
  const key = parts.join('|')
  let h = 5381
  for (let i = 0; i < key.length; i++) h = ((h << 5) + h) ^ key.charCodeAt(i)
  return (h >>> 0).toString(36)
}

// ─── Source: Jora AU ──────────────────────────────────────────────────────
async function scrapeJora(query, limit) {
  console.log('  ↳ Jora AU...')
  const queries = query ? [query] : TECH_QUERIES
  const PAGES   = 4   // pages per query
  const all     = []
  const seen    = new Set()

  for (const q of queries) {
    if (all.length >= limit) break
    for (let page = 1; page <= PAGES; page++) {
      if (all.length >= limit) break
      const url = `https://au.jora.com/jobs?q=${encodeURIComponent(q)}&l=Sydney+NSW&p=${page}`
      try {
        const r   = await safeFetch(url, { headers: { Accept: 'text/html' } })
        const $   = load(await r.text())
        let found = 0

        // Jora wraps jobs in <article> or divs with data-job-id
        $('article, [data-job-id], .result').each((_, el) => {
          const $e     = $(el)
          const title  = $e.find('[class*="title"], h2, h3').first().text().trim()
          if (!title || !isRelevantRole(title)) return
          const company  = $e.find('[class*="company"]').first().text().trim() || 'Unknown'
          const loc      = $e.find('[class*="location"]').first().text().trim() || 'Sydney, NSW'
          const salary   = $e.find('[class*="salary"]').first().text().trim()
          const snippet  = $e.find('[class*="snippet"], [class*="teaser"], [class*="abstract"]').first().text().trim()
          const href     = $e.find('a[href]').first().attr('href') || ''
          const jobUrl   = href.startsWith('http') ? href : href ? `https://au.jora.com${href}` : null

          const id = stableId('jora', title, company, loc)
          if (seen.has(id)) return
          seen.add(id)

          const sal = parseSalary(salary)
          all.push({
            externalId: `jora-${id}`,
            title, company,
            location: loc,
            description: snippet || `${title} at ${company} in Sydney.`,
            requirements: [], responsibilities: [],
            skills: extractSkills([], title + ' ' + snippet),
            salaryMin: sal.min, salaryMax: sal.max, salaryCurrency: 'AUD',
            jobType: 'full_time',
            industry: inferIndustry([], title),
            experienceLevel: inferExp(title, snippet),
            postedDate: new Date(),
            url: jobUrl,
            source: 'jora',
          })
          found++
        })

        if (found === 0) break  // no more pages
        await sleep(600 + Math.random() * 400)
      } catch (e) {
        console.warn(`    jora "${q}" p${page}: ${e.message}`)
        break
      }
    }
    await sleep(300)
  }

  console.log(`    → ${all.length} from Jora AU`)
  return all.slice(0, limit)
}

// ─── Source: Indeed AU ────────────────────────────────────────────────────
async function scrapeIndeed(query, limit) {
  console.log('  ↳ Indeed AU (Sydney)...')
  const queries = query ? [query] : TECH_QUERIES.slice(0, 12)
  const all     = []
  const seen    = new Set()

  for (const q of queries) {
    if (all.length >= limit) break
    for (let start = 0; start <= 30; start += 10) {
      if (all.length >= limit) break
      const url = `https://au.indeed.com/jobs?q=${encodeURIComponent(q)}&l=Sydney+NSW&start=${start}&fromage=30`
      try {
        const r  = await safeFetch(url, { headers: { Accept: 'text/html', Referer: 'https://au.indeed.com/' } })
        const $  = load(await r.text())
        let found = 0

        $('[data-jk], .job_seen_beacon, .jobsearch-ResultsList > li').each((_, el) => {
          const $e    = $(el)
          const jk    = $e.attr('data-jk') || $e.find('[data-jk]').attr('data-jk')
          const title = $e.find('[class*="jobTitle"] a, h2.jobTitle').first().text().trim()
            || $e.find('a[data-jk]').first().text().trim()
          if (!title || title.length < 3 || !isRelevantRole(title)) return

          const company  = $e.find('[class*="companyName"], .companyInfo').first().text().trim() || 'Unknown'
          const loc      = $e.find('[class*="companyLocation"]').first().text().trim() || 'Sydney, NSW'
          const salary   = $e.find('[class*="salary"], .salary-snippet').first().text().trim()
          const snippet  = $e.find('[class*="job-snippet"], .summary').first().text().trim()
          const jobUrl   = jk ? `https://au.indeed.com/viewjob?jk=${jk}` : null

          const id = stableId('indeed', title, company, loc)
          if (seen.has(id)) return
          seen.add(id)

          const sal = parseSalary(salary)
          all.push({
            externalId: `indeed-${id}`,
            title, company,
            location: loc.includes('NSW') || loc.includes('Sydney') ? loc : `${loc}, NSW`,
            description: snippet || `${title} role at ${company}.`,
            requirements: [], responsibilities: [],
            skills: extractSkills([], title + ' ' + snippet),
            salaryMin: sal.min, salaryMax: sal.max, salaryCurrency: 'AUD',
            jobType: 'full_time',
            industry: inferIndustry([], title),
            experienceLevel: inferExp(title, snippet),
            postedDate: new Date(),
            url: jobUrl,
            source: 'indeed',
          })
          found++
        })

        if (found === 0) break
        await sleep(700 + Math.random() * 600)
      } catch (e) {
        console.warn(`    indeed "${q}": ${e.message}`)
        break
      }
    }
    await sleep(400)
  }

  console.log(`    → ${all.length} from Indeed AU`)
  return all.slice(0, limit)
}

// ─── Source: We Work Remotely (RSS) ───────────────────────────────────────
async function scrapeWWR(query, limit) {
  console.log('  ↳ We Work Remotely (RSS)...')
  const FEEDS = [
    'https://weworkremotely.com/categories/remote-programming-jobs.rss',
    'https://weworkremotely.com/categories/remote-data-science-jobs.rss',
  ]
  const all  = []
  const seen = new Set()

  for (const feed of FEEDS) {
    try {
      const r  = await safeFetch(feed, { headers: { Accept: 'application/rss+xml, application/xml, text/xml' } })
      const $  = load(await r.text(), { xmlMode: true })

      $('item').each((_, el) => {
        const $e      = $(el)
        const title   = $e.find('title').text().trim().replace(/<!\[CDATA\[|\]\]>/g, '')
        const company = $e.find('company, region').first().text().trim() || 'Unknown'
        const link    = $e.find('link').text().trim() || $e.find('url').text().trim()
        const desc    = stripHtml($e.find('description').text())
        const pub     = $e.find('pubDate').text().trim()

        if (!title || title.length < 3 || !isRelevantRole(title)) return
        if (query && !matchesQuery([title, company, desc], query)) return

        const id = stableId('wwr', title, company)
        if (seen.has(id)) return
        seen.add(id)

        all.push({
          externalId: `wwr-${id}`,
          title, company,
          location: 'Remote (AU-friendly)',
          description: desc || title,
          requirements: [], responsibilities: [],
          skills: extractSkills([], title + ' ' + desc),
          salaryMin: null, salaryMax: null, salaryCurrency: 'USD',
          jobType: 'full_time',
          industry: inferIndustry([], title + ' ' + feed),
          experienceLevel: inferExp(title, desc),
          postedDate: pub ? new Date(pub) : new Date(),
          url: link || null,
          source: 'wwr',
        })
      })
      await sleep(400)
    } catch (e) {
      console.warn(`    wwr: ${e.message}`)
    }
  }

  console.log(`    → ${all.length} from We Work Remotely`)
  return all.slice(0, limit)
}

// ─── Source: Remotive ─────────────────────────────────────────────────────
async function scrapeRemotive(query, limit) {
  console.log('  ↳ Remotive...')
  const CATS = ['software-dev', 'data']
  const all  = []

  for (const cat of CATS) {
    if (all.length >= limit) break
    try {
      const r    = await safeFetch(`https://remotive.com/api/remote-jobs?category=${cat}&limit=100`, { json: true })
      const data = await r.json()
      const jobs = (data.jobs ?? []).filter(j => isAuOrRemote(j.candidate_required_location))
      all.push(...jobs)
    } catch (e) { console.warn(`    remotive/${cat}: ${e.message}`) }
  }

  const filtered = all
    .filter(j => isRelevantRole(j.title))
    .filter(j => !query || matchesQuery([j.title, j.company_name, ...(j.tags ?? [])], query))

  return filtered.map(j => {
    const sal = parseSalary(j.salary)
    const desc = stripHtml(j.description)
    return {
      externalId: `remotive-${j.id}`,
      title: j.title, company: j.company_name,
      location: j.candidate_required_location || 'Remote',
      description: desc, requirements: [], responsibilities: [],
      skills: extractSkills(j.tags ?? [], desc),
      salaryMin: sal.min, salaryMax: sal.max, salaryCurrency: sal.currency,
      jobType: normaliseType(j.job_type),
      industry: inferIndustry(j.tags ?? [], j.category ?? ''),
      experienceLevel: inferExp(j.title, desc),
      postedDate: j.publication_date ? new Date(j.publication_date) : new Date(),
      url: j.url || null,
      source: 'remotive',
    }
  }).slice(0, limit)
}

// ─── Source: RemoteOK ─────────────────────────────────────────────────────
async function scrapeRemoteOK(query, limit) {
  console.log('  ↳ RemoteOK...')
  try {
    const r    = await safeFetch('https://remoteok.com/api', { json: true })
    const data = await r.json()
    const jobs = (Array.isArray(data) ? data : [])
      .filter(j => j.id && j.position)
      .filter(j => isAuOrRemote(j.location || ''))

    const filtered = jobs
      .filter(j => isRelevantRole(j.position))
      .filter(j => !query || matchesQuery([j.position, j.company, ...(j.tags ?? [])], query))

    return filtered.slice(0, limit).map(j => {
      const desc = stripHtml(j.description)
      return {
        externalId: `remoteok-${j.id}`,
        title: j.position, company: j.company || 'Unknown',
        location: j.location || 'Remote',
        description: desc, requirements: [], responsibilities: [],
        skills: extractSkills(j.tags ?? [], desc),
        salaryMin: j.salary_min ?? null, salaryMax: j.salary_max ?? null, salaryCurrency: 'USD',
        jobType: 'full_time',
        industry: inferIndustry(j.tags ?? [], ''),
        experienceLevel: inferExp(j.position, desc),
        postedDate: j.epoch ? new Date(j.epoch * 1000) : new Date(),
        url: j.apply_url || j.url || null,
        source: 'remoteok',
      }
    })
  } catch (e) {
    console.warn(`    remoteok: ${e.message}`)
    return []
  }
}

// ─── Upsert ────────────────────────────────────────────────────────────────
async function upsertAll(jobs) {
  let created = 0, updated = 0, failed = 0
  // batch in chunks to avoid overwhelming DB
  const CHUNK = 20
  for (let i = 0; i < jobs.length; i += CHUNK) {
    const chunk = jobs.slice(i, i + CHUNK)
    await Promise.all(chunk.map(async job => {
      try {
        const ex = await prisma.jobListing.findUnique({ where: { externalId: job.externalId }, select: { id: true } })
        if (ex) {
          await prisma.jobListing.update({ where: { externalId: job.externalId }, data: { ...job, isActive: true } })
          updated++
        } else {
          await prisma.jobListing.create({ data: { ...job, isActive: true, isFeatured: false } })
          created++
        }
      } catch (e) {
        failed++
        if (failed <= 3) console.warn(`  ⚠ "${job.title}": ${e.message.slice(0, 80)}`)
      }
    }))
  }
  return { created, updated, failed }
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  const t0 = Date.now()
  console.log('\n╔══════════════════════════════════════════╗')
  console.log('║   JobFinder — Sydney/AU Multi-Scraper   ║')
  console.log('╚══════════════════════════════════════════╝')
  console.log(`  Sources: ${SOURCE}  |  Query: ${QUERY ?? 'all tech'}  |  Limit: ${LIMIT}/source\n`)

  const jobs = []

  if (SOURCE === 'all' || SOURCE === 'jora')     jobs.push(...await scrapeJora(QUERY, LIMIT))
  if (SOURCE === 'all' || SOURCE === 'indeed')   jobs.push(...await scrapeIndeed(QUERY, LIMIT))
  if (SOURCE === 'all' || SOURCE === 'wwr')      jobs.push(...await scrapeWWR(QUERY, LIMIT))
  if (SOURCE === 'all' || SOURCE === 'remotive') jobs.push(...await scrapeRemotive(QUERY, LIMIT))
  if (SOURCE === 'all' || SOURCE === 'remoteok') jobs.push(...await scrapeRemoteOK(QUERY, LIMIT))

  if (!jobs.length) { console.log('\n  Nothing fetched — check your network.'); return }

  console.log(`\n  Total fetched: ${jobs.length} — saving to DB...`)
  const s = await upsertAll(jobs)
  const total = await prisma.jobListing.count({ where: { isActive: true } })

  console.log('\n╔══════════════════════════════════════════╗')
  console.log(`║  Created  : ${String(s.created).padEnd(30)}║`)
  console.log(`║  Updated  : ${String(s.updated).padEnd(30)}║`)
  console.log(`║  Failed   : ${String(s.failed).padEnd(30)}║`)
  console.log(`║  DB total : ${String(total + ' active jobs').padEnd(30)}║`)
  console.log(`║  Time     : ${String(((Date.now() - t0) / 1000).toFixed(1) + 's').padEnd(30)}║`)
  console.log('╚══════════════════════════════════════════╝\n')
}

main()
  .catch(e => { console.error('Crash:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())

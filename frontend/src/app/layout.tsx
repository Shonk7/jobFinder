import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'JobFinder — AI-Powered Job Matching',
    template: '%s | JobFinder',
  },
  description:
    'Find your perfect role with AI-powered resume parsing and intelligent job matching. Upload your resume, set preferences, and let our engine surface the jobs that matter.',
  keywords: ['job search', 'AI jobs', 'resume matching', 'career', 'job finder'],
  authors: [{ name: 'JobFinder' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://jobfinder.app',
    siteName: 'JobFinder',
    title: 'JobFinder — AI-Powered Job Matching',
    description: 'Find your perfect role with AI-powered resume parsing and intelligent job matching.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JobFinder — AI-Powered Job Matching',
    description: 'Find your perfect role with AI-powered resume parsing.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-text font-body antialiased">
        {children}
      </body>
    </html>
  )
}

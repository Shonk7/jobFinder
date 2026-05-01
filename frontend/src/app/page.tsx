import Navbar from '@/components/layout/Navbar'
import Hero from '@/components/landing/Hero'
import Features from '@/components/landing/Features'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function LandingPage() {
  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Features />

        {/* How it works */}
        <section id="how-it-works" className="relative py-28 bg-surface/30">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background opacity-50" />
          <div className="relative z-10 max-w-5xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-text mb-4">
                From resume to offer{' '}
                <span className="text-gradient-cyan">in 3 steps</span>
              </h2>
              <p className="text-muted text-lg">No cold applications. No guesswork. Just intelligent matching.</p>
            </div>

            <div className="relative">
              {/* Connector line */}
              <div className="hidden md:block absolute top-12 left-1/2 -translate-x-1/2 w-[70%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    step: '01',
                    title: 'Upload Resume',
                    desc: 'Drop your resume and our NLP engine instantly extracts your skills, experience, and career context.',
                    icon: '📄',
                    color: 'text-primary border-primary/30 bg-primary/10',
                  },
                  {
                    step: '02',
                    title: 'Set Preferences',
                    desc: 'Tell us your ideal role, location, salary range, and work style — takes under 2 minutes.',
                    icon: '⚙️',
                    color: 'text-purple-400 border-secondary/30 bg-secondary/10',
                  },
                  {
                    step: '03',
                    title: 'Get Matched',
                    desc: 'Our AI scores thousands of live listings against your profile and delivers your top matches daily.',
                    icon: '🎯',
                    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
                  },
                ].map((item) => (
                  <div key={item.step} className="relative text-center">
                    <div className={`inline-flex items-center justify-center h-24 w-24 rounded-2xl border text-4xl mb-6 mx-auto ${item.color}`}>
                      {item.icon}
                    </div>
                    <div className={`absolute -top-2 -right-2 md:-top-3 md:-right-6 font-display text-5xl font-bold opacity-10 ${item.color.split(' ')[0]}`}>
                      {item.step}
                    </div>
                    <h3 className="font-display text-xl font-bold text-text mb-3">{item.title}</h3>
                    <p className="text-muted text-sm leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-28 overflow-hidden">
          <div className="absolute inset-0 mesh-bg" />
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 border border-primary/30 text-primary mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-cyan" />
              Free to start. No credit card required.
            </div>
            <h2 className="font-display text-4xl md:text-6xl font-bold text-text mb-6">
              Your next role is{' '}
              <span className="text-gradient">waiting.</span>
            </h2>
            <p className="text-lg text-muted mb-10 max-w-xl mx-auto">
              Join thousands of professionals who found their dream job faster with AI-powered matching. Upload your resume in 30 seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  }
                >
                  Start for Free
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="lg">
                  Already have an account?
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-secondary opacity-80" />
            <span className="font-display font-bold text-text">
              Job<span className="text-gradient-cyan">Finder</span>
            </span>
          </div>
          <p className="text-sm text-muted">
            © {new Date().getFullYear()} JobFinder. Built with AI for modern job seekers.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted">
            <a href="#" className="hover:text-text transition-colors">Privacy</a>
            <a href="#" className="hover:text-text transition-colors">Terms</a>
            <a href="#" className="hover:text-text transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

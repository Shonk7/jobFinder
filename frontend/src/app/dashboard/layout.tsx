import Sidebar from '@/components/layout/Sidebar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Dashboard',
    template: '%s | JobFinder',
  },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 ml-60 min-h-screen overflow-y-auto">
        <div className="page-enter">
          {children}
        </div>
      </main>
    </div>
  )
}

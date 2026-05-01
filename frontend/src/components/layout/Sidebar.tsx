'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useUserStore } from '@/store/userStore'
import { authApi } from '@/lib/api'
import { getInitials, cn } from '@/lib/utils'

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    exact: true,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/dashboard/upload',
    label: 'Upload Resume',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/preferences',
    label: 'Preferences',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
  },
  {
    href: '/dashboard/applications',
    label: 'Applications',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isGuest, logout } = useUserStore()

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    }
    logout()
    router.push(isGuest ? '/' : '/login')
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-surface border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border flex-shrink-0">
        <div className="relative h-8 w-8 flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-lg opacity-80" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="h-4 w-4 text-white" viewBox="0 0 16 16" fill="none">
              <path d="M2 8C2 4.686 4.686 2 8 2s6 2.686 6 6-2.686 6-6 6-6-2.686-6-6z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="11" cy="11" r="3.5" fill="currentColor" className="text-primary" />
              <path d="M10 11l.8.8L12.5 9.5" stroke="#0a0a0f" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <span className="font-display font-bold text-lg text-text">
          Job<span className="text-gradient-cyan">Finder</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <p className="text-[10px] font-semibold text-muted uppercase tracking-widest px-2 mb-2">
          Main
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    active
                      ? 'text-primary bg-primary/10 border border-primary/20'
                      : 'text-muted hover:text-text hover:bg-surface-2 border border-transparent'
                  )}
                >
                  <span className={cn('flex-shrink-0', active ? 'text-primary' : '')}>
                    {item.icon}
                  </span>
                  {item.label}
                  {active && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                    />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="mt-6">
          <p className="text-[10px] font-semibold text-muted uppercase tracking-widest px-2 mb-2">
            Account
          </p>
          <ul className="space-y-0.5">
            <li>
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-text hover:bg-surface-2 border border-transparent transition-all duration-200"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-border flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-surface-2 transition-colors group">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-background">
              {user ? getInitials(user.firstName, user.lastName) : 'JF'}
            </div>
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 border border-surface" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text truncate leading-tight">
              {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
            </p>
            <p className="text-xs text-muted truncate">{user?.email || ''}</p>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-muted hover:text-danger hover:bg-danger/10"
            title="Sign out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

const navItems = [
  {
    href: '/dashboard',
    label: 'Tableau de bord',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    href: '/factures',
    label: 'Factures',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    href: '/clients',
    label: 'Clients',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
]

const logoutIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

export default function Nav() {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Desktop sidebar — icon only */}
      <aside className="hidden md:flex flex-col w-16 h-screen sticky top-0 border-r border-[#1a1a1a] items-center py-5 gap-1 flex-shrink-0">
        {/* Logo */}
        <div className="w-9 h-9 rounded-xl bg-[#1a1a1a] flex items-center justify-center mb-6">
          <span className="text-xs font-black tracking-tighter text-white select-none">EF</span>
        </div>

        {/* Nav items */}
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                active
                  ? 'bg-white text-black'
                  : 'text-[#444] hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              {item.icon}
            </Link>
          )
        })}

        <div className="flex-1" />

        {/* New invoice shortcut */}
        <Link
          href="/factures/new"
          title="Nouvelle facture"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[#444] hover:text-white hover:bg-[#1a1a1a] transition-all mb-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Déconnexion"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[#444] hover:text-white hover:bg-[#1a1a1a] transition-all"
        >
          {logoutIcon}
        </button>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#000] border-t border-[#1a1a1a] flex z-50">
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[0.6rem] font-bold uppercase tracking-wider transition-colors ${
                active ? 'text-white' : 'text-[#444]'
              }`}
            >
              {item.icon}
              <span>{item.label.split(' ')[0]}</span>
            </Link>
          )
        })}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-[0.6rem] font-bold uppercase tracking-wider text-[#444]"
        >
          {logoutIcon}
          <span>Sortir</span>
        </button>
      </nav>
    </>
  )
}

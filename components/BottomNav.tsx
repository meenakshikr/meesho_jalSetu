'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserRole } from '@/types'
import { Home, Droplets, ClipboardList, Truck, BarChart3, Star, Package, Plus } from 'lucide-react'

const navConfig: Record<UserRole, { href: string; icon: typeof Home; label: string }[]> = {
  resident: [
    { href: '/resident', icon: Home, label: 'Home' },
    { href: '/resident/marketplace', icon: Droplets, label: 'Book' },
  ],
  coordinator: [
    { href: '/coordinator', icon: Home, label: 'Home' },
    { href: '/coordinator/create', icon: Plus, label: 'New' },
    { href: '/coordinator/history', icon: ClipboardList, label: 'History' },
  ],
  driver: [
    { href: '/driver', icon: Package, label: 'Orders' },
  ],
  owner: [
    { href: '/owner', icon: BarChart3, label: 'Dashboard' },
    { href: '/owner/fleet', icon: Truck, label: 'Fleet' },
    { href: '/owner/demand', icon: BarChart3, label: 'Demand' },
    { href: '/owner/reviews', icon: Star, label: 'Reviews' },
  ],
}

export default function BottomNav({ role }: { role: UserRole }) {
  const pathname = usePathname()
  const items = navConfig[role] ?? []

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] bg-[#021B3A]/95 backdrop-blur-md border-t border-[#1E3A5F] z-50 md:hidden">
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {items.map((item) => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-colors">
              <item.icon className={`w-5 h-5 ${active ? 'text-teal-400' : 'text-slate-500'}`} />
              <span className={`text-[10px] font-medium ${active ? 'text-teal-400' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

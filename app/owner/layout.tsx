'use client'

import BottomNav from '@/components/BottomNav'

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <main className="px-4 py-4 pb-24 md:pb-4">{children}</main>
      <BottomNav role="owner" />
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function LoadingBar() {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setVisible(true)
    setProgress(30)
    const t1 = setTimeout(() => setProgress(60), 200)
    const t2 = setTimeout(() => setProgress(85), 600)
    const t3 = setTimeout(() => { setProgress(100); setTimeout(() => { setVisible(false); setProgress(0) }, 300) }, 900)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [pathname])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-transparent">
      <div
        className="h-full transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #0D9488, #14B8A6)',
          boxShadow: '0 0 10px rgba(13,148,136,0.5)',
        }}
      />
    </div>
  )
}

'use client'
import { useTheme } from '@/contexts/ThemeContext'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button onClick={toggle} className="w-10 h-10 rounded-xl bg-[#0A2744] border border-[#1E3A5F] flex items-center justify-center text-slate-400 hover:text-white transition-colors">
      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  )
}

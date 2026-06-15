'use client'
import { createContext, useContext, useEffect, useState } from 'react'

const DarkModeContext = createContext({ dark: false, toggle: () => {} })

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved === 'true') { setDark(true); document.documentElement.setAttribute('data-theme', 'dark') }
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    localStorage.setItem('darkMode', String(next))
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
  }

  return <DarkModeContext.Provider value={{ dark, toggle }}>{children}</DarkModeContext.Provider>
}

export function useDarkMode() { return useContext(DarkModeContext) }

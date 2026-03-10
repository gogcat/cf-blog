'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/lib/store/theme'

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme, currentTheme } = useThemeStore()

  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement
      
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        root.classList.remove('light', 'dark')
        root.classList.add(systemTheme)
      } else {
        root.classList.remove('light', 'dark')
        root.classList.add(theme)
      }

      if (currentTheme && currentTheme.colors) {
        Object.entries(currentTheme.colors).forEach(([key, value]) => {
          root.style.setProperty(`--theme-${key}`, value)
        })
      }

      if (currentTheme && currentTheme.files && currentTheme.files['theme.css']) {
        const oldStyle = document.getElementById('theme-custom-style')
        if (oldStyle) {
          oldStyle.remove()
        }
        
        const style = document.createElement('style')
        style.id = 'theme-custom-style'
        style.textContent = currentTheme.files['theme.css']
        document.head.appendChild(style)
      }
    }

    applyTheme()
  }, [theme, currentTheme])

  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      const root = document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  return <>{children}</>
}

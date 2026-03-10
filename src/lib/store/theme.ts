import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeConfig, ThemeMode, ThemeMetadata } from '@/themes/types'
import { defaultTheme, darkTheme } from '@/themes'

interface ThemeState {
  theme: ThemeMode
  themeName: string
  availableThemes: ThemeMetadata[]
  currentTheme: ThemeConfig | null
  loading: boolean
  
  setTheme: (theme: ThemeMode) => void
  setThemeName: (themeName: string) => void
  loadThemes: () => Promise<void>
  loadCurrentTheme: () => Promise<void>
  activateTheme: (themeId: string) => Promise<void>
  setCurrentTheme: (theme: ThemeConfig | null) => void
  setAvailableThemes: (themes: ThemeMetadata[]) => void
  setLoading: (loading: boolean) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      themeName: 'default',
      availableThemes: [
        {
          id: 'default',
          name: defaultTheme.name,
          description: defaultTheme.description,
          author: defaultTheme.author,
          version: defaultTheme.version,
          isDefault: true,
          r2Key: '',
          configJson: JSON.stringify(defaultTheme),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'dark',
          name: darkTheme.name,
          description: darkTheme.description,
          author: darkTheme.author,
          version: darkTheme.version,
          isDefault: false,
          r2Key: '',
          configJson: JSON.stringify(darkTheme),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      currentTheme: defaultTheme,
      loading: false,
      
      setTheme: (theme) => set({ theme }),
      setThemeName: (themeName) => set({ themeName }),
      setLoading: (loading) => set({ loading }),
      setCurrentTheme: (currentTheme) => set({ currentTheme }),
      setAvailableThemes: (availableThemes) => set({ availableThemes }),
      
      loadThemes: async () => {
        set({ loading: true })
        try {
          const response = await fetch('/api/admin/themes/list')
          if (response.ok) {
            const data = await response.json() as { success: boolean; data: { themes: ThemeMetadata[] } }
            if (data.success) {
              set({ availableThemes: data.data.themes })
            }
          }
        } catch (error) {
          console.error('Failed to load themes:', error)
        } finally {
          set({ loading: false })
        }
      },
      
      loadCurrentTheme: async () => {
        const { themeName, currentTheme } = get()
        
        if (currentTheme?.id === themeName) {
          return
        }
        
        if (themeName === 'default') {
          set({ currentTheme: defaultTheme })
          return
        }
        
        if (themeName === 'dark') {
          set({ currentTheme: darkTheme })
          return
        }
        
        set({ loading: true })
        try {
          const response = await fetch(`/api/admin/themes/${themeName}`)
          if (response.ok) {
            const data = await response.json() as { success: boolean; data: { theme: ThemeConfig } }
            if (data.success) {
              set({ currentTheme: data.data.theme })
            } else {
              set({ currentTheme: defaultTheme })
            }
          } else {
            set({ currentTheme: defaultTheme })
          }
        } catch (error) {
          console.error('Failed to load current theme:', error)
          set({ currentTheme: defaultTheme })
        } finally {
          set({ loading: false })
        }
      },
      
      activateTheme: async (themeId: string) => {
        set({ loading: true })
        try {
          const response = await fetch('/api/admin/themes/activate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ themeId }),
          })
          
          if (response.ok) {
            set({ themeName: themeId })
            await get().loadCurrentTheme()
          }
        } catch (error) {
          console.error('Failed to activate theme:', error)
        } finally {
          set({ loading: false })
        }
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
)

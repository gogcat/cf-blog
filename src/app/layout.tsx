import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { getEnv } from '@/lib/api'
import { Providers } from '@/components/providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

async function getSiteSettings() {
  try {
    const env = getEnv()
    
    const settings = await env.DB.prepare(
      'SELECT key, value FROM settings WHERE deleted_at IS NULL'
    ).all<{ key: string; value: string }>()
    
    const settingsMap: Record<string, string> = {}
    for (const setting of settings.results || []) {
      settingsMap[setting.key] = setting.value
    }
    
    return {
      site_name: settingsMap.site_name || 'My Blog',
      site_description: settingsMap.site_description || 'A modern blog built with Next.js and Cloudflare',
      site_copyright: settingsMap.site_copyright || `© ${new Date().getFullYear()} My Blog. All rights reserved.`,
      site_favicon: settingsMap.site_favicon || '',
    }
  } catch (error) {
    return {
      site_name: 'My Blog',
      site_description: 'A modern blog built with Next.js and Cloudflare',
      site_copyright: `© ${new Date().getFullYear()} My Blog. All rights reserved.`,
      site_favicon: '',
    }
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = await getSiteSettings()
  
  const metadata: Metadata = {
    title: {
      default: siteSettings.site_name,
      template: `%s | ${siteSettings.site_name}`,
    },
    description: siteSettings.site_description,
    keywords: 'blog, technology, life, nextjs, cloudflare',
    openGraph: {
      title: siteSettings.site_name,
      description: siteSettings.site_description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: siteSettings.site_name,
      description: siteSettings.site_description,
    },
  }

  if (siteSettings.site_favicon) {
    metadata.icons = {
      icon: siteSettings.site_favicon,
    }
  }

  return metadata
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

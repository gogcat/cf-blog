import { MetadataRoute } from 'next'
import { getEnv } from '@/lib/api'

export default function robots(): MetadataRoute.Robots {
  try {
    const env = getEnv()
    const baseUrl = env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    return {
      rules: {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/login', '/register'],
      },
      sitemap: `${baseUrl}/sitemap.xml`,
    }
  } catch (error) {
    console.error('Error generating robots.txt:', error)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000'
    
    return {
      rules: {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/login', '/register'],
      },
      sitemap: `${baseUrl}/sitemap.xml`,
    }
  }
}

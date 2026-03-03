'use client'

import { useEffect, useState } from 'react'

interface ViewCounterProps {
  slug: string
  initialCount: number
}

export default function ViewCounter({ slug, initialCount }: ViewCounterProps) {
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    async function incrementView() {
      try {
        const res = await fetch(`/api/posts/${slug}`, {
          method: 'GET',
        })
        const data = await res.json() as { 
          success: boolean
          data: { post: { view_count: number } }
        }
        if (data.success && data.data.post.view_count) {
          setCount(data.data.post.view_count)
        }
      } catch (error) {
        console.error('Failed to increment view count:', error)
      }
    }

    incrementView()
  }, [slug])

  return <span>{count} 阅读</span>
}

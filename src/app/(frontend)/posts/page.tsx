import PostListClient from '@/components/post-list-client'
import { getPosts } from '@/lib/server-data'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ search?: string; category?: string; tag?: string }>
}

export default async function PostsPage({ searchParams }: Props) {
  const params = await searchParams
  const search = params.search
  
  const { posts, pagination } = await getPosts(1, 12, { search })
  const hasMore = pagination.page < pagination.total_pages

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50"></div>}>
      <PostListClient initialPosts={posts} initialHasMore={hasMore} />
    </Suspense>
  )
}

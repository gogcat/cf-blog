import PostListClient from '@/components/post-list-client'
import { getPosts } from '@/lib/server-data'

export const dynamic = 'force-dynamic'

export default async function PostsPage() {
  const { posts, pagination } = await getPosts(1, 12)
  const hasMore = pagination.page < pagination.total_pages

  return <PostListClient initialPosts={posts} initialHasMore={hasMore} />
}

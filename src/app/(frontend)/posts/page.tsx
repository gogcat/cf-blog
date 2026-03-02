import { Metadata } from 'next'
import PostListClient from '@/components/post-list-client'
import { getPosts } from '@/lib/server-data'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: '文章归档',
    description: '探索所有文章，按分类浏览',
    keywords: 'blog, articles, posts, 归档, 文章',
    openGraph: {
      title: '文章归档',
      description: '探索所有文章，按分类浏览',
      type: 'website',
    },
  }
}

export default async function PostsPage() {
  const { posts, pagination } = await getPosts(1, 12)
  const hasMore = pagination.page < pagination.total_pages

  return <PostListClient initialPosts={posts} initialHasMore={hasMore} />
}

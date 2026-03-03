import { getFriendLinks, getSettings } from '@/lib/server-data'
import FriendsPageClient from '@/components/friends-client'

export const dynamic = 'force-dynamic'

export default async function FriendsPage() {
  const [friendLinks, settings] = await Promise.all([
    getFriendLinks('approved'),
    getSettings()
  ])
  
  const turnstileSiteKey = settings.turnstile_site_key
  
  return <FriendsPageClient friendLinks={friendLinks} turnstileSiteKey={turnstileSiteKey} />
}

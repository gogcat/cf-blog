import { getEnv } from '@/lib/api'

export const KV = {
  async get(key: string): Promise<string | null> {
    const env = getEnv()
    const cache = (env as any).CACHE as KVNamespace
    if (!cache) {
      console.warn('KV namespace not available')
      return null
    }
    return cache.get(key)
  },

  async put(key: string, value: string, options?: KVNamespacePutOptions): Promise<void> {
    const env = getEnv()
    const cache = (env as any).CACHE as KVNamespace
    if (!cache) {
      console.warn('KV namespace not available')
      return
    }
    return cache.put(key, value, options)
  },

  async delete(key: string): Promise<void> {
    const env = getEnv()
    const cache = (env as any).CACHE as KVNamespace
    if (!cache) {
      console.warn('KV namespace not available')
      return
    }
    return cache.delete(key)
  },
}

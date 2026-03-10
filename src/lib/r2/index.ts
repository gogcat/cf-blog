import { getEnv } from '@/lib/api'

export const R2 = {
  async get(key: string): Promise<R2ObjectBody | null> {
    const env = getEnv()
    return env.R2.get(key)
  },

  async put(key: string, value: string | ReadableStream | ArrayBuffer, options?: R2PutOptions): Promise<R2Object> {
    const env = getEnv()
    return env.R2.put(key, value, options)
  },

  async delete(key: string): Promise<void> {
    const env = getEnv()
    await env.R2.delete(key)
  },

  async list(options?: R2ListOptions): Promise<R2Objects> {
    const env = getEnv()
    return env.R2.list(options)
  },
}

import { SignJWT, jwtVerify } from 'jose'
import type { JWTPayload } from '@/types'

export async function signJWT(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  secret: string,
  expiresIn: string = '15m'
): Promise<string> {
  const secretKey = new TextEncoder().encode(secret)
  
  const token = await new SignJWT({
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey)
  
  return token
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const secretKey = new TextEncoder().encode(secret)
    const { payload } = await jwtVerify(token, secretKey)
    
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      role: payload.role as string,
      iat: payload.iat as number,
      exp: payload.exp as number,
    }
  } catch {
    return null
  }
}

export function generateRefreshToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function getTokenExpiration(expiresIn: string): string {
  const now = new Date()
  
  const match = expiresIn.match(/^(\d+)([smhd])$/)
  if (!match) {
    throw new Error('Invalid expiration format')
  }
  
  const value = parseInt(match[1], 10)
  const unit = match[2]
  
  switch (unit) {
    case 's':
      now.setSeconds(now.getSeconds() + value)
      break
    case 'm':
      now.setMinutes(now.getMinutes() + value)
      break
    case 'h':
      now.setHours(now.getHours() + value)
      break
    case 'd':
      now.setDate(now.getDate() + value)
      break
  }
  
  return now.toISOString()
}

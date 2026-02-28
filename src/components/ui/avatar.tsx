'use client'

import { useState } from 'react'
import Image from 'next/image'

interface AvatarProps {
  src?: string | null
  name: string
  size?: number
  className?: string
}

function getInitials(name: string): string {
  return name.charAt(0).toUpperCase()
}

function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
    '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
  ]
  return colors[Math.abs(hash) % colors.length]
}

export function Avatar({ src, name, size = 36, className = '' }: AvatarProps) {
  const [imgError, setImgError] = useState(false)

  const shouldShowImage = src && !imgError
  const initials = getInitials(name)
  const bgColor = stringToColor(name)
  const fontSize = Math.max(size * 0.4, 12)

  if (!shouldShowImage) {
    return (
      <div
        className={`rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: bgColor,
        }}
      >
        <span
          className="text-white font-medium"
          style={{ fontSize }}
        >
          {initials}
        </span>
      </div>
    )
  }

  const isExternal = src.startsWith('http')

  if (isExternal) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        onError={() => setImgError(true)}
        className={`rounded-full flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={name}
      width={size}
      height={size}
      onError={() => setImgError(true)}
      className={`rounded-full flex-shrink-0 ${className}`}
    />
  )
}

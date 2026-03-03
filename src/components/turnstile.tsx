'use client'

import { useEffect, useRef, useState } from 'react'

interface TurnstileProps {
  siteKey: string
  onSuccess: (token: string) => void
  onError?: () => void
}

declare global {
  interface Window {
    turnstile: {
      render: (container: string | HTMLElement, options: {
        sitekey: string
        callback: (token: string) => void
        'error-callback': () => void
        'expired-callback': () => void
      }) => string
      reset: (widgetId: string) => void
    }
  }
}

export default function Turnstile({ siteKey, onSuccess, onError }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [widgetId, setWidgetId] = useState<string | null>(null)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    document.body.appendChild(script)

    script.onload = () => {
      if (window.turnstile && containerRef.current) {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: onSuccess,
          'error-callback': () => {
            onError?.()
          },
          'expired-callback': () => {
            onError?.()
          },
        })
        setWidgetId(id)
      }
    }

    return () => {
      document.body.removeChild(script)
    }
  }, [siteKey, onSuccess, onError])

  return <div ref={containerRef} />
}

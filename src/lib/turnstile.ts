export async function verifyTurnstile(
  token: string,
  secretKey: string,
  ip?: string
): Promise<boolean> {
  if (!token || !secretKey) {
    return false
  }

  try {
    const formData = new FormData()
    formData.append('response', token)
    formData.append('secret', secretKey)
    
    if (ip) {
      formData.append('remoteip', ip)
    }

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    })

    const outcome = await result.json() as {
      success: boolean
      'error-codes': string[]
    }

    return outcome.success
  } catch (error) {
    console.error('Turnstile verification error:', error)
    return false
  }
}

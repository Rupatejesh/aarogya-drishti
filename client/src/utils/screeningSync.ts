/**
 * Broadcast captured oral camera frame across all views in real time.
 */
export function broadcastScreeningSnapshot(dataUrl: string) {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('aarogya_latest_screening_capture', dataUrl)
    } catch {
      // Ignore storage quota errors
    }
    window.dispatchEvent(
      new CustomEvent('aarogya:screening-captured', { detail: { dataUrl } })
    )
  }
}

export function getCachedScreeningSnapshot(): string | null {
  if (typeof window !== 'undefined') {
    try {
      return sessionStorage.getItem('aarogya_latest_screening_capture')
    } catch {
      return null
    }
  }
  return null
}


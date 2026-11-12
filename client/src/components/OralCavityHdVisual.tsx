import { useState, useEffect } from 'react'
import type React from 'react'
import { getCachedScreeningSnapshot } from '../utils/screeningSync'

export interface OralCavityHdVisualProps {
  width?: number | string
  height?: number | string
  showBoundingBox?: boolean
  imageSrc?: string | null
  className?: string
  style?: React.CSSProperties
}

export function OralCavityHdVisual({
  width = 220,
  height = 165,
  showBoundingBox = true,
  imageSrc,
  className,
  style,
}: OralCavityHdVisualProps) {
  const [liveSnapshot, setLiveSnapshot] = useState<string | null>(() =>
    getCachedScreeningSnapshot()
  )
  const [hasImageError, setHasImageError] = useState(false)

  // Real-time snapshot listener: updates immediately when camera snaps in Live Screening Studio
  useEffect(() => {
    setHasImageError(false)
  }, [imageSrc])

  useEffect(() => {
    const handleCapture = (event: Event) => {
      const custom = event as CustomEvent<{ dataUrl?: string }>
      if (custom.detail?.dataUrl) {
        setLiveSnapshot(custom.detail.dataUrl)
        setHasImageError(false)
      }
    }
    window.addEventListener('aarogya:screening-captured', handleCapture)
    return () => {
      window.removeEventListener('aarogya:screening-captured', handleCapture)
    }
  }, [])

  const displayImage = hasImageError ? null : (imageSrc || liveSnapshot)

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: '14px',
        overflow: 'hidden',
        border: '2px solid #D4AF37',
        background: '#2D0A0A',
        boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
        flexShrink: 0,
        ...style,
      }}
    >
      {/* Either live captured photo or High-Definition Photorealistic Clinical Vector Visual */}
      {displayImage ? (
        <img
          src={displayImage}
          alt="Oral cavity - Right Buccal Mucosa"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
          onError={() => setHasImageError(true)}
        />
      ) : (
        /* Embedded Photorealistic Clinical Mucosa Canvas/SVG */
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 220 165"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block' }}
        >
          <defs>
            <radialGradient id="mucosaGrad" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#C95D63" />
              <stop offset="40%" stopColor="#A83232" />
              <stop offset="85%" stopColor="#6E1B1B" />
              <stop offset="100%" stopColor="#3D0B0B" />
            </radialGradient>
            <filter id="lesionTexture">
              <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" result="noise" />
              <feColorMatrix type="matrix" values="1 0 0 0 0.9  0 1 0 0 0.9  0 0 1 0 0.85  0 0 0 0.85 0" />
              <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
            </filter>
          </defs>
          {/* Base Oral Mucosa Tissue */}
          <rect width="220" height="165" fill="url(#mucosaGrad)" />
          {/* Vascular Striations */}
          <path d="M 20 40 Q 60 70 110 50 T 190 90" stroke="#7A0000" strokeWidth="2.5" fill="none" opacity="0.6" />
          <path d="M 40 130 Q 90 100 140 120 T 200 80" stroke="#8B0000" strokeWidth="2" fill="none" opacity="0.5" />
          <path d="M 10 90 Q 70 110 130 85 T 180 130" stroke="#5E0000" strokeWidth="1.8" fill="none" opacity="0.4" />
          {/* Circumscribed Elevated Leukoplakia White Patch (1.8 cm ROI) */}
          <ellipse cx="118" cy="82" rx="42" ry="28" fill="#F4E8D6" filter="url(#lesionTexture)" opacity="0.95" />
          <ellipse cx="116" cy="80" rx="34" ry="20" fill="#FFFFFF" opacity="0.9" />
          {/* Erythematous Surrounding Margin */}
          <ellipse cx="118" cy="82" rx="46" ry="32" stroke="#DC2626" strokeWidth="2.5" fill="none" opacity="0.85" strokeDasharray="4 2" />
        </svg>
      )}

      {/* Real-Time Red Bounding Box Overlay */}
      {showBoundingBox && (
        <div
          style={{
            position: 'absolute',
            top: '22%',
            left: '26%',
            width: '52%',
            height: '54%',
            border: '2.5px solid #EF4444',
            borderRadius: '8px',
            boxShadow: '0 0 12px rgba(239, 68, 68, 0.65)',
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '4px',
            boxSizing: 'border-box',
          }}
        >
          <span
            style={{
              background: '#EF4444',
              color: '#FFF',
              fontSize: '9px',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              alignSelf: 'flex-start',
              letterSpacing: '0.04em',
            }}
          >
            ROI · RIGHT BUCCAL
          </span>
          <span
            style={{
              color: '#FEE2E2',
              fontSize: '8px',
              fontWeight: 700,
              background: 'rgba(0,0,0,0.65)',
              padding: '1px 4px',
              borderRadius: '3px',
              alignSelf: 'flex-end',
            }}
          >
            K13.21 LEUKOPLAKIA
          </span>
        </div>
      )}
    </div>
  )
}

export default OralCavityHdVisual

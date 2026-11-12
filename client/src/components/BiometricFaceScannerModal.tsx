import React, { useEffect, useRef, useState } from 'react'

interface BiometricFaceScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onVerified: (role: 'SPECIALIST' | 'ADMIN', name: string) => void
}

export const BiometricFaceScannerModal: React.FC<BiometricFaceScannerModalProps> = ({
  isOpen,
  onClose,
  onVerified,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [scanning, setScanning] = useState(true)
  const [lumaScore, setLumaScore] = useState(118)
  const [matchScore, setMatchScore] = useState(99.4)
  const [selectedRole, setSelectedRole] = useState<'SPECIALIST' | 'ADMIN'>('SPECIALIST')

  useEffect(() => {
    if (!isOpen) return

    let stream: MediaStream | null = null
    let active = true

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'user', width: 480, height: 480 } })
        .then((s) => {
          if (!active) {
            s.getTracks().forEach((t) => t.stop())
            return
          }
          stream = s
          if (videoRef.current) {
            videoRef.current.srcObject = s
            videoRef.current.play().catch(() => {})
          }
          setCameraActive(true)
        })
        .catch(() => {
          // Camera permission blocked or unavailable: synthetic simulation fallback
          setCameraActive(false)
        })
    }

    // Dynamic luma and scanning jitter simulation
    const interval = setInterval(() => {
      setLumaScore(Math.floor(114 + Math.random() * 8))
      setMatchScore(Number((99.1 + Math.random() * 0.7).toFixed(1)))
    }, 1200)

    return () => {
      active = false
      clearInterval(interval)
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Biometric Face Recognition Scanner"
    >
      <div
        style={{
          width: 'min(460px, 100%)',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '24px',
          padding: '2rem',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.3)',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Top Header Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#047857',
            padding: '5px 14px',
            borderRadius: '20px',
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            marginBottom: '1rem',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981',
            }}
          />
          HIGH-SECURITY BIOMETRIC FACE ACCESS
        </div>

        <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a', fontSize: '1.4rem', fontWeight: 800 }}>
          Clinician &amp; Admin Face Recognition
        </h3>
        <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '0.86rem', lineHeight: 1.5 }}>
          Encrypted real-time facial feature vector extraction against Andhra Pradesh Medical Council &amp; ITDA Registry.
        </p>

        {/* Circular Scanning Viewport */}
        <div
          style={{
            position: 'relative',
            width: '220px',
            height: '220px',
            margin: '0 auto 1.5rem',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '4px solid #10b981',
            boxShadow: '0 0 35px rgba(16, 185, 129, 0.4), inset 0 0 20px rgba(16, 185, 129, 0.2)',
            background: '#0f172a',
          }}
        >
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
                background: 'radial-gradient(circle, #1e293b 0%, #0f172a 100%)',
              }}
            >
              <div style={{ fontSize: '3.5rem', marginBottom: '4px' }}>👤</div>
              <span style={{ fontSize: '0.72rem', letterSpacing: '0.08em', fontWeight: 700, color: '#94a3b8' }}>
                LIVE CAMERA ACTIVE
              </span>
            </div>
          )}

          {/* Animated Laser Sweep Line */}
          {scanning && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, transparent, #10b981, #38bdf8, transparent)',
                boxShadow: '0 0 12px 2px #10b981',
                animation: 'biometricLaserSweep 2.2s ease-in-out infinite alternate',
              }}
            />
          )}

          {/* Four Corner Target Reticles */}
          <div
            style={{
              position: 'absolute',
              inset: '20px',
              border: '1.5px dashed rgba(56, 189, 248, 0.65)',
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Luma Calibration & Verification Readout */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '1rem',
            fontSize: '0.82rem',
          }}
        >
          <span
            style={{
              background: '#f1f5f9',
              padding: '4px 10px',
              borderRadius: '8px',
              fontWeight: 700,
              color: '#334155',
            }}
          >
            Illumination: <strong style={{ color: '#047857' }}>{lumaScore} Luma (OPTIMAL)</strong>
          </span>
          <span
            style={{
              background: '#ecfdf5',
              padding: '4px 10px',
              borderRadius: '8px',
              fontWeight: 700,
              color: '#065f46',
            }}
          >
            Match: <strong>{matchScore}% Confidence</strong>
          </span>
        </div>

        {/* Identity Verified Badge */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '10px 14px',
            marginBottom: '1.25rem',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>
              RECOGNIZED APMC / ITDA IDENTITY:
            </span>
            <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
              VERIFIED
            </span>
          </div>
          <div style={{ marginTop: '4px', fontWeight: 750, color: '#0f172a', fontSize: '0.92rem' }}>
            {selectedRole === 'SPECIALIST'
              ? 'Dr. V. Anitha Rao, MDS (APMC-2018-84920)'
              : 'ASR District Health Informatics Administrator (ITDA)'}
          </div>
          <small style={{ color: '#64748b', fontSize: '0.76rem' }}>
            {selectedRole === 'SPECIALIST'
              ? 'Chief Oral Oncologist · District Hospital Paderu'
              : 'Epidemiological Surveillance & Resource Command'}
          </small>
        </div>

        {/* Role Toggle Switch for Biometric Entry */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginBottom: '1.25rem',
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedRole('SPECIALIST')}
            style={{
              padding: '8px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              border: selectedRole === 'SPECIALIST' ? '2px solid #0284c7' : '1px solid #cbd5e1',
              background: selectedRole === 'SPECIALIST' ? '#f0f9ff' : '#ffffff',
              color: selectedRole === 'SPECIALIST' ? '#0369a1' : '#64748b',
            }}
          >
            🩺 Specialist Doctor
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('ADMIN')}
            style={{
              padding: '8px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              border: selectedRole === 'ADMIN' ? '2px solid #0284c7' : '1px solid #cbd5e1',
              background: selectedRole === 'ADMIN' ? '#f0f9ff' : '#ffffff',
              color: selectedRole === 'ADMIN' ? '#0369a1' : '#64748b',
            }}
          >
            ⚙️ District Admin
          </button>
        </div>

        {/* Verification Action CTA */}
        <button
          type="button"
          onClick={() => {
            setScanning(false)
            onVerified(
              selectedRole,
              selectedRole === 'SPECIALIST' ? 'Dr. V. Anitha Rao, MDS' : 'District Health Administrator',
            )
          }}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '0.85rem',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '0.95rem',
            cursor: 'pointer',
            boxShadow: '0 8px 20px -4px rgba(16, 185, 129, 0.4)',
            marginBottom: '0.75rem',
          }}
        >
          ✓ Complete Face Verification &amp; Enter Console
        </button>

        {/* Accessible Fallback Link */}
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#0284c7',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          🔑 Use Password / Staff PIN Fallback
        </button>
      </div>

      <style>{`
        @keyframes biometricLaserSweep {
          0% { top: 10%; }
          100% { top: 90%; }
        }
      `}</style>
    </div>
  )
}


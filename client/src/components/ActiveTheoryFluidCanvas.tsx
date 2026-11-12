import { useEffect, useRef } from 'react'

interface FluidRipple {
  x: number
  y: number
  radius: number
  maxRadius: number
  velocity: number
  amplitude: number
  hue: 'azure' | 'gold'
}

export function ActiveTheoryFluidCanvas({
  reducedMotion = false,
}: {
  reducedMotion?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const damping = 0.96
    const rippleSpeed = 0.08
    const ripples: FluidRipple[] = []
    let lastPointerX = width * 0.5
    let lastPointerY = height * 0.5
    let lastSpawnTime = 0
    let wavePhase = 0
    let animationFrameId = 0

    const spawnRipple = (
      x: number,
      y: number,
      speedMagnitude: number,
      hue: 'azure' | 'gold' = 'azure',
    ) => {
      if (ripples.length > 28) {
        ripples.shift()
      }
      ripples.push({
        x,
        y,
        radius: 6,
        maxRadius: Math.min(340, 140 + speedMagnitude * 3.2),
        velocity: Math.max(1.8, Math.min(5.2, 2.2 + speedMagnitude * rippleSpeed)),
        amplitude: Math.min(1, 0.45 + speedMagnitude * 0.015),
        hue,
      })
    }

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    const handlePointerMove = (event: PointerEvent) => {
      const now = performance.now()
      if (now - lastSpawnTime < 36) return
      const dx = event.clientX - lastPointerX
      const dy = event.clientY - lastPointerY
      const velocity = Math.hypot(dx, dy)
      lastPointerX = event.clientX
      lastPointerY = event.clientY
      lastSpawnTime = now
      spawnRipple(
        event.clientX,
        event.clientY,
        velocity,
        ripples.length % 3 === 0 ? 'gold' : 'azure',
      )
    }

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (!touch) return
      const now = performance.now()
      if (now - lastSpawnTime < 45) return
      lastSpawnTime = now
      spawnRipple(touch.clientX, touch.clientY, 24, 'azure')
    }

    const handleWheel = (event: WheelEvent) => {
      const now = performance.now()
      if (now - lastSpawnTime < 55) return
      lastSpawnTime = now
      const scrollEnergy = Math.min(60, Math.abs(event.deltaY) * 0.45)
      spawnRipple(
        lastPointerX || width * 0.5,
        lastPointerY || height * 0.5,
        scrollEnergy,
        'gold',
      )
    }

    window.addEventListener('resize', handleResize, { passive: true })
    if (!reducedMotion) {
      window.addEventListener('pointermove', handlePointerMove, { passive: true })
      window.addEventListener('touchmove', handleTouchMove, { passive: true })
      window.addEventListener('wheel', handleWheel, { passive: true })
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height)
      wavePhase += 0.016

      // Ambient crystal-water horizontal liquid caustics & Active Theory interactive wave mesh
      for (let band = 0; band < 5; band += 1) {
        ctx.beginPath()
        const baseY = height * (0.15 + band * 0.18)
        for (let x = 0; x <= width; x += 24) {
          const distToPointer = Math.hypot(x - lastPointerX, baseY - lastPointerY)
          const pointerPull =
            Math.max(0, 1 - distToPointer / 280) *
            Math.sin(distToPointer * 0.03 - wavePhase * 2.5) *
            22
          const offset =
            Math.sin(x * 0.004 + wavePhase + band * 1.1) * 16 +
            Math.cos(x * 0.0085 - wavePhase * 0.75) * 8 +
            pointerPull
          if (x === 0) {
            ctx.moveTo(x, baseY + offset)
          } else {
            ctx.lineTo(x, baseY + offset)
          }
        }
        ctx.strokeStyle =
          band % 2 === 1
            ? 'rgba(245, 158, 11, 0.11)'
            : 'rgba(37, 99, 235, 0.12)'
        ctx.lineWidth = band % 2 === 0 ? 2.2 : 1.6
        ctx.stroke()
      }

      // Soft interactive cursor aura glow
      const pointerGlow = ctx.createRadialGradient(
        lastPointerX,
        lastPointerY,
        4,
        lastPointerX,
        lastPointerY,
        220,
      )
      pointerGlow.addColorStop(0, 'rgba(37, 99, 235, 0.08)')
      pointerGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.05)')
      pointerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.fillStyle = pointerGlow
      ctx.beginPath()
      ctx.arc(lastPointerX, lastPointerY, 220, 0, Math.PI * 2)
      ctx.fill()

      // Interactive pointer & scroll fluid ripples with viscous damping (0.96)
      for (let i = ripples.length - 1; i >= 0; i -= 1) {
        const r = ripples[i]
        r.radius += r.velocity
        r.velocity *= 0.992
        r.amplitude *= damping

        if (r.amplitude < 0.025 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1)
          continue
        }

        const alphaAzure = Math.min(0.14, r.amplitude * 0.12)
        const alphaGold = Math.min(0.1, r.amplitude * 0.08)

        const gradient = ctx.createRadialGradient(
          r.x,
          r.y,
          Math.max(1, r.radius * 0.35),
          r.x,
          r.y,
          r.radius,
        )
        if (r.hue === 'gold') {
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
          gradient.addColorStop(0.7, `rgba(245, 158, 11, ${alphaGold.toFixed(3)})`)
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
        } else {
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
          gradient.addColorStop(0.7, `rgba(37, 99, 235, ${alphaAzure.toFixed(3)})`)
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
        }

        ctx.beginPath()
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        ctx.beginPath()
        ctx.arc(r.x, r.y, r.radius * 0.86, 0, Math.PI * 2)
        ctx.strokeStyle =
          r.hue === 'gold'
            ? `rgba(245, 158, 11, ${(alphaGold * 1.25).toFixed(3)})`
            : `rgba(37, 99, 235, ${(alphaAzure * 1.25).toFixed(3)})`
        ctx.lineWidth = 1.4
        ctx.stroke()
      }

      if (!reducedMotion) {
        animationFrameId = window.requestAnimationFrame(render)
      }
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('wheel', handleWheel)
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId)
      }
    }
  }, [reducedMotion])

  return (
    <canvas
      ref={canvasRef}
      className="active-theory-fluid-canvas"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}


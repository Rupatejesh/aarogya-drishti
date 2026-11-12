import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  size: number
  alpha: number
  hueType: 'azure' | 'gold'
}

export function BlueUniverse(props: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const forceReducedMotion = props.reducedMotion ?? false

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d', { alpha: true })
    if (!canvas || !context) return

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const coarsePointer = window.matchMedia('(pointer: coarse)')
    const particles: Particle[] = []
    const trail: { x: number; y: number; age: number }[] = []
    const pointer = { x: -1000, y: -1000, active: false }
    let frame = 0
    let width = 0
    let height = 0
    let pixelRatio = 1
    let previousTime = 0

    const isMotionReduced = () => motionPreference.matches || forceReducedMotion

    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      width = bounds.width
      height = bounds.height
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      particles.length = 0
      const count = Math.min(68, Math.max(28, Math.round((width * height) / 18000)))
      for (let index = 0; index < count; index += 1) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z: 0.3 + Math.random() * 0.7,
          vx: (Math.random() - 0.5) * 0.14,
          vy: (Math.random() - 0.5) * 0.14,
          size: 1.1 + Math.random() * 1.9,
          alpha: 0.22 + Math.random() * 0.42,
          hueType: index % 3 === 0 ? 'gold' : 'azure',
        })
      }
      draw(0, true)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (coarsePointer.matches) return
      pointer.x = event.clientX
      pointer.y = event.clientY
      pointer.active = true
      trail.push({ x: event.clientX, y: event.clientY, age: 0 })
      if (trail.length > 12) trail.shift()
    }

    const onPointerLeave = () => {
      pointer.active = false
      pointer.x = -1000
      pointer.y = -1000
    }

    const draw = (time: number, staticFrame = false) => {
      if (!context) return
      const delta = Math.min(2, (time - (previousTime || time)) / 16.67 || 1)
      previousTime = time
      context.clearRect(0, 0, width, height)

      for (const particle of particles) {
        if (!staticFrame && !isMotionReduced()) {
          particle.x += particle.vx * particle.z * delta
          particle.y += particle.vy * particle.z * delta
          if (particle.x < -5) particle.x = width + 5
          if (particle.x > width + 5) particle.x = -5
          if (particle.y < -5) particle.y = height + 5
          if (particle.y > height + 5) particle.y = -5

          if (pointer.active && !coarsePointer.matches) {
            const dx = particle.x - pointer.x
            const dy = particle.y - pointer.y
            const distanceSquared = dx * dx + dy * dy
            if (distanceSquared < 16000 && distanceSquared > 1) {
              const distance = Math.sqrt(distanceSquared)
              const force = (1 - distance / 126) * 0.035 * delta
              particle.vx += (dx / distance) * force
              particle.vy += (dy / distance) * force
              particle.vx *= 0.985
              particle.vy *= 0.985
            }
          }
        }

        context.beginPath()
        if (particle.hueType === 'gold') {
          context.fillStyle = `rgba(245, 158, 11, ${particle.alpha * particle.z})`
          context.shadowColor = 'rgba(245, 158, 11, 0.35)'
        } else {
          context.fillStyle = `rgba(37, 99, 235, ${particle.alpha * particle.z})`
          context.shadowColor = 'rgba(37, 99, 235, 0.32)'
        }
        context.shadowBlur = particle.size * 4
        context.arc(particle.x, particle.y, particle.size * particle.z, 0, Math.PI * 2)
        context.fill()
      }
      context.shadowBlur = 0

      const connectionDistance = Math.min(145, width * 0.16)
      for (let first = 0; first < particles.length; first += 1) {
        for (let second = first + 1; second < particles.length; second += 1) {
          const a = particles[first]
          const b = particles[second]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance >= connectionDistance) continue
          const alpha = (1 - distance / connectionDistance) * 0.14
          context.strokeStyle =
            a.hueType === 'gold' || b.hueType === 'gold'
              ? `rgba(245, 158, 11, ${alpha})`
              : `rgba(37, 99, 235, ${alpha})`
          context.lineWidth = 0.75
          context.beginPath()
          context.moveTo(a.x, a.y)
          context.lineTo(b.x, b.y)
          context.stroke()
        }
      }

      if (pointer.active && trail.length > 1 && !coarsePointer.matches) {
        for (let index = 1; index < trail.length; index += 1) {
          const previous = trail[index - 1]
          const current = trail[index]
          const opacity = (index / trail.length) * 0.24
          context.strokeStyle = `rgba(37, 99, 235, ${opacity})`
          context.lineWidth = 0.8 + index * 0.08
          context.beginPath()
          context.moveTo(previous.x, previous.y)
          context.lineTo(current.x, current.y)
          context.stroke()
        }
      }

      if (!isMotionReduced()) frame = window.requestAnimationFrame((nextTime) => draw(nextTime))
    }

    const onMotionPreferenceChange = () => {
      window.cancelAnimationFrame(frame)
      if (isMotionReduced()) draw(0, true)
      else frame = window.requestAnimationFrame((time) => draw(time))
    }

    resize()
    window.addEventListener('resize', resize, { passive: true })
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('blur', onPointerLeave)
    motionPreference.addEventListener('change', onMotionPreferenceChange)

    if (!isMotionReduced()) frame = window.requestAnimationFrame((time) => draw(time))

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('blur', onPointerLeave)
      motionPreference.removeEventListener('change', onMotionPreferenceChange)
    }
  }, [forceReducedMotion])

  return <canvas className="blue-universe-canvas" ref={canvasRef} aria-hidden="true" />
}

interface FloralPetal {
  x: number
  y: number
  vy: number
  vx: number
  sizeW: number
  sizeH: number
  rotation: number
  rotationSpeed: number
  swayPhase: number
  swaySpeed: number
  petalKind: 'marigold' | 'marigoldDeep' | 'jasmine' | 'rose'
  opacity: number
}

export function FloralPetalCanvas(props: { reducedMotion?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const forceReducedMotion = props.reducedMotion ?? false

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d', { alpha: true })
    if (!canvas || !context) return

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const petals: FloralPetal[] = []
    let frame = 0
    let width = 0
    let height = 0
    let pixelRatio = 1
    let previousTime = 0

    const isMotionReduced = () => motionPreference.matches || forceReducedMotion

    const createPetal = (initialY?: number): FloralPetal => {
      const kinds: FloralPetal['petalKind'][] = ['marigold', 'marigoldDeep', 'jasmine', 'rose', 'marigold']
      const petalKind = kinds[Math.floor(Math.random() * kinds.length)] ?? 'marigold'
      const baseSize = 7 + Math.random() * 9
      return {
        x: Math.random() * Math.max(width, 320),
        y: initialY !== undefined ? initialY : -20 - Math.random() * 80,
        vy: 0.55 + Math.random() * 0.95,
        vx: (Math.random() - 0.5) * 0.45,
        sizeW: baseSize,
        sizeH: baseSize * (1.35 + Math.random() * 0.35),
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.025,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.015 + Math.random() * 0.02,
        petalKind,
        opacity: 0.65 + Math.random() * 0.3,
      }
    }

    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      width = bounds.width || window.innerWidth
      height = bounds.height || window.innerHeight
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      petals.length = 0
      const count = Math.min(54, Math.max(26, Math.round((width * height) / 22000)))
      for (let i = 0; i < count; i += 1) {
        petals.push(createPetal(Math.random() * height))
      }
      draw(0, true)
    }

    const drawPetalShape = (petal: FloralPetal) => {
      context.save()
      context.translate(petal.x, petal.y)
      context.rotate(petal.rotation)
      context.globalAlpha = petal.opacity

      const w = petal.sizeW
      const h = petal.sizeH

      const gradient = context.createLinearGradient(0, -h * 0.5, 0, h * 0.5)
      if (petal.petalKind === 'marigold') {
        gradient.addColorStop(0, '#fde047')
        gradient.addColorStop(0.55, '#f59e0b')
        gradient.addColorStop(1, '#d97706')
        context.strokeStyle = 'rgba(217, 119, 6, 0.35)'
      } else if (petal.petalKind === 'marigoldDeep') {
        gradient.addColorStop(0, '#fbbf24')
        gradient.addColorStop(0.6, '#ea580c')
        gradient.addColorStop(1, '#b45309')
        context.strokeStyle = 'rgba(180, 83, 9, 0.35)'
      } else if (petal.petalKind === 'jasmine') {
        gradient.addColorStop(0, '#ffffff')
        gradient.addColorStop(0.65, '#fef3c7')
        gradient.addColorStop(1, '#fde68a')
        context.strokeStyle = 'rgba(245, 158, 11, 0.32)'
      } else {
        gradient.addColorStop(0, '#ffe4e6')
        gradient.addColorStop(0.55, '#fda4af')
        gradient.addColorStop(1, '#fb7185')
        context.strokeStyle = 'rgba(225, 29, 72, 0.28)'
      }

      context.fillStyle = gradient
      context.lineWidth = 0.8
      context.beginPath()
      context.moveTo(0, -h * 0.5)
      context.bezierCurveTo(w * 0.75, -h * 0.35, w * 0.65, h * 0.35, 0, h * 0.5)
      context.bezierCurveTo(-w * 0.65, h * 0.35, -w * 0.75, -h * 0.35, 0, -h * 0.5)
      context.closePath()
      context.fill()
      context.stroke()
      context.restore()
    }

    const draw = (time: number, staticFrame = false) => {
      if (!context) return
      const delta = Math.min(2, (time - (previousTime || time)) / 16.67 || 1)
      previousTime = time
      context.clearRect(0, 0, width, height)

      for (let i = 0; i < petals.length; i += 1) {
        const petal = petals[i]
        if (!staticFrame && !isMotionReduced()) {
          petal.swayPhase += petal.swaySpeed * delta
          petal.x += (petal.vx + Math.sin(petal.swayPhase) * 0.65) * delta
          petal.y += petal.vy * delta
          petal.rotation += petal.rotationSpeed * delta

          if (petal.y > height + 30) {
            petals[i] = createPetal(-25)
          }
          if (petal.x < -30) petal.x = width + 25
          if (petal.x > width + 30) petal.x = -25
        }
        drawPetalShape(petal)
      }

      if (!isMotionReduced()) {
        frame = window.requestAnimationFrame((nextTime) => draw(nextTime))
      }
    }

    resize()
    window.addEventListener('resize', resize, { passive: true })
    if (!isMotionReduced()) {
      frame = window.requestAnimationFrame((time) => draw(time))
    }

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [forceReducedMotion])

  return <canvas className="floral-petal-canvas" ref={canvasRef} aria-hidden="true" />
}

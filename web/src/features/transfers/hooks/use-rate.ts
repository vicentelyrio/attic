import { useEffect, useRef, useState } from 'react'

export function useRate(bytes: number, active: boolean): number {
  const ref = useRef({ t: 0, b: 0, speed: 0 })
  const [speed, setSpeed] = useState(0)

  useEffect(() => {
    if (!active) {
      ref.current = { t: 0, b: 0, speed: 0 }
      setSpeed(0)
      return
    }
    const now = performance.now()
    const prev = ref.current
    if (prev.t > 0) {
      const dt = (now - prev.t) / 1000
      const db = bytes - prev.b
      if (dt > 0 && db >= 0) {
        const inst = db / dt
        const smooth = prev.speed > 0 ? prev.speed * 0.6 + inst * 0.4 : inst
        ref.current = { t: now, b: bytes, speed: smooth }
        setSpeed(smooth)
        return
      }
    }
    ref.current = { t: now, b: bytes, speed: prev.speed }
  }, [bytes, active])

  return speed
}

// components/AnimationProvider.tsx
'use client'
import { domAnimation, LazyMotion, MotionConfig } from 'framer-motion'

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion='user'>
      <LazyMotion features={domAnimation}>{children}</LazyMotion>
    </MotionConfig>
  )
}

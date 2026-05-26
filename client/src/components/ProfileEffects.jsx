import { motion } from 'framer-motion'

export default function ProfileEffects({ effectId }) {
  if (!effectId) return null

  if (effectId === 'effect_flames') {
    return <FlameEffect />
  }
  if (effectId === 'effect_confetti') {
    return <ConfettiEffect />
  }
  if (effectId === 'effect_sparkle') {
    return <SparkleEffect />
  }
  return null
}

function FlameEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 rounded-3xl">
      {/* Bottom flame glow */}
      <div 
        className="absolute bottom-0 inset-x-0 h-32"
        style={{
          background: 'linear-gradient(to top, rgba(255,80,0,0.15) 0%, rgba(255,160,0,0.05) 50%, transparent 100%)'
        }}
      />
      {/* Rising flame particles */}
      {[...Array(15)].map((_, i) => {
        const left = `${5 + Math.random() * 90}%`
        const duration = 2.5 + Math.random() * 2.5
        const delay = Math.random() * 3
        const size = 18 + Math.random() * 16
        return (
          <motion.div
            key={i}
            className="absolute bottom-0 text-orange-500/25 select-none"
            style={{
              left,
              fontSize: `${size}px`,
              filter: 'blur(1.5px) drop-shadow(0 0 6px rgba(255,80,0,0.5))'
            }}
            animate={{
              y: [0, -320],
              x: [0, Math.random() * 40 - 20],
              scale: [1, 1.4, 0.4],
              opacity: [0, 0.6, 0]
            }}
            transition={{
              duration,
              repeat: Infinity,
              delay,
              ease: 'easeOut'
            }}
          >
            🔥
          </motion.div>
        )
      })}
    </div>
  )
}

function ConfettiEffect() {
  const colors = ['#FF4E50', '#FC913A', '#F9D423', '#EDE574', '#80DEEA', '#B2DFDB', '#FF8B94']
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 rounded-3xl">
      {[...Array(24)].map((_, i) => {
        const left = `${Math.random() * 100}%`
        const color = colors[i % colors.length]
        const duration = 5 + Math.random() * 4
        const delay = Math.random() * 4
        const size = 6 + Math.random() * 8
        const rotation = Math.random() * 360
        return (
          <motion.div
            key={i}
            className="absolute top-0 rounded-sm select-none"
            style={{
              left,
              width: size,
              height: size,
              backgroundColor: color,
            }}
            animate={{
              y: [-20, 420],
              x: [0, Math.random() * 60 - 30],
              rotate: [rotation, rotation + 360 + Math.random() * 360]
            }}
            transition={{
              duration,
              repeat: Infinity,
              delay,
              ease: 'linear'
            }}
          />
        )
      })}
    </div>
  )
}

function SparkleEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 rounded-3xl">
      {[...Array(16)].map((_, i) => {
        const left = `${Math.random() * 100}%`
        const top = `${Math.random() * 90}%`
        const duration = 1.8 + Math.random() * 2.2
        const delay = Math.random() * 2.5
        const size = 10 + Math.random() * 12
        return (
          <motion.div
            key={i}
            className="absolute text-yellow-300/35 select-none"
            style={{
              left,
              top,
              fontSize: `${size}px`,
              filter: 'drop-shadow(0 0 3px rgba(255,220,100,0.4))'
            }}
            animate={{
              scale: [0, 1.2, 0],
              opacity: [0, 0.75, 0],
              rotate: [0, 180]
            }}
            transition={{
              duration,
              repeat: Infinity,
              delay,
              ease: 'easeInOut'
            }}
          >
            ✦
          </motion.div>
        )
      })}
    </div>
  )
}

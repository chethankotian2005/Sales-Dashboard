/**
 * Notification sound effects using the Web Audio API.
 * No external files required — tones are synthesised in the browser.
 */

function getAudioContext() {
  if (typeof window === 'undefined') return null
  if (!window._audioCtx) {
    window._audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return window._audioCtx
}

function playTone({ frequency, endFrequency, duration, type = 'sine', volume = 0.18 }) {
  const ctx = getAudioContext()
  if (!ctx) return

  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
  if (endFrequency) {
    oscillator.frequency.linearRampToValueAtTime(endFrequency, ctx.currentTime + duration)
  }

  gainNode.gain.setValueAtTime(volume, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + duration)
}

/** info — soft ascending ping */
export function playInfoSound() {
  playTone({ frequency: 520, endFrequency: 660, duration: 0.25, type: 'sine', volume: 0.15 })
}

/** success — bright two-note chime */
export function playSuccessSound() {
  playTone({ frequency: 523, endFrequency: 784, duration: 0.15, type: 'sine', volume: 0.2 })
  setTimeout(() => playTone({ frequency: 784, duration: 0.25, type: 'sine', volume: 0.15 }), 160)
}

/** warning — urgent mid pulse */
export function playWarningSound() {
  playTone({ frequency: 440, endFrequency: 360, duration: 0.2, type: 'triangle', volume: 0.22 })
  setTimeout(() => playTone({ frequency: 440, endFrequency: 360, duration: 0.2, type: 'triangle', volume: 0.18 }), 240)
}

/** error / danger — descending alert */
export function playErrorSound() {
  playTone({ frequency: 380, endFrequency: 220, duration: 0.3, type: 'sawtooth', volume: 0.15 })
}

export function playNotificationSound(type) {
  try {
    switch (type) {
      case 'success': return playSuccessSound()
      case 'warning': return playWarningSound()
      case 'error':   return playErrorSound()
      default:        return playInfoSound()
    }
  } catch {
    // Silently fail if Web Audio is unavailable
  }
}

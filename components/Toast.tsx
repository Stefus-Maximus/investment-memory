'use client'

import { useEffect, useState } from 'react'

type ToastEntry = { id: number; message: string }
type Listener = (message: string) => void

const listeners = new Set<Listener>()
const VISIBLE_MS = 1800

// Fire from any client component after a successful save — no toast is worth
// wiring a context/provider through every sheet just for a "flash and
// disappear" side effect. Peak-end moment (pasted spec): a brief, quiet
// acknowledgement, not a badge or a sound.
export function showToast(message: string) {
  listeners.forEach((listen) => listen(message))
}

// Mounted once in the root layout so every page gets it for free.
export function ToastHost() {
  const [toasts, setToasts] = useState<ToastEntry[]>([])

  useEffect(() => {
    let nextId = 0
    const listener: Listener = (message) => {
      const id = nextId++
      setToasts((current) => [...current, { id, message }])
      setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id))
      }, VISIBLE_MS)
    }
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-[60] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => (
        <span
          key={toast.id}
          className="animate-toast rounded-full bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm"
        >
          {toast.message}
        </span>
      ))}
    </div>
  )
}

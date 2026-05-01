'use client'

import { useEffect, useState } from 'react'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calculate(targetDate: string): TimeLeft {
  const diff = new Date(targetDate).getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  }
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export default function CountdownTimer({ targetDate }: { targetDate: string }) {
  // null on first render (server + client hydration) — set only after mount
  // to avoid SSR/client mismatch from Date.now() differing between renders.
  const [time, setTime] = useState<TimeLeft | null>(null)

  useEffect(() => {
    setTime(calculate(targetDate))
    const id = setInterval(() => setTime(calculate(targetDate)), 1000)
    return () => clearInterval(id)
  }, [targetDate])

  const units = [
    { label: 'Dias',    value: time?.days    ?? 0 },
    { label: 'Horas',  value: time?.hours   ?? 0 },
    { label: 'Min',    value: time?.minutes ?? 0 },
    { label: 'Seg',    value: time?.seconds ?? 0 },
  ]

  return (
    <section className="bg-[#155C2C] text-white py-8 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-pink-300 font-semibold text-xs sm:text-sm uppercase tracking-widest mb-5">
          ⏱️ Pedidos com entrega garantida encerram em
        </p>

        <div className="flex justify-center gap-2 sm:gap-4 md:gap-6">
          {units.map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className="bg-white/10 border border-white/20 rounded-xl w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center">
                <span className="text-2xl sm:text-3xl md:text-4xl font-bold font-mono tabular-nums leading-none">
                  {/* Render placeholder dashes until client hydrates */}
                  {time ? pad(value) : '--'}
                </span>
              </div>
              <span className="text-[10px] sm:text-xs text-green-200 uppercase tracking-widest">
                {label}
              </span>
            </div>
          ))}
        </div>

        <p className="text-green-200 text-xs sm:text-sm mt-5">
          Peça hoje · entregamos em sua cidade no{' '}
          <strong className="text-white">Dia das Mães, 10/05</strong>
        </p>
      </div>
    </section>
  )
}

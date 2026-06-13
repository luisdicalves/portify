'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Delete, ScanFace } from 'lucide-react'
import { Screen, StepDots } from '@/components/ui'

// Linha de baixo: bio | 0 | del
const NUMPAD_KEYS = ['1','2','3','4','5','6','7','8','9','bio','0','del']

export default function Seguranca() {
  const router = useRouter()
  const [pin, setPin] = useState<string[]>([])
  const [bio, setBio] = useState(false)

  function pressNum(val: string) {
    if (val === 'del') { setPin(p => p.slice(0, -1)); return }
    if (val === 'bio')  { setBio(v => !v); return }
    if (pin.length >= 6) return
    const next = [...pin, val]
    setPin(next)
    if (next.length === 6) setTimeout(() => router.push('/onboarding/tipos-ativo'), 300)
  }

  return (
    <Screen>
      <div className="flex-1 flex flex-col px-6 py-5">
        <StepDots total={7} current={1} />

        <h2 className="text-[20px] font-semibold text-stone-900 mb-1">Segurança</h2>
        <p className="text-[13px] text-stone-500 mb-6 leading-relaxed">
          Define um PIN de 6 dígitos para proteger o acesso.
        </p>

        {/* PIN dots */}
        <div className="flex justify-center gap-2 mb-6">
          {[0,1,2,3,4,5].map(i => (
            <div key={i}
              className={`w-[42px] h-[52px] rounded-xl border flex items-center justify-center text-[22px] font-medium transition-all
                ${pin.length > i
                  ? 'border-brand-400 bg-brand-50 text-brand-800'
                  : 'border-stone-200 bg-stone-50 text-stone-400'
                }`}>
              {pin.length > i ? '●' : ''}
            </div>
          ))}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2">
          {NUMPAD_KEYS.map((key, i) => (
            <button key={i}
              onClick={() => pressNum(key)}
              className={`rounded-xl py-[13px] flex items-center justify-center transition-colors
                text-[20px] font-medium
                ${key === 'bio'
                  ? bio
                    ? 'bg-brand-50 border border-brand-400 text-brand-800'
                    : 'bg-stone-50 border border-stone-200 text-stone-500 active:bg-stone-100'
                  : 'bg-stone-50 border border-stone-200 text-stone-900 active:bg-stone-100'
                }`}>
              {key === 'del' && <Delete size={18} color="#888780" />}
              {key === 'bio' && <ScanFace size={20} color={bio ? '#1D9E75' : '#888780'} strokeWidth={1.5} />}
              {key !== 'del' && key !== 'bio' && key}
            </button>
          ))}
        </div>
      </div>
    </Screen>
  )
}

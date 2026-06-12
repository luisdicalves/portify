'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Delete, Fingerprint, ScanFace } from 'lucide-react'
import { Screen, StepDots } from '@/components/ui'

const NUMPAD = ['1','2','3','4','5','6','7','8','9','','0','del']

export default function Seguranca() {
  const router = useRouter()
  const [pin, setPin] = useState<string[]>([])
  const [bio, setBio] = useState<'face'|'touch'|null>(null)

  function pressNum(val: string) {
    if (val === 'del') { setPin(p => p.slice(0, -1)); return }
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

        {/* 6 dígitos */}
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

        <div className="grid grid-cols-3 gap-2 mb-6">
          {NUMPAD.map((key, i) => (
            key === '' ? <div key={i} /> :
            <button key={i}
              onClick={() => pressNum(key)}
              className="bg-stone-50 border border-stone-200 rounded-xl py-[13px] flex items-center justify-center
                text-[20px] font-medium text-stone-900 active:bg-stone-100 transition-colors">
              {key === 'del' ? <Delete size={18} color="#888780" /> : key}
            </button>
          ))}
        </div>

        <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-3">
          Biometria (opcional)
        </p>
        <div className="flex gap-3">
          {([
            { id: 'face',  label: 'Face ID',  Icon: ScanFace    },
            { id: 'touch', label: 'Touch ID', Icon: Fingerprint },
          ] as const).map(({ id, label, Icon }) => (
            <button key={id}
              onClick={() => setBio(bio === id ? null : id)}
              className={`flex-1 rounded-xl border py-[13px] flex flex-col items-center gap-2 transition-all
                ${bio === id
                  ? 'bg-brand-50 border-brand-400'
                  : 'bg-stone-50 border-stone-200 active:bg-stone-100'
                }`}>
              <Icon size={22} color={bio === id ? '#1D9E75' : '#888780'} strokeWidth={1.5} />
              <span className={`text-[12px] ${bio === id ? 'text-brand-800 font-medium' : 'text-stone-500'}`}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </Screen>
  )
}

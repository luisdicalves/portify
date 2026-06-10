'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useOnboarding } from '@/lib/onboarding-context'
import { Screen, StatusBar, StepDots, BtnPrimary, Field } from '@/components/ui'

export default function CriarConta() {
  const router  = useRouter()
  const { data, update } = useOnboarding()

  const [nome,     setNome]     = useState(data.nome)
  const [apelido,  setApelido]  = useState(data.apelido)
  const [email,    setEmail]    = useState(data.email)
  const [password, setPassword] = useState('')

  const podeAvancar = nome.trim() && apelido.trim() && email.includes('@') && password.length >= 6

  function avancar() {
    update({ nome: nome.trim(), apelido: apelido.trim(), email: email.trim() })
    router.push('/onboarding/seguranca')
  }

  return (
    <Screen>
      <StatusBar />
      <div className="flex-1 flex flex-col px-6 py-5 overflow-y-auto">
        <StepDots total={5} current={0} />

        <h2 className="text-[20px] font-semibold text-stone-900 mb-1">Criar conta</h2>
        <p className="text-[13px] text-stone-500 mb-6 leading-relaxed">
          Começa em menos de 2 minutos, sem cartão.
        </p>

        <Field label="Primeiro nome"  value={nome}     onChange={setNome}     placeholder="João"              />
        <Field label="Apelido"        value={apelido}  onChange={setApelido}  placeholder="Silva"             />
        <Field label="Email"          type="email"     value={email}    onChange={setEmail}    placeholder="joao@gmail.com"    />
        <Field label="Palavra-passe"  type="password"  value={password} onChange={setPassword} placeholder="Mínimo 6 caracteres" />

        {/* Divisor */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-stone-200" />
          <span className="text-[12px] text-stone-400">ou continuar com</span>
          <div className="flex-1 h-px bg-stone-200" />
        </div>

        {/* Social */}
        {['Apple ID', 'Google'].map(provider => (
          <button key={provider}
            className="w-full bg-stone-50 border border-stone-300 rounded-xl py-[10px] mb-2
              text-[13px] text-stone-900 font-medium flex items-center justify-center gap-2
              active:bg-stone-100 transition-colors">
            {provider}
          </button>
        ))}

        <div className="mt-auto pt-4">
          <BtnPrimary onClick={avancar} disabled={!podeAvancar}>
            Continuar
          </BtnPrimary>
        </div>
      </div>
    </Screen>
  )
}

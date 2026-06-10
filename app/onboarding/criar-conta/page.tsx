'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useOnboarding } from '@/lib/onboarding-context'
import { Screen, StepDots, BtnPrimary, Field } from '@/components/ui'
import { supabase } from '@/lib/supabase'

function calcIdade(dataNasc: string): number {
  const hoje   = new Date()
  const nasc   = new Date(dataNasc)
  let idade    = hoje.getFullYear() - nasc.getFullYear()
  const m      = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

export default function CriarConta() {
  const router = useRouter()
  const { data, update } = useOnboarding()

  const [nome,      setNome]      = useState(data.nome)
  const [apelido,   setApelido]   = useState(data.apelido)
  const [dataNasc,  setDataNasc]  = useState('')
  const [email,     setEmail]     = useState(data.email)
  const [password,  setPassword]  = useState('')
  const [erro,      setErro]      = useState('')
  const [loading,   setLoading]   = useState(false)

  const podeAvancar = nome.trim() && apelido.trim() && dataNasc &&
    email.includes('@') && password.length >= 6

  async function avancar() {
    setErro('')

    // Validar idade
    if (calcIdade(dataNasc) < 18) {
      setErro('É necessário ter pelo menos 18 anos para criar uma conta.')
      return
    }

    setLoading(true)
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { nome: nome.trim(), apelido: apelido.trim(), data_nascimento: dataNasc } },
      })

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          setErro('Já existe uma conta com este email. Faz login.')
        } else {
          setErro(error.message)
        }
        return
      }

      const user = authData.user
      if (user) {
        await supabase.from('perfis').upsert({
          id:               user.id,
          nome:             nome.trim(),
          apelido:          apelido.trim(),
          data_nascimento:  dataNasc,
        })
      }

      update({ nome: nome.trim(), apelido: apelido.trim(), email: email.trim() })
      router.push('/onboarding/seguranca')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <div className="flex-1 flex flex-col px-6 py-5 overflow-y-auto">
        <StepDots total={5} current={0} />

        <h2 className="text-[20px] font-semibold text-stone-900 mb-1">Criar conta</h2>
        <p className="text-[13px] text-stone-500 mb-6 leading-relaxed">
          Começa em menos de 2 minutos, sem cartão.
        </p>

        <Field label="Primeiro nome"   value={nome}      onChange={setNome}     placeholder="João"               />
        <Field label="Apelido"         value={apelido}   onChange={setApelido}  placeholder="Silva"              />

        {/* Data de nascimento */}
        <div className="mb-[13px]">
          <label className="block text-[12px] font-medium text-stone-500 mb-[5px]">
            Data de nascimento
          </label>
          <input
            type="date"
            value={dataNasc}
            onChange={e => setDataNasc(e.target.value)}
            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18))
              .toISOString().split('T')[0]}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-[13px] py-[11px]
              text-[14px] text-stone-900 focus:outline-none focus:border-brand-400 transition-colors"
          />
        </div>

        <Field label="Email"           type="email"    value={email}    onChange={setEmail}    placeholder="joao@gmail.com"    />
        <Field label="Palavra-passe"   type="password" value={password} onChange={setPassword} placeholder="Mínimo 6 caracteres" />

        {erro && (
          <p className="text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
            {erro}
          </p>
        )}

        <BtnPrimary onClick={avancar} disabled={!podeAvancar || loading} className="mt-2 mb-6">
          {loading ? 'A criar conta...' : 'Continuar'}
        </BtnPrimary>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-stone-200" />
          <span className="text-[12px] text-stone-400">ou continuar com</span>
          <div className="flex-1 h-px bg-stone-200" />
        </div>

        <button className="w-full bg-stone-50 border border-stone-300 rounded-xl py-[10px] mb-2
          text-[13px] text-stone-900 font-medium flex items-center justify-center gap-2
          active:bg-stone-100 transition-colors">Apple ID</button>
        <button className="w-full bg-stone-50 border border-stone-300 rounded-xl py-[10px] mb-6
          text-[13px] text-stone-900 font-medium flex items-center justify-center gap-2
          active:bg-stone-100 transition-colors">Google</button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-stone-200" />
          <span className="text-[12px] text-stone-400">já tens conta?</span>
          <div className="flex-1 h-px bg-stone-200" />
        </div>

        <button onClick={() => router.push('/login')}
          className="w-full bg-transparent border border-stone-300 rounded-xl py-[11px]
            text-[14px] text-stone-600 font-medium active:bg-stone-50 transition-colors">
          Entrar na conta
        </button>
      </div>
    </Screen>
  )
}

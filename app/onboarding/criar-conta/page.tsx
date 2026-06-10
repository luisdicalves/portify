'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useOnboarding } from '@/lib/onboarding-context'
import { Screen, StatusBar, StepDots, BtnPrimary, Field } from '@/components/ui'
import { supabase } from '@/lib/supabase'

export default function CriarConta() {
  const router = useRouter()
  const { data, update } = useOnboarding()

  const [nome,     setNome]     = useState(data.nome)
  const [apelido,  setApelido]  = useState(data.apelido)
  const [email,    setEmail]    = useState(data.email)
  const [password, setPassword] = useState('')
  const [erro,     setErro]     = useState('')
  const [loading,  setLoading]  = useState(false)

  const podeAvancar = nome.trim() && apelido.trim() && email.includes('@') && password.length >= 6

  async function avancar() {
    setErro('')
    setLoading(true)
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { nome: nome.trim(), apelido: apelido.trim() } },
      })
      if (error) {
        setErro(error.message === 'User already registered'
          ? 'Este email já tem conta. Faz login.'
          : error.message)
        return
      }
      const user = authData.user
      if (user) {
        await supabase.from('perfis').upsert({
          id:      user.id,
          nome:    nome.trim(),
          apelido: apelido.trim(),
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
      <StatusBar />
      <div className="flex-1 flex flex-col px-6 py-5 overflow-y-auto">
        <StepDots total={5} current={0} />
        <h2 className="text-[20px] font-semibold text-stone-900 mb-1">Criar conta</h2>
        <p className="text-[13px] text-stone-500 mb-6 leading-relaxed">
          Começa em menos de 2 minutos, sem cartão.
        </p>
        <Field label="Primeiro nome" value={nome}     onChange={setNome}     placeholder="João"              />
        <Field label="Apelido"       value={apelido}  onChange={setApelido}  placeholder="Silva"             />
        <Field label="Email"         type="email"     value={email}    onChange={setEmail}    placeholder="joao@gmail.com"    />
        <Field label="Palavra-passe" type="password"  value={password} onChange={setPassword} placeholder="Mínimo 6 caracteres" />
        {erro && (
          <p className="text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
            {erro}
          </p>
        )}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-stone-200" />
          <span className="text-[12px] text-stone-400">ou</span>
          <div className="flex-1 h-px bg-stone-200" />
        </div>
        <button onClick={() => router.push('/login')}
          className="w-full bg-stone-50 border border-stone-300 rounded-xl py-[10px] mb-4
            text-[13px] text-stone-900 font-medium active:bg-stone-100 transition-colors">
          Já tenho conta — entrar
        </button>
        <div className="mt-auto pt-2">
          <BtnPrimary onClick={avancar} disabled={!podeAvancar || loading}>
            {loading ? 'A criar conta...' : 'Continuar'}
          </BtnPrimary>
        </div>
      </div>
    </Screen>
  )
}

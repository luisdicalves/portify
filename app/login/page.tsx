'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Screen, StatusBar, Field, BtnPrimary, BtnGhost } from '@/components/ui'

export default function Login() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [erro,     setErro]     = useState('')
  const [loading,  setLoading]  = useState(false)

  const podeEntrar = email.includes('@') && password.length >= 6

  async function entrar() {
    setErro('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setErro('Email ou palavra-passe incorretos.')
        return
      }
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  async function recuperar() {
    if (!email.includes('@')) { setErro('Insere o teu email primeiro.'); return }
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) { setErro(error.message); return }
    setErro('')
    alert('Email de recuperação enviado. Verifica a tua caixa de entrada.')
  }

  return (
    <Screen>
      <StatusBar />
      <div className="flex-1 flex flex-col px-6 py-8">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-brand-50 rounded-[18px] flex items-center justify-center mb-3">
            <TrendingUp size={26} color="#1D9E75" strokeWidth={1.75} />
          </div>
          <h1 className="text-[20px] font-semibold text-stone-900">Entrar na Portify</h1>
        </div>

        <Field label="Email"         type="email"    value={email}    onChange={setEmail}    placeholder="joao@gmail.com"    />
        <Field label="Palavra-passe" type="password" value={password} onChange={setPassword} placeholder="A tua palavra-passe" />

        {erro && (
          <p className="text-[12px] text-red-500 bg-red-50 border border-red-100
            rounded-xl px-4 py-3 mb-4">
            {erro}
          </p>
        )}

        <button
          onClick={recuperar}
          className="text-[12px] text-brand-600 text-right mb-6 -mt-2">
          Esqueci a palavra-passe
        </button>

        <BtnPrimary onClick={entrar} disabled={!podeEntrar || loading}>
          {loading ? 'A entrar...' : 'Entrar'}
        </BtnPrimary>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-stone-200" />
          <span className="text-[12px] text-stone-400">não tens conta?</span>
          <div className="flex-1 h-px bg-stone-200" />
        </div>

        <BtnGhost onClick={() => router.push('/onboarding')}>
          Criar conta gratuita
        </BtnGhost>
      </div>
    </Screen>
  )
}

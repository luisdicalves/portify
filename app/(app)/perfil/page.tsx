'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Settings, FileSpreadsheet, Link as LinkIcon,
  UserCog, ShieldCheck, Flame, Clock, Target } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const RISK_LABELS: Record<string, string> = {
  conservador: 'Conservador', moderado: 'Moderado',
  arrojado: 'Arrojado', 'muito-arrojado': 'Muito arrojado',
}
const OBJETIVO_LABELS: Record<string, string> = {
  independencia: 'Independência financeira', reforma: 'Reforma antecipada',
  rendimento: 'Rendimento passivo', crescimento: 'Crescimento de capital',
}
const HORIZONTE_LABELS: Record<string, string> = {
  '2anos': '< 2 anos', '2a5': '2–5 anos', '5a10': '5–10 anos', '10mais': '> 10 anos',
}

type Perfil = {
  nome: string
  apelido: string
  email: string
  risk: string
  horizonte: string
  objetivo: string
  experience: string
}

function ProfileRow({ icon: Icon, label, value, onClick }: {
  icon: React.ElementType; label: string; value?: string; onClick?: () => void
}) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 py-3 border-b border-stone-100 last:border-0">
      <Icon size={18} strokeWidth={1.75} color="#888780" className="flex-shrink-0" />
      <span className="text-[14px] text-stone-900 flex-1 text-left">{label}</span>
      {value && <span className="text-[13px] text-stone-400">{value}</span>}
      <ChevronRight size={14} color="#D3D1C7" />
    </button>
  )
}

function getIniciais(nome: string, apelido: string) {
  const n = nome?.trim()?.[0]?.toUpperCase() ?? ''
  const a = apelido?.trim()?.[0]?.toUpperCase() ?? ''
  return (n + a) || '?'
}

export default function Perfil() {
  const router  = useRouter()
  const [perfil, setPerfil] = useState<Perfil | null>(null)

  useEffect(() => {
    async function carregar() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/login'); return }

      const { data } = await supabase
        .from('perfis')
        .select('nome, apelido, risk, horizonte, objetivo, experience')
        .eq('id', session.user.id)
        .single()

      setPerfil({
        nome:       data?.nome       ?? session.user.user_metadata?.nome ?? '—',
        apelido:    data?.apelido    ?? session.user.user_metadata?.apelido ?? '—',
        email:      session.user.email ?? '—',
        risk:       data?.risk       ?? '—',
        horizonte:  data?.horizonte  ?? '—',
        objetivo:   data?.objetivo   ?? '—',
        experience: data?.experience ?? '—',
      })
    }
    carregar()
  }, [router])

  if (!perfil) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-[14px] text-stone-400">A carregar...</p>
      </div>
    )
  }

  const iniciais   = getIniciais(perfil.nome, perfil.apelido)
  const riskLabel  = RISK_LABELS[perfil.risk]      ?? perfil.risk
  const horizLabel = HORIZONTE_LABELS[perfil.horizonte] ?? perfil.horizonte
  const objLabel   = OBJETIVO_LABELS[perfil.objetivo]   ?? perfil.objetivo

  return (
    <div className="pb-2">
      <div className="bg-white px-5 pt-12 pb-3 flex justify-between items-center border-b border-stone-100">
        <p className="text-[17px] font-semibold text-stone-900">Perfil</p>
        <button onClick={() => router.push('/definicoes')}
          className="w-9 h-9 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-center">
          <Settings size={18} strokeWidth={1.75} color="#5F5E5A" />
        </button>
      </div>

      <div className="px-4 pt-4 space-y-3">

        {/* Avatar + info */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <div className="flex items-center gap-4 pb-4 border-b border-stone-100 mb-3">
            <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center
              text-[20px] font-semibold text-brand-800 flex-shrink-0">
              {iniciais}
            </div>
            <div>
              <p className="text-[17px] font-semibold text-stone-900">
                {perfil.nome} {perfil.apelido}
              </p>
              <p className="text-[13px] text-stone-500 mb-2">{perfil.email}</p>
              <div className="flex gap-2 flex-wrap">
                {riskLabel !== '—' && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-brand-50 text-brand-800">
                    {riskLabel}
                  </span>
                )}
                {horizLabel !== '—' && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800">
                    {horizLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
          <ProfileRow icon={UserCog}     label="Dados pessoais" />
          <ProfileRow icon={ShieldCheck} label="Segurança" value="PIN + Face ID" />
        </div>

        {/* Perfil de investidor */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-2">
            Perfil de investidor
          </p>
          <ProfileRow icon={Flame}  label="Perfil de risco"    value={riskLabel}  onClick={() => router.push('/perfil/editar-risco')} />
          <ProfileRow icon={Clock}  label="Horizonte temporal" value={horizLabel} />
          <ProfileRow icon={Target} label="Objetivo"           value={objLabel.length > 20 ? objLabel.slice(0,18) + '…' : objLabel} />
        </div>

        {/* Importar */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-2">
            Importar carteira
          </p>
          <div className="flex items-center gap-3 py-3 border-b border-stone-100">
            <FileSpreadsheet size={18} strokeWidth={1.75} color="#888780" />
            <span className="text-[14px] text-stone-900 flex-1">CSV / XLSX / XML</span>
            <span className="text-[12px] text-brand-600 font-medium">Importar</span>
          </div>
          <div className="flex items-center gap-3 py-3">
            <LinkIcon size={18} strokeWidth={1.75} color="#888780" />
            <span className="text-[14px] text-stone-900 flex-1">Ligar corretora</span>
            <span className="text-[12px] text-stone-400">Em breve</span>
          </div>
        </div>

        {/* Definições */}
        <button onClick={() => router.push('/definicoes')}
          className="w-full bg-white rounded-2xl border border-stone-200 p-4
            flex items-center gap-3">
          <Settings size={18} strokeWidth={1.75} color="#888780" />
          <span className="text-[14px] text-stone-900 flex-1 text-left">Definições</span>
          <ChevronRight size={14} color="#D3D1C7" />
        </button>

      </div>
    </div>
  )
}

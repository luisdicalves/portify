'use client'

import { useRouter } from 'next/navigation'
import { ChevronRight, Settings, FileSpreadsheet, Link as LinkIcon,
  UserCog, ShieldCheck, Flame, Clock, Target } from 'lucide-react'

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

export default function Perfil() {
  const router = useRouter()
  const RISCO_LABEL    = 'Arrojado'
  const HORIZONTE_LABEL= '> 10 anos'

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
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <div className="flex items-center gap-4 pb-4 border-b border-stone-100 mb-3">
            <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center text-[20px] font-semibold text-brand-800 flex-shrink-0">
              JS
            </div>
            <div>
              <p className="text-[17px] font-semibold text-stone-900">João Silva</p>
              <p className="text-[13px] text-stone-500 mb-2">joao@gmail.com</p>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-brand-50 text-brand-800">{RISCO_LABEL}</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800">{HORIZONTE_LABEL}</span>
              </div>
            </div>
          </div>
          <ProfileRow icon={UserCog}     label="Dados pessoais" />
          <ProfileRow icon={ShieldCheck} label="Segurança"      value="PIN + Face ID" />
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-2">Perfil de investidor</p>
          <ProfileRow icon={Flame}  label="Perfil de risco"    value={RISCO_LABEL}       onClick={() => router.push('/perfil/editar-risco')} />
          <ProfileRow icon={Clock}  label="Horizonte temporal" value={HORIZONTE_LABEL}   />
          <ProfileRow icon={Target} label="Objetivo"           value="Indep. financeira" />
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-2">Importar carteira</p>
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

        <button onClick={() => router.push('/definicoes')}
          className="w-full bg-white rounded-2xl border border-stone-200 p-4 flex items-center gap-3">
          <Settings size={18} strokeWidth={1.75} color="#888780" />
          <span className="text-[14px] text-stone-900 flex-1 text-left">Definições</span>
          <ChevronRight size={14} color="#D3D1C7" />
        </button>
      </div>
    </div>
  )
}

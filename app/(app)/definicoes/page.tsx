'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Globe, Euro, Sun, Bell, TrendingUp, Repeat, ArrowDown,
  Trophy, Lock, ScanFace, EyeOff, FileText, FileOutput, LogOut, Trash2, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

function Toggle({ on, onToggle }: { on:boolean; onToggle:()=>void }) {
  return (
    <button onClick={onToggle}
      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0
        ${on ? 'bg-brand-400' : 'bg-stone-300'}`}>
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform
        ${on ? 'translate-x-[18px]' : 'translate-x-0.5'}`}/>
    </button>
  )
}

function SRow({ icon:Icon, label, value, toggle, onToggle }: {
  icon:React.ElementType; label:string; value?:string
  toggle?:boolean; onToggle?:()=>void
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-stone-100 last:border-0">
      <Icon size={18} strokeWidth={1.75} color="#888780" className="flex-shrink-0"/>
      <span className="text-[14px] text-stone-900 flex-1">{label}</span>
      {toggle !== undefined && onToggle
        ? <Toggle on={toggle} onToggle={onToggle}/>
        : value
          ? <><span className="text-[13px] text-stone-400">{value}</span><ChevronRight size={14} color="#D3D1C7"/></>
          : <ChevronRight size={14} color="#D3D1C7"/>
      }
    </div>
  )
}

export default function Definicoes() {
  const router = useRouter()
  const [tema, setTema]  = useState<'Claro'|'Escuro'|'Auto'>('Claro')
  const [notifs, setNotifs] = useState({
    dividendos: true, maximo: true, rebalance: true,
    queda5: false, queda10: false, objetivos: true,
  })
  const [faceId,    setFaceId]    = useState(true)
  const [ocultar,   setOcultar]   = useState(false)
  const [loadingOut, setLoadingOut] = useState(false)

  function toggleNotif(key: keyof typeof notifs) {
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function terminarSessao() {
    setLoadingOut(true)
    await supabase.auth.signOut()
    setLoadingOut(false)
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white px-5 pt-12 pb-3 flex items-center gap-3 border-b border-stone-100">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center">
          <ArrowLeft size={20} strokeWidth={1.75} color="#888780"/>
        </button>
        <p className="text-[17px] font-semibold text-stone-900">Definições</p>
      </div>

      <div className="px-4 pt-4 space-y-3 pb-8">

        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-2">Geral</p>
          <SRow icon={Globe} label="Idioma"          value="Português"/>
          <SRow icon={Euro}  label="Moeda principal" value="EUR €"/>
          <div className="flex items-center gap-3 py-3">
            <Sun size={18} strokeWidth={1.75} color="#888780" className="flex-shrink-0"/>
            <span className="text-[14px] text-stone-900 flex-1">Tema</span>
            <div className="flex bg-stone-100 rounded-full p-0.5 gap-0.5">
              {(['Claro','Escuro','Auto'] as const).map(t => (
                <button key={t} onClick={() => setTema(t)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all
                    ${tema===t ? 'bg-white text-brand-800 shadow-sm' : 'text-stone-500'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-2">Notificações</p>
          <SRow icon={Bell}      label="Dividendos recebidos"     toggle={notifs.dividendos} onToggle={()=>toggleNotif('dividendos')}/>
          <SRow icon={TrendingUp}label="Novo máximo histórico"    toggle={notifs.maximo}     onToggle={()=>toggleNotif('maximo')}/>
          <SRow icon={Repeat}    label="Rebalanceamento sugerido" toggle={notifs.rebalance}  onToggle={()=>toggleNotif('rebalance')}/>
          <SRow icon={ArrowDown} label="Queda > 5%"               toggle={notifs.queda5}     onToggle={()=>toggleNotif('queda5')}/>
          <SRow icon={ArrowDown} label="Queda > 10%"              toggle={notifs.queda10}    onToggle={()=>toggleNotif('queda10')}/>
          <SRow icon={Trophy}    label="Objetivos atingidos"      toggle={notifs.objetivos}  onToggle={()=>toggleNotif('objetivos')}/>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-2">Privacidade e segurança</p>
          <SRow icon={Lock}     label="Alterar PIN"/>
          <SRow icon={ScanFace} label="Face ID / Touch ID" toggle={faceId}  onToggle={()=>setFaceId(v=>!v)}/>
          <SRow icon={EyeOff}   label="Ocultar valores"    toggle={ocultar} onToggle={()=>setOcultar(v=>!v)}/>
          <SRow icon={FileText} label="Política de privacidade"/>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-2">Dados</p>
          <SRow icon={FileOutput} label="Exportar carteira (CSV)"/>
          <SRow icon={FileOutput} label="Exportar relatório (PDF)"/>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <button
            onClick={terminarSessao}
            disabled={loadingOut}
            className="w-full flex items-center gap-3 py-3 border-b border-stone-100 active:bg-stone-50 transition-colors">
            <LogOut size={18} strokeWidth={1.75} color="#D85A30"/>
            <span className="text-[14px] text-red-500 font-medium flex-1 text-left">
              {loadingOut ? 'A terminar...' : 'Terminar sessão'}
            </span>
          </button>
          <button className="w-full flex items-center gap-3 py-3 active:bg-stone-50 transition-colors">
            <Trash2 size={18} strokeWidth={1.75} color="#D85A30"/>
            <span className="text-[14px] text-red-500 font-medium flex-1 text-left">Eliminar conta</span>
          </button>
        </div>

      </div>
    </div>
  )
}

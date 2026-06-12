'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Globe, Euro, Sun, Bell, TrendingUp, Repeat, ArrowDown,
  Trophy, Lock, ScanFace, EyeOff, FileText, FileOutput, LogOut, Trash2,
  ChevronRight, AlertTriangle, X } from 'lucide-react'
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

function DialogEliminarConta({ onClose, onConfirm, loading }: {
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}) {
  const [confirmado, setConfirmado] = useState(false)
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose}/>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white rounded-t-3xl z-50 pb-8 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-white z-10">
          <div className="w-10 h-1 bg-stone-200 rounded-full"/>
        </div>
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-stone-100 sticky top-5 bg-white z-10">
          <p className="text-[16px] font-semibold text-stone-900">Eliminar conta</p>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center">
            <X size={14} color="#5F5E5A" strokeWidth={2}/>
          </button>
        </div>
        <div className="px-5 pt-5 space-y-4">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle size={26} color="#D85A30" strokeWidth={1.75}/>
          </div>
          <div className="text-center">
            <p className="text-[15px] font-semibold text-stone-900 mb-1">Tens a certeza absoluta?</p>
            <p className="text-[13px] text-stone-500 leading-relaxed">
              Esta ação é <span className="font-semibold text-red-500">irreversível</span>. Ao eliminares a conta:
            </p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 space-y-2.5">
            {[
              'O teu perfil e dados pessoais serão permanentemente apagados',
              'Todo o histórico de transações será eliminado',
              'Todas as posições e portfólios serão removidos',
              'O plano de investimento e projeções serão perdidos',
              'Não será possível recuperar nenhum dado após a eliminação',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1.5"/>
                <p className="text-[12px] text-red-700 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => setConfirmado(v => !v)}
            className="w-full flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 active:bg-stone-100 transition-colors">
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors
              ${confirmado ? 'bg-red-500 border-red-500' : 'border-stone-300 bg-white'}`}>
              {confirmado && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <p className="text-[12px] text-stone-600 text-left leading-relaxed">
              Compreendo que esta ação é irreversível e que todos os meus dados serão eliminados
            </p>
          </button>
          <button
            onClick={onConfirm}
            disabled={!confirmado || loading}
            className="w-full bg-red-500 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold text-[14px] py-[13px] rounded-xl active:scale-[0.98] transition-all">
            {loading ? 'A eliminar...' : 'Eliminar conta permanentemente'}
          </button>
          <button onClick={onClose} className="w-full text-[13px] text-stone-500 py-2">
            Cancelar
          </button>
        </div>
      </div>
    </>
  )
}

export default function Definicoes() {
  const router = useRouter()
  const [tema, setTema]  = useState<'Claro'|'Escuro'|'Auto'>('Claro')
  const [notifs, setNotifs] = useState({
    dividendos: true, maximo: true, rebalance: true,
    queda5: false, queda10: false, objetivos: true,
  })
  const [faceId,       setFaceId]       = useState(true)
  const [ocultar,      setOcultar]      = useState(false)
  const [loadingOut,   setLoadingOut]   = useState(false)
  const [dialogEliminar, setDialogEliminar] = useState(false)
  const [loadingDelete,  setLoadingDelete]  = useState(false)

  function toggleNotif(key: keyof typeof notifs) {
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function terminarSessao() {
    setLoadingOut(true)
    await supabase.auth.signOut()
    setLoadingOut(false)
    router.push('/')
  }

  async function eliminarConta() {
    setLoadingDelete(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      // Apagar dados do utilizador nas tabelas
      await supabase.from('posicoes').delete().eq('user_id', session.user.id)
      await supabase.from('perfis').delete().eq('id', session.user.id)

      // Terminar sessão e redirecionar
      await supabase.auth.signOut()
      router.push('/')
    } catch {
      setLoadingDelete(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {dialogEliminar && (
        <DialogEliminarConta
          onClose={() => setDialogEliminar(false)}
          onConfirm={eliminarConta}
          loading={loadingDelete}
        />
      )}

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
          <SRow icon={Bell}       label="Dividendos recebidos"     toggle={notifs.dividendos} onToggle={()=>toggleNotif('dividendos')}/>
          <SRow icon={TrendingUp} label="Novo máximo histórico"    toggle={notifs.maximo}     onToggle={()=>toggleNotif('maximo')}/>
          <SRow icon={Repeat}     label="Rebalanceamento sugerido" toggle={notifs.rebalance}  onToggle={()=>toggleNotif('rebalance')}/>
          <SRow icon={ArrowDown}  label="Queda > 5%"               toggle={notifs.queda5}     onToggle={()=>toggleNotif('queda5')}/>
          <SRow icon={ArrowDown}  label="Queda > 10%"              toggle={notifs.queda10}    onToggle={()=>toggleNotif('queda10')}/>
          <SRow icon={Trophy}     label="Objetivos atingidos"      toggle={notifs.objetivos}  onToggle={()=>toggleNotif('objetivos')}/>
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
          <button
            onClick={() => setDialogEliminar(true)}
            className="w-full flex items-center gap-3 py-3 active:bg-stone-50 transition-colors">
            <Trash2 size={18} strokeWidth={1.75} color="#D85A30"/>
            <span className="text-[14px] text-red-500 font-medium flex-1 text-left">Eliminar conta</span>
          </button>
        </div>

      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Settings, FileSpreadsheet, Link as LinkIcon,
  UserCog, ShieldCheck, Flame, Clock, Target, X, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const RISK_OPTIONS   = [
  { id:'conservador',    label:'Conservador',    sub:'Prefiro segurança a retorno' },
  { id:'moderado',       label:'Moderado',       sub:'Equilíbrio entre risco e retorno' },
  { id:'arrojado',       label:'Arrojado',       sub:'Aceito volatilidade por mais retorno' },
  { id:'muito-arrojado', label:'Muito arrojado', sub:'Maximizo retorno a longo prazo' },
]
const HORIZONTE_OPTIONS = [
  { id:'2anos',  label:'< 2 anos' },
  { id:'2a5',    label:'2–5 anos' },
  { id:'5a10',   label:'5–10 anos' },
  { id:'10mais', label:'> 10 anos' },
]
const OBJETIVO_OPTIONS = [
  { id:'independencia', label:'Independência financeira', sub:'Viver sem depender do salário' },
  { id:'reforma',       label:'Reforma antecipada',       sub:'Reforma antes dos 60 anos' },
  { id:'rendimento',    label:'Rendimento passivo',       sub:'Dividendos regulares' },
  { id:'crescimento',   label:'Crescimento de capital',   sub:'Maximizar o valor da carteira' },
]
const RISK_LABELS: Record<string,string>      = Object.fromEntries(RISK_OPTIONS.map(o=>[o.id,o.label]))
const HORIZONTE_LABELS: Record<string,string> = Object.fromEntries(HORIZONTE_OPTIONS.map(o=>[o.id,o.label]))
const OBJETIVO_LABELS: Record<string,string>  = Object.fromEntries(OBJETIVO_OPTIONS.map(o=>[o.id,o.label]))

type PerfilData = {
  id: string; nome: string; apelido: string; email: string
  risk: string; horizonte: string; objetivo: string; experience: string
}

/* ── Dialog genérica ── */
function Dialog({ title, onClose, children }: { title:string; onClose:()=>void; children:React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose}/>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white rounded-t-3xl z-50 pb-8 shadow-2xl">
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-stone-200 rounded-full"/></div>
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-stone-100">
          <p className="text-[16px] font-semibold text-stone-900">{title}</p>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center">
            <X size={14} color="#5F5E5A" strokeWidth={2}/>
          </button>
        </div>
        <div className="px-5 pt-4">{children}</div>
      </div>
    </>
  )
}

/* ── Dialog dados pessoais ── */
function DialogDadosPessoais({ perfil, onClose, onSave }: {
  perfil: PerfilData; onClose:()=>void; onSave:(nome:string,apelido:string)=>void
}) {
  const [nome,    setNome]    = useState(perfil.nome)
  const [apelido, setApelido] = useState(perfil.apelido)
  const [loading, setLoading] = useState(false)

  async function guardar() {
    setLoading(true)
    await supabase.from('perfis').update({ nome, apelido }).eq('id', perfil.id)
    setLoading(false)
    onSave(nome, apelido)
    onClose()
  }

  return (
    <Dialog title="Dados pessoais" onClose={onClose}>
      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-[12px] font-medium text-stone-500 mb-1.5">Primeiro nome</label>
          <input value={nome} onChange={e=>setNome(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-[11px] text-[14px] text-stone-900 focus:outline-none focus:border-brand-400"/>
        </div>
        <div>
          <label className="block text-[12px] font-medium text-stone-500 mb-1.5">Apelido</label>
          <input value={apelido} onChange={e=>setApelido(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-[11px] text-[14px] text-stone-900 focus:outline-none focus:border-brand-400"/>
        </div>
        <div>
          <label className="block text-[12px] font-medium text-stone-500 mb-1.5">Email</label>
          <div className="w-full bg-stone-100 border border-stone-200 rounded-xl px-4 py-[11px] text-[14px] text-stone-400">{perfil.email}</div>
        </div>
      </div>
      <button onClick={guardar} disabled={loading}
        className="w-full bg-brand-400 text-white font-medium text-[15px] py-[13px] rounded-xl disabled:opacity-50">
        {loading ? 'A guardar...' : 'Guardar'}
      </button>
    </Dialog>
  )
}

/* ── Dialog opções (risco, horizonte, objetivo) ── */
function DialogOpcoes({ title, options, value, onClose, onSave, campoDb }: {
  title: string
  options: { id:string; label:string; sub?:string }[]
  value: string
  onClose: ()=>void
  onSave: (id:string)=>void
  campoDb: string
}) {
  const [sel,     setSel]     = useState(value)
  const [loading, setLoading] = useState(false)
  const { data: { session } } = { data: { session: null as any } }

  async function guardar() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      await supabase.from('perfis').update({ [campoDb]: sel }).eq('id', session.user.id)
    }
    setLoading(false)
    onSave(sel)
    onClose()
  }

  return (
    <Dialog title={title} onClose={onClose}>
      <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
        {options.map(o => (
          <button key={o.id} onClick={() => setSel(o.id)}
            className={`w-full text-left rounded-xl px-4 py-3 border flex items-center justify-between gap-3 transition-all
              ${sel===o.id ? 'bg-brand-50 border-brand-400' : 'bg-stone-50 border-stone-200'}`}>
            <div>
              <p className={`text-[14px] font-medium ${sel===o.id ? 'text-brand-800' : 'text-stone-900'}`}>{o.label}</p>
              {o.sub && <p className={`text-[12px] mt-0.5 ${sel===o.id ? 'text-brand-600' : 'text-stone-500'}`}>{o.sub}</p>}
            </div>
            <div className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0
              ${sel===o.id ? 'bg-brand-400 border-brand-400' : 'border-stone-300'}`}>
              {sel===o.id && <Check size={11} color="white" strokeWidth={3}/>}
            </div>
          </button>
        ))}
      </div>
      <button onClick={guardar} disabled={loading}
        className="w-full bg-brand-400 text-white font-medium text-[15px] py-[13px] rounded-xl disabled:opacity-50">
        {loading ? 'A guardar...' : 'Guardar'}
      </button>
    </Dialog>
  )
}

function getIniciais(nome:string, apelido:string) {
  return ((nome?.[0]??'')+(apelido?.[0]??'')).toUpperCase()||'?'
}

function ProfileRow({ icon:Icon, label, value, onClick }: {
  icon:React.ElementType; label:string; value?:string; onClick?:()=>void
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 py-3 border-b border-stone-100 last:border-0">
      <Icon size={18} strokeWidth={1.75} color="#888780" className="flex-shrink-0"/>
      <span className="text-[14px] text-stone-900 flex-1 text-left">{label}</span>
      {value && <span className="text-[13px] text-stone-400">{value}</span>}
      <ChevronRight size={14} color="#D3D1C7"/>
    </button>
  )
}

export default function Perfil() {
  const router = useRouter()
  const [perfil,  setPerfil]  = useState<PerfilData|null>(null)
  const [dialog,  setDialog]  = useState<'pessoais'|'risco'|'horizonte'|'objetivo'|null>(null)

  useEffect(() => {
    async function carregar() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/login'); return }
      const { data } = await supabase.from('perfis')
        .select('nome, apelido, risk, horizonte, objetivo, experience')
        .eq('id', session.user.id).single()
      setPerfil({
        id:         session.user.id,
        nome:       data?.nome       ?? session.user.user_metadata?.nome    ?? '',
        apelido:    data?.apelido    ?? session.user.user_metadata?.apelido ?? '',
        email:      session.user.email ?? '',
        risk:       data?.risk       ?? '',
        horizonte:  data?.horizonte  ?? '',
        objetivo:   data?.objetivo   ?? '',
        experience: data?.experience ?? '',
      })
    }
    carregar()
  }, [router])

  if (!perfil) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <p className="text-[14px] text-stone-400">A carregar...</p>
    </div>
  )

  const iniciais   = getIniciais(perfil.nome, perfil.apelido)
  const riskLabel  = RISK_LABELS[perfil.risk]           ?? '—'
  const horizLabel = HORIZONTE_LABELS[perfil.horizonte] ?? '—'
  const objLabel   = OBJETIVO_LABELS[perfil.objetivo]   ?? '—'

  return (
    <div className="pb-2">

      {/* Dialogs */}
      {dialog==='pessoais' && (
        <DialogDadosPessoais perfil={perfil} onClose={()=>setDialog(null)}
          onSave={(nome,apelido)=>setPerfil(p=>p?{...p,nome,apelido}:p)}/>
      )}
      {dialog==='risco' && (
        <DialogOpcoes title="Perfil de risco" options={RISK_OPTIONS} value={perfil.risk}
          campoDb="risk" onClose={()=>setDialog(null)}
          onSave={v=>setPerfil(p=>p?{...p,risk:v}:p)}/>
      )}
      {dialog==='horizonte' && (
        <DialogOpcoes title="Horizonte temporal" options={HORIZONTE_OPTIONS} value={perfil.horizonte}
          campoDb="horizonte" onClose={()=>setDialog(null)}
          onSave={v=>setPerfil(p=>p?{...p,horizonte:v}:p)}/>
      )}
      {dialog==='objetivo' && (
        <DialogOpcoes title="Objetivo principal" options={OBJETIVO_OPTIONS} value={perfil.objetivo}
          campoDb="objetivo" onClose={()=>setDialog(null)}
          onSave={v=>setPerfil(p=>p?{...p,objetivo:v}:p)}/>
      )}

      <div className="bg-white px-5 pt-12 pb-3 flex justify-between items-center border-b border-stone-100">
        <p className="text-[17px] font-semibold text-stone-900">Perfil</p>
        <button onClick={()=>router.push('/definicoes')}
          className="w-9 h-9 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-center">
          <Settings size={18} strokeWidth={1.75} color="#5F5E5A"/>
        </button>
      </div>

      <div className="px-4 pt-4 space-y-3">
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <div className="flex items-center gap-4 pb-4 border-b border-stone-100 mb-3">
            <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center text-[20px] font-semibold text-brand-800 flex-shrink-0">
              {iniciais}
            </div>
            <div>
              <p className="text-[17px] font-semibold text-stone-900">{perfil.nome} {perfil.apelido}</p>
              <p className="text-[13px] text-stone-500 mb-2">{perfil.email}</p>
              <div className="flex gap-2 flex-wrap">
                {riskLabel!=='—' && <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-brand-50 text-brand-800">{riskLabel}</span>}
                {horizLabel!=='—' && <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800">{horizLabel}</span>}
              </div>
            </div>
          </div>
          <ProfileRow icon={UserCog}     label="Dados pessoais" onClick={()=>setDialog('pessoais')}/>
          <ProfileRow icon={ShieldCheck} label="Segurança"      value="PIN + Face ID"/>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-2">Perfil de investidor</p>
          <ProfileRow icon={Flame}  label="Perfil de risco"    value={riskLabel}  onClick={()=>setDialog('risco')}/>
          <ProfileRow icon={Clock}  label="Horizonte temporal" value={horizLabel} onClick={()=>setDialog('horizonte')}/>
          <ProfileRow icon={Target} label="Objetivo"           value={objLabel.length>22?objLabel.slice(0,20)+'…':objLabel} onClick={()=>setDialog('objetivo')}/>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-2">Importar carteira</p>
          <div className="flex items-center gap-3 py-3 border-b border-stone-100">
            <FileSpreadsheet size={18} strokeWidth={1.75} color="#888780"/>
            <span className="text-[14px] text-stone-900 flex-1">CSV / XLSX / XML</span>
            <span className="text-[12px] text-brand-600 font-medium">Importar</span>
          </div>
          <div className="flex items-center gap-3 py-3">
            <LinkIcon size={18} strokeWidth={1.75} color="#888780"/>
            <span className="text-[14px] text-stone-900 flex-1">Ligar corretora</span>
            <span className="text-[12px] text-stone-400">Em breve</span>
          </div>
        </div>

        <button onClick={()=>router.push('/definicoes')}
          className="w-full bg-white rounded-2xl border border-stone-200 p-4 flex items-center gap-3">
          <Settings size={18} strokeWidth={1.75} color="#888780"/>
          <span className="text-[14px] text-stone-900 flex-1 text-left">Definições</span>
          <ChevronRight size={14} color="#D3D1C7"/>
        </button>
      </div>
    </div>
  )
}

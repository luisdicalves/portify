'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Settings, FileSpreadsheet, Link as LinkIcon,
  UserCog, Flame, Clock, Target, X, Check,
  Upload, AlertCircle, CheckCircle, Wallet, Tag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/PageHeader'
import type { Periodo } from '@/lib/onboarding-context'

/* ── Plano: configuração ── */
const BUDGETS = [100, 250, 300, 500, 1000]

const PERIODOS: { label: string; value: Periodo; multMensal: number }[] = [
  { label: 'Semanal',    value: 'semanal',    multMensal: 4    },
  { label: 'Quinzenal',  value: 'quinzenal',  multMensal: 2    },
  { label: 'Mensal',     value: 'mensal',     multMensal: 1    },
  { label: 'Trimestral', value: 'trimestral', multMensal: 1/3  },
  { label: 'Semestral',  value: 'semestral',  multMensal: 1/6  },
  { label: 'Anual',      value: 'anual',      multMensal: 1/12 },
]

const HORIZONTES_PLANO: { label: string; value: string; anos: number }[] = [
  { label: '< 2 anos',   value: '2anos',  anos: 2  },
  { label: '2–5 anos',   value: '2a5',    anos: 5  },
  { label: '5–10 anos',  value: '5a10',   anos: 10 },
  { label: '> 10 anos',  value: '10mais', anos: 20 },
]

/* ── Setores de interesse ── */
const SETORES = [
  { id: 'tecnologia',      emoji: '💻', label: 'Tecnologia'              },
  { id: 'saude',           emoji: '🏥', label: 'Saúde & Farmacêutica'    },
  { id: 'financas',        emoji: '🏦', label: 'Finanças & Bancos'       },
  { id: 'energia',         emoji: '⚡', label: 'Energia'                 },
  { id: 'consumo',         emoji: '🛒', label: 'Consumo & Retalho'       },
  { id: 'industria',       emoji: '🏭', label: 'Indústria'               },
  { id: 'imobiliario',     emoji: '🏠', label: 'Imobiliário'             },
  { id: 'utilidades',      emoji: '💧', label: 'Utilidades'              },
  { id: 'materiais',       emoji: '🪨', label: 'Materiais Básicos'       },
  { id: 'comunicacoes',    emoji: '📡', label: 'Comunicações & Media'    },
  { id: 'aeroespacial',    emoji: '🚀', label: 'Aeroespacial & Defesa'   },
  { id: 'alimentacao',     emoji: '🍎', label: 'Alimentação & Bebidas'   },
  { id: 'automobilismo',   emoji: '🚗', label: 'Automóvel & Mobilidade'  },
  { id: 'semicondutores',  emoji: '🔬', label: 'Semicondutores'          },
  { id: 'ia-robotica',     emoji: '🤖', label: 'IA & Robótica'          },
]
const SETORES_LABELS: Record<string,string> = Object.fromEntries(SETORES.map(s=>[s.id,s.label]))

function fmtEuro(n: number) {
  return n.toLocaleString('pt-PT') + ' €'
}
function calcFV(pmtMensal: number, anos: number, r: number) {
  const n  = anos * 12
  const rm = r / 12
  if (rm === 0) return Math.round(pmtMensal * n)
  return Math.round(pmtMensal * ((Math.pow(1 + rm, n) - 1) / rm))
}

/* ── Tipos ── */
const RISK_OPTIONS = [
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
const RISK_LABELS:     Record<string,string> = Object.fromEntries(RISK_OPTIONS.map(o=>[o.id,o.label]))
const HORIZONTE_LABELS:Record<string,string> = Object.fromEntries(HORIZONTE_OPTIONS.map(o=>[o.id,o.label]))
const OBJETIVO_LABELS: Record<string,string> = Object.fromEntries(OBJETIVO_OPTIONS.map(o=>[o.id,o.label]))

type PerfilData = {
  id: string; nome: string; apelido: string; email: string
  data_nascimento: string; risk: string; horizonte: string; objetivo: string
  user_id_publico: string
  meta_euros: number; invest_euros: number; periodo: Periodo; setores: string[]
}

/* ── Dialog base ── */
function Dialog({ title, onClose, children }: { title:string; onClose:()=>void; children:React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[55]" onClick={onClose}/>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white rounded-t-3xl z-[60] pb-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-white"><div className="w-10 h-1 bg-stone-200 rounded-full"/></div>
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-stone-100 sticky top-5 bg-white">
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
  perfil:PerfilData; onClose:()=>void; onSave:(email:string)=>void
}) {
  const [email,   setEmail]   = useState(perfil.email)
  const [erro,    setErro]    = useState('')
  const [loading, setLoading] = useState(false)

  function formatarData(d:string) {
    if (!d) return '—'
    try { return new Date(d).toLocaleDateString('pt-PT') } catch { return d }
  }

  async function guardar() {
    if (!email.includes('@')) { setErro('Email inválido.'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ email })
    if (error) { setErro(error.message); setLoading(false); return }
    setLoading(false); onSave(email); onClose()
  }

  return (
    <Dialog title="Dados pessoais" onClose={onClose}>
      <div className="space-y-3 mb-4">
        {[
          { label:'Primeiro nome',      value:perfil.nome },
          { label:'Apelido',            value:perfil.apelido },
          { label:'Data de nascimento', value:formatarData(perfil.data_nascimento) },
          { label:'ID de utilizador',   value: perfil.user_id_publico ? '@' + perfil.user_id_publico : '—' },
        ].map(f => (
          <div key={f.label}>
            <label className="block text-[12px] font-medium text-stone-400 mb-1.5">{f.label}</label>
            <div className="w-full bg-stone-100 border border-stone-200 rounded-xl px-4 py-[11px]
              text-[14px] text-stone-400 flex items-center justify-between">
              <span>{f.value||'—'}</span>
              <span className="text-[11px] text-stone-300">bloqueado</span>
            </div>
          </div>
        ))}
        <div>
          <label className="block text-[12px] font-medium text-stone-500 mb-1.5">Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email"
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-[11px]
              text-[14px] text-stone-900 focus:outline-none focus:border-brand-400 transition-colors"/>
        </div>
        {erro && <p className="text-[12px] text-red-500 bg-red-50 rounded-xl px-4 py-3">{erro}</p>}
      </div>
      <button onClick={guardar} disabled={loading}
        className="w-full bg-brand-400 text-white font-medium text-[15px] py-[13px] rounded-xl disabled:opacity-50">
        {loading ? 'A guardar...' : 'Guardar email'}
      </button>
    </Dialog>
  )
}

/* ── Dialog opções ── */
function DialogOpcoes({ title, options, value, onClose, onSave, campoDb }: {
  title:string; options:{id:string;label:string;sub?:string}[]
  value:string; onClose:()=>void; onSave:(id:string)=>void; campoDb:string
}) {
  const [sel,     setSel]     = useState(value)
  const [loading, setLoading] = useState(false)

  async function guardar() {
    setLoading(true)
    const { data:{session} } = await supabase.auth.getSession()
    if (session?.user) await supabase.from('perfis').update({[campoDb]:sel}).eq('id',session.user.id)
    setLoading(false); onSave(sel); onClose()
  }

  return (
    <Dialog title={title} onClose={onClose}>
      <div className="space-y-2 mb-4 max-h-72 overflow-y-auto">
        {options.map(o => (
          <button key={o.id} onClick={()=>setSel(o.id)}
            className={`w-full text-left rounded-xl px-4 py-3 border flex items-center justify-between gap-3 transition-all
              ${sel===o.id?'bg-brand-50 border-brand-400':'bg-stone-50 border-stone-200'}`}>
            <div>
              <p className={`text-[14px] font-medium ${sel===o.id?'text-brand-800':'text-stone-900'}`}>{o.label}</p>
              {o.sub&&<p className={`text-[12px] mt-0.5 ${sel===o.id?'text-brand-600':'text-stone-500'}`}>{o.sub}</p>}
            </div>
            <div className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0
              ${sel===o.id?'bg-brand-400 border-brand-400':'border-stone-300'}`}>
              {sel===o.id&&<Check size={11} color="white" strokeWidth={3}/>}
            </div>
          </button>
        ))}
      </div>
      <button onClick={guardar} disabled={loading}
        className="w-full bg-brand-400 text-white font-medium text-[15px] py-[13px] rounded-xl disabled:opacity-50">
        {loading?'A guardar...':'Guardar'}
      </button>
    </Dialog>
  )
}

/* ── Dialog importar carteira ── */
function DialogImportar({ userId, onClose }: { userId:string; onClose:()=>void }) {
  const [estado,    setEstado]    = useState<'idle'|'loading'|'sucesso'|'erro'>('idle')
  const [mensagem,  setMensagem]  = useState('')
  const [importadas,setImportadas]= useState(0)
  const [erros,     setErros]     = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  async function processarFicheiro(file: File) {
    setEstado('loading')
    setMensagem('A processar ficheiro...')

    try {
      const ext = file.name.split('.').pop()?.toLowerCase()

      let linhas: any[] = []

      if (ext === 'csv') {
        const texto = await file.text()
        linhas = parsearCSV(texto)
      } else if (ext === 'xlsx') {
        linhas = await parsearXLSX(file)
      } else {
        setEstado('erro')
        setMensagem('Formato não suportado. Usa CSV ou XLSX.')
        return
      }

      if (linhas.length === 0) {
        setEstado('erro')
        setMensagem('Nenhuma transação encontrada no ficheiro.')
        return
      }

      setMensagem(`${linhas.length} transações encontradas. A importar...`)

      const res = await fetch('/api/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linhas, userId }),
      })
      const data = await res.json()

      if (!res.ok) {
        setEstado('erro')
        setMensagem(data.error ?? 'Erro ao importar.')
        return
      }

      setImportadas(data.importadas)
      setErros(data.erros ?? [])
      setEstado('sucesso')
      setMensagem(`${data.importadas} posições importadas com sucesso.`)
    } catch (e:any) {
      setEstado('erro')
      setMensagem(e.message ?? 'Erro inesperado.')
    }
  }

  function parsearCSV(texto: string): any[] {
    const linhas = texto.split('\n').filter(l => l.trim())
    if (linhas.length < 2) return []
    const cabecalho = linhas[0].split(',').map(c => c.trim().toLowerCase().replace(/\s+/g,'_'))
    return linhas.slice(1).map(l => {
      const vals = l.split(',')
      const obj: any = {}
      cabecalho.forEach((c,i) => { obj[c] = vals[i]?.trim().replace(/^"|"$/g,'') })
      return obj
    }).filter(r => r.type?.toLowerCase().includes('purchase') || r.type?.toLowerCase().includes('buy'))
  }

  async function parsearXLSX(file: File): Promise<any[]> {
    // Usamos SheetJS via CDN carregado dinamicamente
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          // Importar SheetJS
          const XLSX = await import('xlsx')
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const wb = XLSX.read(data, { type: 'array' })

          // Procurar folha de CASH OPERATION HISTORY
          const nomeFolha = wb.SheetNames.find(n =>
            n.toUpperCase().includes('CASH') || n.toUpperCase().includes('OPERATION')
          ) ?? wb.SheetNames[wb.SheetNames.length - 1]

          const ws = wb.Sheets[nomeFolha]
          const rows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[]

          // Encontrar linha do cabeçalho
          let headerIdx = -1
          let cabecalho: string[] = []
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i] as any[]
            const str = row.join(' ').toLowerCase()
            if (str.includes('type') && str.includes('symbol') && str.includes('amount')) {
              headerIdx = i
              cabecalho = row.map((c:any) => String(c).trim().toLowerCase().replace(/\s+/g,'_'))
              break
            }
          }

          if (headerIdx === -1) { resolve([]); return }

          const resultado = rows.slice(headerIdx + 1)
            .map((row:any) => {
              const obj: any = {}
              cabecalho.forEach((c,i) => { obj[c] = row[i] ?? '' })
              return obj
            })
            .filter((r:any) =>
              String(r.type).toLowerCase().includes('purchase') ||
              String(r.type).toLowerCase().includes('buy')
            )

          resolve(resultado)
        } catch(err) {
          reject(err)
        }
      }
      reader.readAsArrayBuffer(file)
    })
  }

  return (
    <Dialog title="Importar carteira" onClose={onClose}>
      <div className="space-y-4 pb-2">

        {/* Info formato */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-1">
          <p className="text-[12px] font-medium text-stone-600">Formatos suportados</p>
          <p className="text-[12px] text-stone-400 leading-relaxed">
            CSV ou XLSX exportado do XTB (relatório de operações de caixa).
            As compras de ações são importadas automaticamente.
          </p>
        </div>

        {/* Área de upload */}
        {estado === 'idle' && (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full border-2 border-dashed border-stone-300 rounded-2xl p-8
              flex flex-col items-center gap-3 text-center
              hover:border-brand-400 hover:bg-brand-50 transition-all active:scale-[0.98]">
            <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center">
              <Upload size={22} color="#888780"/>
            </div>
            <div>
              <p className="text-[14px] font-medium text-stone-700">Selecionar ficheiro</p>
              <p className="text-[12px] text-stone-400 mt-0.5">CSV ou XLSX · máx. 10MB</p>
            </div>
          </button>
        )}

        {/* Loading */}
        {estado === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-10 h-10 border-2 border-brand-400 border-t-transparent rounded-full animate-spin"/>
            <p className="text-[13px] text-stone-600">{mensagem}</p>
          </div>
        )}

        {/* Sucesso */}
        {estado === 'sucesso' && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-brand-50 border border-brand-100 rounded-xl p-4">
              <CheckCircle size={20} color="#1D9E75" className="flex-shrink-0 mt-0.5"/>
              <div>
                <p className="text-[13px] font-medium text-brand-800">{mensagem}</p>
                {erros.length > 0 && (
                  <p className="text-[12px] text-brand-600 mt-1">{erros.length} linhas ignoradas.</p>
                )}
              </div>
            </div>
            <button onClick={onClose}
              className="w-full bg-brand-400 text-white font-medium text-[15px] py-[13px] rounded-xl">
              Fechar
            </button>
          </div>
        )}

        {/* Erro */}
        {estado === 'erro' && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
              <AlertCircle size={20} color="#D85A30" className="flex-shrink-0 mt-0.5"/>
              <p className="text-[13px] text-red-700">{mensagem}</p>
            </div>
            <button onClick={() => setEstado('idle')}
              className="w-full bg-stone-100 border border-stone-200 text-stone-700 font-medium text-[14px] py-[12px] rounded-xl">
              Tentar novamente
            </button>
          </div>
        )}

        <input ref={inputRef} type="file" accept=".csv,.xlsx"
          className="hidden"
          onChange={e => { const f=e.target.files?.[0]; if(f) processarFicheiro(f) }}/>
      </div>
    </Dialog>
  )
}

/* ── Chip local (estilo plano) ── */
function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-[7px] rounded-full text-[13px] border transition-all duration-150
        ${selected
          ? 'bg-brand-50 border-brand-400 text-brand-800 font-medium'
          : 'bg-stone-50 border-stone-300 text-stone-600 active:bg-stone-100'
        }`}>
      {label}
    </button>
  )
}

/* ── Dialog plano de investimento ── */
function DialogPlano({ perfil, onClose, onSave }: {
  perfil: PerfilData; onClose: () => void
  onSave: (v: { meta_euros: number; invest_euros: number; periodo: Periodo; horizonte: string }) => void
}) {
  const [investPreset,   setInvestPreset]   = useState<number | null>(
    BUDGETS.includes(perfil.invest_euros) ? perfil.invest_euros : null
  )
  const [investCustom,   setInvestCustom]   = useState(
    BUDGETS.includes(perfil.invest_euros) ? '' : String(perfil.invest_euros || '')
  )
  const [investPersonal, setInvestPersonal] = useState(!BUDGETS.includes(perfil.invest_euros))

  const [periodo, setPeriodo] = useState<Periodo>(perfil.periodo || 'mensal')

  const horizontePadrao = HORIZONTES_PLANO.some(h=>h.value===perfil.horizonte) ? perfil.horizonte : '10mais'
  const [horizontePreset,   setHorizontePreset]   = useState<string | null>(horizontePadrao)
  const [horizonteCustom,   setHorizonteCustom]   = useState('')
  const [horizontePersonal, setHorizontePersonal] = useState(false)

  const [metaCustom, setMetaCustom] = useState(String(perfil.meta_euros || 100000))

  const [loading, setLoading] = useState(false)

  const investValor = investPersonal
    ? (parseFloat(investCustom.replace(',', '.')) || 0)
    : (investPreset ?? 0)

  const anosValor = horizontePersonal
    ? (parseInt(horizonteCustom) || 0)
    : (HORIZONTES_PLANO.find(h => h.value === horizontePreset)?.anos ?? 20)

  const multMensal = PERIODOS.find(p => p.value === periodo)?.multMensal ?? 1
  const pmtMensal  = investValor * multMensal

  const min = calcFV(pmtMensal, anosValor, 0.08)
  const max = calcFV(pmtMensal, anosValor, 0.11)
  const projecaoValida = investValor > 0 && anosValor > 0
  const periodoLabel = PERIODOS.find(p => p.value === periodo)?.label.toLowerCase() ?? periodo

  function selectBudget(v: number) {
    setInvestPreset(v); setInvestPersonal(false); setInvestCustom('')
  }
  function togglePersonalInvest() {
    setInvestPersonal(p => { if (!p) setInvestPreset(null); else setInvestPreset(300); return !p })
    setInvestCustom('')
  }
  function selectHorizonte(v: string) {
    setHorizontePreset(v); setHorizontePersonal(false); setHorizonteCustom('')
  }
  function togglePersonalHorizonte() {
    setHorizontePersonal(p => { if (!p) setHorizontePreset(null); else setHorizontePreset('10mais'); return !p })
    setHorizonteCustom('')
  }

  async function guardar() {
    setLoading(true)
    const horizonteFinal = horizontePersonal ? perfil.horizonte : (horizontePreset ?? '10mais')
    const metaFinal = parseFloat(metaCustom.replace(',','.')) || perfil.meta_euros || 100000
    const valores = {
      meta_euros: Math.round(metaFinal),
      invest_euros: Math.round(investValor),
      periodo,
      horizonte: horizonteFinal,
    }
    const { data:{session} } = await supabase.auth.getSession()
    if (session?.user) await supabase.from('perfis').update(valores).eq('id', session.user.id)
    setLoading(false)
    onSave(valores)
    onClose()
  }

  return (
    <Dialog title="Plano de investimento" onClose={onClose}>
      <div className="space-y-5 pb-2">
        {/* Objetivo total */}
        <div>
          <label className="block text-[12px] font-medium text-stone-500 mb-1.5">Objetivo total (€)</label>
          <input type="number" inputMode="decimal" min="0" value={metaCustom}
            onChange={e=>setMetaCustom(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-[11px]
              text-[14px] text-stone-900 focus:outline-none focus:border-brand-400 transition-colors"/>
        </div>

        {/* Investimento por período */}
        <div>
          <p className="text-[12px] font-medium text-stone-500 mb-2">Investimento por período</p>
          <div className="flex flex-wrap gap-2">
            {BUDGETS.map(b => (
              <Chip key={b} label={`${b.toLocaleString('pt-PT')} €`}
                selected={!investPersonal && investPreset === b}
                onClick={() => selectBudget(b)}/>
            ))}
            <Chip label="Personalizado" selected={investPersonal} onClick={togglePersonalInvest}/>
          </div>
          {investPersonal && (
            <div className="mt-2 flex items-center gap-2 bg-stone-50 border border-brand-400
              rounded-xl px-4 py-[10px]">
              <span className="text-[14px] text-stone-400 flex-shrink-0">€</span>
              <input autoFocus type="number" inputMode="decimal" min="0" placeholder="Ex: 450"
                value={investCustom} onChange={e=>setInvestCustom(e.target.value)}
                className="flex-1 bg-transparent text-[16px] font-medium text-stone-900 placeholder:text-stone-300 focus:outline-none min-w-0"/>
            </div>
          )}
        </div>

        {/* Periodicidade */}
        <div>
          <p className="text-[12px] font-medium text-stone-500 mb-2">Periodicidade</p>
          <div className="flex flex-wrap gap-2">
            {PERIODOS.map(p => (
              <Chip key={p.value} label={p.label} selected={periodo===p.value} onClick={()=>setPeriodo(p.value)}/>
            ))}
          </div>
        </div>

        {/* Horizonte temporal */}
        <div>
          <p className="text-[12px] font-medium text-stone-500 mb-2">Horizonte temporal</p>
          <div className="flex flex-wrap gap-2">
            {HORIZONTES_PLANO.map(h => (
              <Chip key={h.value} label={h.label}
                selected={!horizontePersonal && horizontePreset === h.value}
                onClick={() => selectHorizonte(h.value)}/>
            ))}
            <Chip label="Personalizado" selected={horizontePersonal} onClick={togglePersonalHorizonte}/>
          </div>
          {horizontePersonal && (
            <div className="mt-2 flex items-center gap-2 bg-stone-50 border border-brand-400
              rounded-xl px-4 py-[10px]">
              <input autoFocus type="number" inputMode="decimal" min="0" placeholder="Ex: 15"
                value={horizonteCustom} onChange={e=>setHorizonteCustom(e.target.value)}
                className="flex-1 bg-transparent text-[16px] font-medium text-stone-900 placeholder:text-stone-300 focus:outline-none min-w-0"/>
              <span className="text-[14px] text-stone-400 flex-shrink-0">anos</span>
            </div>
          )}
        </div>

        {/* Projeção */}
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-[26px] h-[26px] bg-brand-400 rounded-[8px] flex items-center justify-center">
              <span className="text-white text-[13px]">✦</span>
            </div>
            <p className="text-[13px] font-medium text-brand-800">Projeção automática por IA</p>
          </div>
          {projecaoValida ? (
            <>
              <p className="text-[13px] text-brand-600 leading-relaxed mb-2">
                Com <strong>{fmtEuro(investValor)}/{periodoLabel}</strong> durante{' '}
                <strong>{anosValor} {anosValor === 1 ? 'ano' : 'anos'}</strong>, podes atingir entre
              </p>
              <p className="text-[24px] font-bold text-brand-800 mb-1">{fmtEuro(min)} – {fmtEuro(max)}</p>
              <p className="text-[12px] text-brand-400">com CAGR estimado entre 8% e 11%</p>
            </>
          ) : (
            <p className="text-[13px] text-brand-500 leading-relaxed">
              Preenche o investimento e o horizonte temporal para ver a projeção.
            </p>
          )}
        </div>
      </div>
      <button onClick={guardar} disabled={loading}
        className="w-full bg-brand-400 text-white font-medium text-[15px] py-[13px] rounded-xl disabled:opacity-50">
        {loading ? 'A guardar...' : 'Guardar plano'}
      </button>
    </Dialog>
  )
}

/* ── Dialog setores de interesse ── */
function DialogSetores({ value, onClose, onSave }: {
  value: string[]; onClose: () => void; onSave: (setores: string[]) => void
}) {
  const [selecionados, setSelecionados] = useState<string[]>(value)
  const [loading, setLoading] = useState(false)

  function toggle(id: string) {
    setSelecionados(prev => prev.includes(id) ? prev.filter(s=>s!==id) : [...prev, id])
  }

  async function guardar() {
    setLoading(true)
    const { data:{session} } = await supabase.auth.getSession()
    if (session?.user) await supabase.from('perfis').update({ setores: selecionados }).eq('id', session.user.id)
    setLoading(false)
    onSave(selecionados)
    onClose()
  }

  return (
    <Dialog title="Setores de interesse" onClose={onClose}>
      <p className="text-[12px] text-stone-500 mb-3 leading-relaxed">
        Escolhe os setores que mais te interessam. Usamos isso para personalizar as tuas recomendações.
      </p>
      <div className="space-y-2 mb-4 max-h-[50vh] overflow-y-auto">
        {SETORES.map(s => {
          const sel = selecionados.includes(s.id)
          return (
            <button key={s.id} onClick={()=>toggle(s.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
                ${sel ? 'bg-brand-50 border-brand-400' : 'bg-stone-50 border-stone-200'}`}>
              <span className="text-[18px] w-6 flex-shrink-0">{s.emoji}</span>
              <span className={`flex-1 text-left text-[14px] font-medium ${sel?'text-brand-900':'text-stone-700'}`}>{s.label}</span>
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors
                ${sel ? 'bg-brand-400 border-brand-400' : 'border-stone-300'}`}>
                {sel && <Check size={11} color="white" strokeWidth={3}/>}
              </div>
            </button>
          )
        })}
      </div>
      <button onClick={guardar} disabled={loading}
        className="w-full bg-brand-400 text-white font-medium text-[15px] py-[13px] rounded-xl disabled:opacity-50">
        {loading ? 'A guardar...' : `Guardar (${selecionados.length} selecionado${selecionados.length!==1?'s':''})`}
      </button>
    </Dialog>
  )
}

/* ── Helpers ── */
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
      {value&&<span className="text-[13px] text-stone-400 truncate max-w-[120px]">{value}</span>}
      <ChevronRight size={14} color="#D3D1C7" className="flex-shrink-0"/>
    </button>
  )
}

/* ── Página ── */
export default function Perfil() {
  const router  = useRouter()
  const [perfil,     setPerfil]     = useState<PerfilData|null>(null)
  const [dialog,     setDialog]     = useState<'pessoais'|'risco'|'horizonte'|'objetivo'|'importar'|'plano'|'setores'|null>(null)
  const [atualizando, setAtualizando] = useState(false)

  async function carregar(mostrarSpinner=false) {
    if (mostrarSpinner) setAtualizando(true)
    const { data:{session} } = await supabase.auth.getSession()
    if (!session?.user) { router.push('/login'); return }
    const { data } = await supabase.from('perfis')
      .select('nome,apelido,data_nascimento,risk,horizonte,objetivo,user_id_publico,meta_euros,invest_euros,periodo,setores')
      .eq('id', session.user.id).single()
    setPerfil({
      id:              session.user.id,
      nome:            data?.nome            ?? session.user.user_metadata?.nome    ?? '',
      apelido:         data?.apelido         ?? session.user.user_metadata?.apelido ?? '',
      email:           session.user.email    ?? '',
      data_nascimento: data?.data_nascimento ?? session.user.user_metadata?.data_nascimento ?? '',
      risk:            data?.risk            ?? '',
      horizonte:       data?.horizonte       ?? '',
      objetivo:         data?.objetivo        ?? '',
      user_id_publico:  data?.user_id_publico  ?? '',
      meta_euros:       data?.meta_euros       ?? 100000,
      invest_euros:     data?.invest_euros     ?? 300,
      periodo:          data?.periodo          ?? 'mensal',
      setores:          data?.setores          ?? [],
    })
    if (mostrarSpinner) setAtualizando(false)
  }

  useEffect(() => { carregar() }, [router])

  if (!perfil) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <p className="text-[14px] text-stone-400">A carregar...</p>
    </div>
  )

  const iniciais   = getIniciais(perfil.nome, perfil.apelido)
  const riskLabel  = RISK_LABELS[perfil.risk]           ?? '—'
  const horizLabel = HORIZONTE_LABELS[perfil.horizonte] ?? '—'
  const objLabel   = OBJETIVO_LABELS[perfil.objetivo]   ?? '—'
  const setoresLabel = perfil.setores.length === 0
    ? '—'
    : perfil.setores.length === 1
      ? SETORES_LABELS[perfil.setores[0]] ?? '—'
      : `${perfil.setores.length} selecionados`

  return (
    <div className="pb-2">
      {dialog==='pessoais'  && <DialogDadosPessoais perfil={perfil} onClose={()=>setDialog(null)} onSave={e=>setPerfil(p=>p?{...p,email:e}:p)}/>}
      {dialog==='risco'     && <DialogOpcoes title="Perfil de risco" options={RISK_OPTIONS} value={perfil.risk} campoDb="risk" onClose={()=>setDialog(null)} onSave={v=>setPerfil(p=>p?{...p,risk:v}:p)}/>}
      {dialog==='horizonte' && <DialogOpcoes title="Horizonte temporal" options={HORIZONTE_OPTIONS} value={perfil.horizonte} campoDb="horizonte" onClose={()=>setDialog(null)} onSave={v=>setPerfil(p=>p?{...p,horizonte:v}:p)}/>}
      {dialog==='objetivo'  && <DialogOpcoes title="Objetivo principal" options={OBJETIVO_OPTIONS} value={perfil.objetivo} campoDb="objetivo" onClose={()=>setDialog(null)} onSave={v=>setPerfil(p=>p?{...p,objetivo:v}:p)}/>}
      {dialog==='importar'  && <DialogImportar userId={perfil.id} onClose={()=>setDialog(null)}/>}
      {dialog==='plano'     && <DialogPlano perfil={perfil} onClose={()=>setDialog(null)} onSave={v=>setPerfil(p=>p?{...p,...v}:p)}/>}
      {dialog==='setores'   && <DialogSetores value={perfil.setores} onClose={()=>setDialog(null)} onSave={v=>setPerfil(p=>p?{...p,setores:v}:p)}/>}

      <PageHeader title="Perfil" />

      <div className="px-4 pt-4 space-y-3">
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <div className="flex items-center gap-4 pb-4 border-b border-stone-100 mb-3">
            <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center text-[20px] font-semibold text-brand-800 flex-shrink-0">
              {iniciais}
            </div>
            <div className="min-w-0">
              <p className="text-[17px] font-semibold text-stone-900">{perfil.nome} {perfil.apelido}</p>
              <p className="text-[13px] text-stone-500 mb-2 truncate">@{perfil.user_id_publico || perfil.email}</p>
              <div className="flex gap-2 flex-wrap">
                {riskLabel!=='—'&&<span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-brand-50 text-brand-800">{riskLabel}</span>}
                {horizLabel!=='—'&&<span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800">{horizLabel}</span>}
              </div>
            </div>
          </div>
          <ProfileRow icon={UserCog} label="Dados pessoais" onClick={()=>setDialog('pessoais')}/>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-2">Perfil de investidor</p>
          <ProfileRow icon={Flame}  label="Perfil de risco"    value={riskLabel}  onClick={()=>setDialog('risco')}/>
          <ProfileRow icon={Clock}  label="Horizonte temporal" value={horizLabel} onClick={()=>setDialog('horizonte')}/>
          <ProfileRow icon={Target} label="Objetivo"           value={objLabel.length>20?objLabel.slice(0,18)+'…':objLabel} onClick={()=>setDialog('objetivo')}/>
          <ProfileRow icon={Tag}    label="Setores de interesse" value={setoresLabel} onClick={()=>setDialog('setores')}/>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-2">Plano de investimento</p>
          <ProfileRow icon={Wallet} label="Definir plano" value={`${fmtEuro(perfil.invest_euros)} · ${PERIODOS.find(p=>p.value===perfil.periodo)?.label ?? 'Mensal'}`} onClick={()=>setDialog('plano')}/>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-2">Importar carteira</p>
          <button onClick={()=>setDialog('importar')}
            className="w-full flex items-center gap-3 py-3 border-b border-stone-100 active:bg-stone-50 transition-colors">
            <FileSpreadsheet size={18} strokeWidth={1.75} color="#888780"/>
            <span className="text-[14px] text-stone-900 flex-1 text-left">CSV / XLSX</span>
            <span className="text-[12px] text-brand-600 font-medium">Importar</span>
            <ChevronRight size={14} color="#D3D1C7"/>
          </button>
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

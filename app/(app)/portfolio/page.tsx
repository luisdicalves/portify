'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, X, RefreshCw, Trash2, History, BarChart2, ChevronUp, ChevronDown, Coins, Landmark } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/PageHeader'

/* ─── Tipos ─── */
type Tipo     = 'Ação' | 'ETF' | 'REIT'
type Operacao = 'compra' | 'venda'
type Filtro   = 'Todos' | 'Ações' | 'ETFs'
type Aba      = 'posicoes' | 'dividendos' | 'historico'
type OrdemKey = 'ticker' | 'custo' | 'valor' | 'ganho_pct'
type OrdemDir = 'asc' | 'desc'

type Transacao = {
  id: string; ticker: string; nome: string; tipo: Tipo
  unidades: number; preco_medio: number; moeda: string; data_compra?: string
}
type PosicaoAgregada = {
  ticker: string; tipo: Tipo; unidades: number; preco_medio: number; moeda: string
}
type Cotacao = {
  preco: number; variacao: number; variacaoPct: number
  moeda: string; bandeira: string; nome: string; timestamp: string
}
type DadosDividendo = {
  ticker: string; nome: string; dividendRate: number; dividendYield: number
  exDividendDate: string | null; dividendDate: string | null; moeda: string
  historico: { data: string; valor: number }[]
}

const MESES_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

/* ─── Helpers ─── */
function fmt(n: number, casas = 2) {
  return n.toLocaleString('pt-PT', { minimumFractionDigits: casas, maximumFractionDigits: casas })
}
function fmtEur(n: number) { return '€' + fmt(n) }
function fmtDiv(n: number) {
  return n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}
function hojeISO() { return new Date().toISOString().split('T')[0] }
function horaNow() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
function getBandeira(ticker: string): string {
  const t = ticker.toUpperCase()
  if (t.endsWith('.DE')) return '🇩🇪'
  if (t.endsWith('.PA')) return '🇫🇷'
  if (t.endsWith('.AS')) return '🇳🇱'
  if (t.endsWith('.MI')) return '🇮🇹'
  if (t.endsWith('.MC')) return '🇪🇸'
  if (t.endsWith('.L'))  return '🇬🇧'
  if (t.endsWith('.T'))  return '🇯🇵'
  if (t.endsWith('.LS')) return '🇵🇹'
  if (t.endsWith('.SW')) return '🇨🇭'
  if (['VWCE','CSPX','IWDA','EIMI','IUSQ','VUSA','VUAA'].includes(t.split('.')[0])) return '🇮🇪'
  return '🇺🇸'
}

/* Logo partilhado — mesmo tamanho em Posições, Dividendos e Histórico */
function LogoTicker({ ticker }: { ticker: string }) {
  const [erro, setErro] = useState(false)
  const simbolo = ticker.split('.')[0].toUpperCase()

  if (erro) {
    return (
      <div className="w-10 h-10 rounded-[10px] bg-stone-50 border border-stone-200
        flex items-center justify-center flex-shrink-0">
        <Landmark size={18} strokeWidth={1.75} color="#B4B2A9"/>
      </div>
    )
  }

  return (
    <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://images.financialmodelingprep.com/symbol/${simbolo}.png`}
        alt={ticker}
        className="w-full h-full object-contain"
        onError={() => setErro(true)}
      />
    </div>
  )
}

function agregarPosicoes(transacoes: Transacao[]): PosicaoAgregada[] {
  const mapa = new Map<string, PosicaoAgregada>()
  for (const t of transacoes) {
    const ex = mapa.get(t.ticker)
    if (!ex) {
      mapa.set(t.ticker, { ticker:t.ticker, tipo:t.tipo, unidades:t.unidades, preco_medio:t.preco_medio, moeda:t.moeda })
    } else {
      const novas = ex.unidades + t.unidades
      if (novas <= 0) { mapa.delete(t.ticker) }
      else {
        const novoPm = (ex.preco_medio * ex.unidades + t.preco_medio * t.unidades) / novas
        mapa.set(t.ticker, { ...ex, unidades: novas, preco_medio: Math.max(0, novoPm) })
      }
    }
  }
  return Array.from(mapa.values()).filter(p => p.unidades > 0)
}

const TIPO_COLORS: Record<Tipo, string> = {
  'Ação': 'bg-blue-50 text-blue-700',
  'ETF':  'bg-brand-50 text-brand-700',
  'REIT': 'bg-amber-50 text-amber-700',
}

/* ─── Modal transação ─── */
function ModalTransacao({ onClose, onAdd }: {
  onClose:()=>void; onAdd:(t:Omit<Transacao,'id'>)=>Promise<string|null>
}) {
  const [operacao,setOperacao] = useState<Operacao>('compra')
  const [ticker,  setTicker]   = useState('')
  const [unidades,setUnidades] = useState('')
  const [pm,      setPm]       = useState('')
  const [tipo,    setTipo]     = useState<Tipo>('Ação')
  const [data,    setData]     = useState(hojeISO())
  const [hora,    setHora]     = useState(horaNow())
  const [erro,    setErro]     = useState('')
  const [loading, setLoading]  = useState(false)

  async function confirmar() {
    const u = parseFloat(unidades.replace(',','.')); const p = parseFloat(pm.replace(',','.'))
    if (!ticker.trim()) { setErro('Insere o símbolo.'); return }
    if (!u || u<=0)     { setErro('Nº de ações inválido.'); return }
    if (!p || p<=0)     { setErro('Preço inválido.'); return }
    setErro(''); setLoading(true)
    const err = await onAdd({ ticker:ticker.trim().toUpperCase(), nome:ticker.trim().toUpperCase(),
      tipo, moeda:'EUR', unidades:operacao==='venda'?-u:u, preco_medio:p,
      data_compra:hora?`${data}T${hora}`:`${data}T00:00` })
    setLoading(false)
    if (err) { setErro(err); return }
    onClose()
  }

  const custoTotal = (() => {
    const u=parseFloat(unidades.replace(',','.')); const p=parseFloat(pm.replace(',','.'))
    return isNaN(u)||isNaN(p)?null:u*p
  })()

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[55]" onClick={onClose}/>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white rounded-t-3xl z-[60] pb-8 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-white z-10"><div className="w-10 h-1 bg-stone-200 rounded-full"/></div>
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-stone-100 sticky top-5 bg-white z-10">
          <p className="text-[16px] font-semibold text-stone-900">Registar transação</p>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center"><X size={14} color="#5F5E5A" strokeWidth={2}/></button>
        </div>
        <div className="px-5 pt-4 space-y-4">
          <div className="flex bg-stone-100 rounded-xl p-1 gap-1">
            {(['compra','venda'] as Operacao[]).map(op=>(
              <button key={op} onClick={()=>setOperacao(op)}
                className={`flex-1 py-2 rounded-lg text-[13px] font-medium transition-all
                  ${operacao===op?op==='compra'?'bg-white text-brand-700 shadow-sm':'bg-white text-red-600 shadow-sm':'text-stone-500'}`}>
                {op==='compra'?'Compra':'Venda'}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-[12px] font-medium text-stone-500 mb-1.5">Símbolo</label>
            <input value={ticker} onChange={e=>setTicker(e.target.value.toUpperCase())} placeholder="Ex: AAPL, AMD.DE, VWCE"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-[11px] text-[14px] font-medium text-stone-900 placeholder:font-normal placeholder:text-stone-400 focus:outline-none focus:border-brand-400"/>
            {ticker&&<p className="text-[11px] text-stone-400 mt-1 ml-1">{getBandeira(ticker)} {ticker}</p>}
          </div>
          <div>
            <label className="block text-[12px] font-medium text-stone-500 mb-1.5">Tipo de ativo</label>
            <div className="flex gap-2">
              {(['Ação','ETF','REIT'] as Tipo[]).map(t=>(
                <button key={t} onClick={()=>setTipo(t)}
                  className={`flex-1 py-[10px] rounded-xl border text-[13px] font-medium transition-all
                    ${tipo===t?'bg-brand-50 border-brand-400 text-brand-800':'bg-stone-50 border-stone-200 text-stone-600'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-stone-500 mb-1.5">{operacao==='compra'?'Nº de ações':'Ações a vender'}</label>
              <input type="number" inputMode="decimal" min="0" placeholder="Ex: 10" value={unidades} onChange={e=>setUnidades(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-[11px] text-[14px] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-brand-400"/>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-stone-500 mb-1.5">{operacao==='compra'?'Preço médio (€)':'Preço de venda (€)'}</label>
              <input type="number" inputMode="decimal" min="0" placeholder="Ex: 88.20" value={pm} onChange={e=>setPm(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-[11px] text-[14px] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-brand-400"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-stone-500 mb-1.5">Data</label>
              <input type="date" value={data} onChange={e=>setData(e.target.value)} max={hojeISO()}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-[11px] text-[13px] text-stone-900 focus:outline-none focus:border-brand-400"/>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-stone-500 mb-1.5">Hora</label>
              <input type="time" value={hora} onChange={e=>setHora(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-[11px] text-[13px] text-stone-900 focus:outline-none focus:border-brand-400"/>
            </div>
          </div>
          {custoTotal!==null&&(
            <div className={`rounded-xl px-4 py-3 border ${operacao==='compra'?'bg-brand-50 border-brand-100':'bg-red-50 border-red-100'}`}>
              <div className="flex justify-between text-[12px]">
                <span className="text-stone-500">{operacao==='compra'?'Custo total':'Valor de venda'}</span>
                <span className={`font-semibold ${operacao==='compra'?'text-brand-800':'text-red-700'}`}>{fmtEur(custoTotal)}</span>
              </div>
            </div>
          )}
          {erro&&<p className="text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{erro}</p>}
          <button onClick={confirmar} disabled={loading}
            className={`w-full text-white font-medium text-[15px] py-[13px] rounded-xl disabled:opacity-50 active:scale-[0.98] transition-all ${operacao==='compra'?'bg-brand-400':'bg-red-500'}`}>
            {loading?'A guardar...':operacao==='compra'?'Registar compra':'Registar venda'}
          </button>
        </div>
      </div>
    </>
  )
}

/* ─── Dialog apagar ─── */
function DialogApagar({ texto,onClose,onConfirm }: { texto:string;onClose:()=>void;onConfirm:()=>void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[55]" onClick={onClose}/>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white rounded-t-3xl z-[60] pb-8 shadow-2xl">
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-stone-200 rounded-full"/></div>
        <div className="px-5 pt-4 pb-2 text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={22} color="#D85A30"/></div>
          <p className="text-[17px] font-semibold text-stone-900 mb-2">Apagar registo?</p>
          <p className="text-[13px] text-stone-500 leading-relaxed mb-6">{texto}</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 bg-stone-50 border border-stone-200 rounded-xl py-[13px] text-[14px] font-medium text-stone-700">Cancelar</button>
            <button onClick={onConfirm} className="flex-1 bg-red-500 rounded-xl py-[13px] text-[14px] font-medium text-white active:scale-[0.98] transition-all">Apagar</button>
          </div>
        </div>
      </div>
    </>
  )
}

/* ─── Seta de ordenação inline ─── */
function SetaOrdem({ campo, ordem }: { campo:OrdemKey; ordem:{key:OrdemKey;dir:OrdemDir}|null }) {
  if (ordem?.key !== campo) return <span className="inline-block w-3 h-3 ml-0.5 opacity-20">↕</span>
  return ordem.dir==='asc'
    ? <ChevronUp size={11} className="inline ml-0.5 text-brand-600"/>
    : <ChevronDown size={11} className="inline ml-0.5 text-brand-600"/>
}

/* ─── Linha posição ─── */
function PosicaoRow({ pos,cotacao,onApagar }: { pos:PosicaoAgregada;cotacao?:Cotacao;onApagar:()=>void }) {
  const precoAtual = cotacao?.preco ?? pos.preco_medio
  const valor      = precoAtual * pos.unidades
  const custo      = pos.preco_medio * pos.unidades
  const ganho      = valor - custo
  const ganhoPct   = custo>0?(ganho/custo)*100:0
  const positivo   = ganho>=0
  const nomeFull   = cotacao?.nome ?? pos.ticker
  return (
    <div className="px-3 py-3 border-b border-stone-100 last:border-0">
      {/* Cabeçalho: logo + nome/tag + ticker, apagar à direita */}
      <div className="flex items-center gap-2 mb-3">
        <LogoTicker ticker={pos.ticker}/>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[14px] font-bold text-stone-900 truncate">{nomeFull}</span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${TIPO_COLORS[pos.tipo]}`}>{pos.tipo}</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5 truncate">{pos.ticker}</p>
        </div>
        <button onClick={onApagar} className="w-7 h-7 flex items-center justify-center text-stone-300 hover:text-red-400 transition-colors flex-shrink-0">
          <Trash2 size={13} strokeWidth={1.75}/>
        </button>
      </div>

      {/* Métricas: 3 colunas estilo cards */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-[10px] text-stone-400 mb-0.5">Unidades</p>
          <p className="text-[13px] font-bold text-stone-900">{fmt(pos.unidades,4)}</p>
          <p className="text-[10px] text-stone-400">@ {fmtEur(pos.preco_medio)}</p>
        </div>
        <div>
          <p className="text-[10px] text-stone-400 mb-0.5">Valor atual</p>
          <p className="text-[13px] font-bold text-stone-900">{fmtEur(valor)}</p>
          {cotacao && (
            <p className="text-[10px] text-stone-400">
              <span className="font-medium text-stone-600">{fmtEur(cotacao.preco)}</span>
              {' '}<span className={cotacao.variacaoPct>=0?'text-brand-500':'text-red-400'}>{cotacao.variacaoPct>=0?'+':''}{fmt(cotacao.variacaoPct)}%</span>
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[10px] text-stone-400 mb-0.5">Ganho/Perda</p>
          <p className={`text-[13px] font-bold ${positivo?'text-brand-600':'text-red-500'}`}>{positivo?'+':''}{fmtEur(ganho)}</p>
          <p className={`text-[10px] ${positivo?'text-brand-500':'text-red-400'}`}>{positivo?'+':''}{fmt(ganhoPct)}%</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Linha histórico — mesmo estilo de card que Posições/Dividendos ─── */
function HistoricoRow({ t,onApagar }: { t:Transacao;onApagar:()=>void }) {
  const isVenda = t.unidades<0
  const data    = t.data_compra?new Date(t.data_compra).toLocaleDateString('pt-PT'):'—'
  const hora    = t.data_compra?new Date(t.data_compra).toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'}):''
  const total   = Math.abs(t.unidades)*t.preco_medio
  return (
    <div className="px-3 py-3 border-b border-stone-100 last:border-0">
      {/* Cabeçalho: logo + nome/tag + ticker, apagar à direita */}
      <div className="flex items-center gap-2 mb-3">
        <LogoTicker ticker={t.ticker}/>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[14px] font-bold text-stone-900 truncate">{t.ticker}</span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${isVenda?'bg-red-50 text-red-600':'bg-brand-50 text-brand-700'}`}>{isVenda?'Venda':'Compra'}</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5 truncate">{t.ticker}</p>
        </div>
        <button onClick={onApagar} className="w-7 h-7 flex items-center justify-center text-stone-300 hover:text-red-400 transition-colors flex-shrink-0">
          <Trash2 size={13} strokeWidth={1.75}/>
        </button>
      </div>

      {/* Métricas: 3 colunas estilo cards */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-[10px] text-stone-400 mb-0.5">Unidades</p>
          <p className="text-[13px] font-bold text-stone-900">{fmt(Math.abs(t.unidades),4)}</p>
          <p className="text-[10px] text-stone-400">@ {fmtEur(t.preco_medio)}</p>
        </div>
        <div>
          <p className="text-[10px] text-stone-400 mb-0.5">Data</p>
          <p className="text-[13px] font-bold text-stone-900">{data}</p>
          <p className="text-[10px] text-stone-400">{hora}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-stone-400 mb-0.5">Total</p>
          <p className={`text-[13px] font-bold ${isVenda?'text-red-500':'text-brand-600'}`}>{isVenda?'-':'+'}{fmtEur(total)}</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Linha "Ação com dividendos" / "Próximo pagamento" — mesmo estilo de card ─── */
function DividendoRow({ ticker, nome, tipo, valor, sub }: {
  ticker: string; nome: string; tipo: string
  valor: string; sub: string
}) {
  return (
    <div className="flex items-center gap-3 py-3 px-3 border-b border-stone-100 last:border-0">
      <LogoTicker ticker={ticker}/>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-semibold text-stone-900 truncate">{nome}</p>
          <span className="text-[10px] font-medium px-2 py-[2px] rounded-full bg-stone-100 text-stone-500 flex-shrink-0">{tipo}</span>
        </div>
        <p className="text-[11px] text-stone-400 truncate">{ticker}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[14px] font-semibold text-brand-600">+{valor}</p>
        <p className="text-[11px] text-stone-400">{sub}</p>
      </div>
    </div>
  )
}

/* ─── Página ─── */
export default function Portfolio() {
  const [aba,            setAba]            = useState<Aba>('posicoes')
  const [filtro,         setFiltro]         = useState<Filtro>('Todos')
  const [modalAberto,    setModalAberto]    = useState(false)
  const [transacoes,     setTransacoes]     = useState<Transacao[]>([])
  const [cotacoes,       setCotacoes]       = useState<Record<string,Cotacao>>({})
  const [carregando,     setCarregando]     = useState(true)
  const [atualizando,    setAtualizando]    = useState(false)
  const [ultimaConsulta, setUltimaConsulta] = useState<Date|null>(null)
  const [apagarId,       setApagarId]       = useState<string|null>(null)
  const [ordem,          setOrdem]          = useState<{key:OrdemKey;dir:OrdemDir}|null>(null)

  // Dividendos
  const [dividendos,     setDividendos]     = useState<Record<string,DadosDividendo>>({})
  const [carregandoDiv,  setCarregandoDiv]  = useState(true)
  const [mostrarTodas,   setMostrarTodas]   = useState(false)

  useEffect(()=>{ carregar() },[])

  async function carregar() {
    setCarregando(true)
    const {data:{session}} = await supabase.auth.getSession()
    if (!session) { setCarregando(false); setCarregandoDiv(false); return }
    const {data} = await supabase.from('posicoes').select('*').order('data_compra',{ascending:true})
    if (data) {
      setTransacoes(data as Transacao[])
      await buscarCotacoes(data as Transacao[])
      await buscarDividendos(data as Transacao[])
    } else {
      setCarregandoDiv(false)
    }
    setCarregando(false)
  }

  const buscarCotacoes = useCallback(async (lista:Transacao[])=>{
    setAtualizando(true)
    const tickers = lista.map(p=>p.ticker).filter((t,i,a)=>a.indexOf(t)===i)
    const novas:Record<string,Cotacao>={}
    await Promise.all(tickers.map(async ticker=>{
      try { const r=await fetch(`/api/cotacao?ticker=${encodeURIComponent(ticker)}`); if(r.ok) novas[ticker]=await r.json() } catch{}
    }))
    setCotacoes(novas); setUltimaConsulta(new Date()); setAtualizando(false)
  },[])

  const buscarDividendos = useCallback(async (lista:Transacao[])=>{
    setCarregandoDiv(true)
    const pos = agregarPosicoes(lista)
    if (pos.length === 0) { setDividendos({}); setCarregandoDiv(false); return }
    const tickers = pos.map(p=>p.ticker).join(',')
    try {
      const r = await fetch(`/api/dividendos?tickers=${encodeURIComponent(tickers)}`)
      if (r.ok) {
        const { dados } = await r.json()
        const mapa: Record<string,DadosDividendo> = {}
        for (const d of dados as DadosDividendo[]) mapa[d.ticker] = d
        setDividendos(mapa)
      }
    } catch {}
    setCarregandoDiv(false)
  },[])

  async function adicionarTransacao(nova:Omit<Transacao,'id'>):Promise<string|null>{
    const {data:{session}} = await supabase.auth.getSession()
    if (!session?.user) return 'Sem sessão.'
    const {data,error} = await supabase.from('posicoes').insert({...nova,user_id:session.user.id}).select().single()
    if (error) return error.message
    if (data) {
      const novas=[...transacoes,data as Transacao].sort((a,b)=>(a.data_compra??'')<(b.data_compra??'')?-1:1)
      setTransacoes(novas); buscarCotacoes(novas); buscarDividendos(novas)
    }
    return null
  }

  async function apagarTransacao(id:string){
    await supabase.from('posicoes').delete().eq('id',id)
    const novas=transacoes.filter(t=>t.id!==id); setTransacoes(novas); setApagarId(null)
    buscarDividendos(novas)
  }

  function toggleOrdem(key:OrdemKey){
    setOrdem(prev=>{
      if(!prev||prev.key!==key) return {key,dir:'asc'}
      if(prev.dir==='asc')      return {key,dir:'desc'}
      return null
    })
  }

  const posicoes = agregarPosicoes(transacoes)
  const contagens = { Todos:posicoes.length, Ações:posicoes.filter(p=>p.tipo==='Ação').length, ETFs:posicoes.filter(p=>p.tipo==='ETF').length }

  const filtradas = posicoes.filter(p=>{
    if(filtro==='Todos') return true
    if(filtro==='Ações') return p.tipo==='Ação'
    if(filtro==='ETFs')  return p.tipo==='ETF'
    return true
  })

  const ordenadas = [...filtradas].sort((a,b)=>{
    if(!ordem) return 0
    const dir=ordem.dir==='asc'?1:-1
    if(ordem.key==='ticker') return a.ticker.localeCompare(b.ticker)*dir
    if(ordem.key==='custo'){
      const cA=a.preco_medio*a.unidades
      const cB=b.preco_medio*b.unidades
      return (cA-cB)*dir
    }
    if(ordem.key==='valor'){
      const vA=(cotacoes[a.ticker]?.preco??a.preco_medio)*a.unidades
      const vB=(cotacoes[b.ticker]?.preco??b.preco_medio)*b.unidades
      return (vA-vB)*dir
    }
    if(ordem.key==='ganho_pct'){
      const cA=a.preco_medio*a.unidades; const cB=b.preco_medio*b.unidades
      const gA=cA>0?((cotacoes[a.ticker]?.preco??a.preco_medio)*a.unidades-cA)/cA:0
      const gB=cB>0?((cotacoes[b.ticker]?.preco??b.preco_medio)*b.unidades-cB)/cB:0
      return (gA-gB)*dir
    }
    return 0
  })

  const totalCusto = ordenadas.reduce((s,p)=>s+p.preco_medio*p.unidades,0)
  const totalValor = ordenadas.reduce((s,p)=>s+(cotacoes[p.ticker]?.preco??p.preco_medio)*p.unidades,0)
  const totalGanho = totalValor-totalCusto
  const totalPct   = totalCusto>0?(totalGanho/totalCusto)*100:0

  const historicoFiltrado = [...transacoes].sort((a,b)=>(b.data_compra??'')>(a.data_compra??'')?1:-1)
  const transacaoApagar   = transacoes.find(t=>t.id===apagarId)

  /* ─── Cálculos de Dividendos ─── */
  const hoje = new Date()
  const inicioAno = new Date(hoje.getFullYear(), 0, 1)

  const dividendoAnualPorPosicao = posicoes.map(p => {
    const d = dividendos[p.ticker]
    const anual = d ? d.dividendRate * p.unidades : 0
    return { ticker: p.ticker, nome: d?.nome ?? p.ticker, tipo: p.tipo, anual, dadosDiv: d, unidades: p.unidades }
  })

  const custoTotalDiv = posicoes.reduce((s, p) => s + p.preco_medio * p.unidades, 0)
  const totalAnualEstimado = dividendoAnualPorPosicao.reduce((s, p) => s + p.anual, 0)
  const yieldOnCost = custoTotalDiv > 0 ? (totalAnualEstimado / custoTotalDiv) * 100 : 0

  type PagamentoHistorico = { ticker: string; nome: string; tipo: string; data: Date; valor: number }
  const pagamentosHistoricos: PagamentoHistorico[] = []
  for (const p of dividendoAnualPorPosicao) {
    if (!p.dadosDiv?.historico) continue
    for (const h of p.dadosDiv.historico) {
      pagamentosHistoricos.push({
        ticker: p.ticker, nome: p.nome, tipo: p.tipo, data: new Date(h.data), valor: h.valor * p.unidades,
      })
    }
  }
  pagamentosHistoricos.sort((a, b) => b.data.getTime() - a.data.getTime())

  const totalRecebido = pagamentosHistoricos.reduce((s, p) => s + p.valor, 0)
  const recebidoEsteAno = pagamentosHistoricos
    .filter(p => p.data >= inicioAno && p.data <= hoje)
    .reduce((s, p) => s + p.valor, 0)

  const acoesComDividendo = dividendoAnualPorPosicao.filter(p => p.anual > 0).length

  const horizonteFim = new Date(hoje.getFullYear(), hoje.getMonth() + 12, hoje.getDate())

  type PagamentoProjetado = { ticker: string; nome: string; tipo: string; data: Date; valor: number }
  const pagamentosProjetados: PagamentoProjetado[] = []

  for (const p of dividendoAnualPorPosicao) {
    if (!p.dadosDiv?.dividendDate || p.anual <= 0) continue
    const valorPorPagamento = p.dadosDiv.dividendRate / 4 * p.unidades

    let dataPagamento = new Date(p.dadosDiv.dividendDate)
    while (dataPagamento < new Date(hoje.getFullYear(), hoje.getMonth(), 1)) {
      dataPagamento = new Date(dataPagamento.getFullYear(), dataPagamento.getMonth() + 3, dataPagamento.getDate())
    }
    while (dataPagamento <= horizonteFim) {
      pagamentosProjetados.push({
        ticker: p.ticker, nome: p.nome, tipo: p.tipo, data: new Date(dataPagamento), valor: valorPorPagamento,
      })
      dataPagamento = new Date(dataPagamento.getFullYear(), dataPagamento.getMonth() + 3, dataPagamento.getDate())
    }
  }
  pagamentosProjetados.sort((a, b) => a.data.getTime() - b.data.getTime())

  const previsaoMensal = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1)
    const total = pagamentosProjetados
      .filter(p => p.data.getFullYear() === d.getFullYear() && p.data.getMonth() === d.getMonth())
      .reduce((s, p) => s + p.valor, 0)
    return { ano: d.getFullYear(), mesIdx: d.getMonth(), mes: MESES_PT[d.getMonth()], val: Math.round(total * 100) / 100 }
  })
  const maxValDiv = Math.max(...previsaoMensal.map(d => d.val), 1)

  const estimadoEsteMes = previsaoMensal[0]?.val ?? 0
  const estimadoRestoAno = previsaoMensal
    .filter(d => d.ano === hoje.getFullYear())
    .reduce((s, d) => s + d.val, 0)
  const estimadoEsteAno = recebidoEsteAno + estimadoRestoAno

  const proximosPagamentos = pagamentosProjetados.slice(0, 5)

  const totalPorTicker = new Map<string, { ticker: string; nome: string; tipo: string; total: number; numPagamentos: number }>()
  for (const p of pagamentosHistoricos) {
    const ex = totalPorTicker.get(p.ticker)
    if (ex) { ex.total += p.valor; ex.numPagamentos += 1 }
    else totalPorTicker.set(p.ticker, { ticker: p.ticker, nome: p.nome, tipo: p.tipo, total: p.valor, numPagamentos: 1 })
  }
  const listaAcoesComDividendos = Array.from(totalPorTicker.values()).sort((a, b) => b.total - a.total)

  const semDadosDiv = !carregandoDiv && posicoes.length > 0 && Object.keys(dividendos).length === 0

  return (
    <div className="pb-2">
      {modalAberto&&<ModalTransacao onClose={()=>setModalAberto(false)} onAdd={adicionarTransacao}/>}
      {apagarId&&transacaoApagar&&(
        <DialogApagar
          texto={`Tens a certeza que queres apagar este registo de ${transacaoApagar.unidades<0?'venda':'compra'} de ${transacaoApagar.ticker}?`}
          onClose={()=>setApagarId(null)} onConfirm={()=>apagarTransacao(apagarId)}/>
      )}

      {/* Top bar */}
      <PageHeader
        title="Portfólio"
        right={
          <button onClick={()=>setModalAberto(true)}
            className="flex items-center gap-1.5 bg-brand-50 border border-brand-100 rounded-full px-3 py-1.5 text-[12px] text-brand-800 font-medium active:scale-[0.97] transition-transform">
            <Plus size={13} strokeWidth={2.5}/>Adicionar
          </button>
        }
      />
      <div className="bg-white px-5 border-b border-stone-100">
        {/* Abas: Posições, Dividendos, Histórico */}
        <div className="flex gap-1 mb-2">
          <button onClick={()=>setAba('posicoes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] border transition-colors
              ${aba==='posicoes'?'bg-brand-50 border-brand-400 text-brand-800 font-medium':'bg-white border-stone-200 text-stone-600'}`}>
            <BarChart2 size={12}/>Posições
          </button>
          <button onClick={()=>setAba('dividendos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] border transition-colors
              ${aba==='dividendos'?'bg-brand-50 border-brand-400 text-brand-800 font-medium':'bg-white border-stone-200 text-stone-600'}`}>
            <Coins size={12}/>Dividendos
          </button>
          <button onClick={()=>setAba('historico')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] border transition-colors
              ${aba==='historico'?'bg-brand-50 border-brand-400 text-brand-800 font-medium':'bg-white border-stone-200 text-stone-600'}`}>
            <History size={12}/>Histórico
          </button>
        </div>
        {aba==='posicoes'&&(
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-stone-400">
              {ultimaConsulta?`Atualizado: ${ultimaConsulta.toLocaleDateString('pt-PT')} ${ultimaConsulta.toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'})}`:carregando?'A carregar...':''}
            </p>
            {!carregando&&<button onClick={()=>buscarCotacoes(transacoes)} disabled={atualizando}
              className="flex items-center gap-1 text-[11px] text-brand-600 disabled:opacity-40">
              <RefreshCw size={11} className={atualizando?'animate-spin':''}/>{atualizando?'':'Atualizar'}
            </button>}
          </div>
        )}
      </div>

      <div className="px-4 pt-4 space-y-3">

        {aba==='posicoes'&&(<>
          {/* Filtros */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(['Todos','Ações','ETFs'] as Filtro[]).map(f=>(
              <button key={f} onClick={()=>setFiltro(f)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] border transition-colors
                  ${filtro===f?'bg-brand-50 border-brand-400 text-brand-800 font-medium':'bg-white border-stone-200 text-stone-600'}`}>
                {f}
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${filtro===f?'bg-brand-100 text-brand-700':'bg-stone-100 text-stone-500'}`}>{contagens[f]}</span>
              </button>
            ))}
          </div>

          {/* Ordenação: chips compactos */}
          {ordenadas.length>0&&(
            <div className="flex items-center gap-1.5 px-1">
              <span className="text-[10px] font-medium text-stone-400 uppercase tracking-wide">Ordenar:</span>
              {([['ticker','Ação'],['custo','Custo'],['valor','Valor'],['ganho_pct','Ganho']] as [OrdemKey,string][]).map(([key,label])=>(
                <button key={key} onClick={()=>toggleOrdem(key)}
                  className={`flex items-center gap-0.5 px-2 py-1 rounded-full text-[11px] font-medium transition-colors
                    ${ordem?.key===key?'bg-brand-50 text-brand-700':'text-stone-500 hover:bg-stone-50'}`}>
                  {label}<SetaOrdem campo={key} ordem={ordem}/>
                </button>
              ))}
            </div>
          )}

          {carregando?(
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center"><p className="text-[14px] text-stone-400">A carregar...</p></div>
          ):ordenadas.length===0?(
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
              <p className="text-[14px] text-stone-500 mb-1">{filtro==='Todos'?'Ainda não tens posições.':'Sem posições do tipo '+filtro+'.'}</p>
              {filtro==='Todos'&&<button onClick={()=>setModalAberto(true)} className="text-[13px] text-brand-600 font-medium mt-1">+ Adicionar primeira posição</button>}
            </div>
          ):(
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              {ordenadas.map(p=>(
                <PosicaoRow key={p.ticker} pos={p} cotacao={cotacoes[p.ticker]}
                  onApagar={()=>{ const ids=transacoes.filter(t=>t.ticker===p.ticker).map(t=>t.id); if(ids.length) setApagarId(ids[0]) }}/>
              ))}
            </div>
          )}

          {ordenadas.length>0&&(
            <div className="bg-white rounded-2xl border border-stone-200 p-4">
              <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-3">Total — {ordenadas.length} posições</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-stone-50 rounded-xl p-3"><p className="text-[10px] text-stone-500 mb-1 uppercase tracking-wide">Custo</p><p className="text-[13px] font-semibold text-stone-900">{fmtEur(totalCusto)}</p></div>
                <div className="bg-stone-50 rounded-xl p-3"><p className="text-[10px] text-stone-500 mb-1 uppercase tracking-wide">Valor</p><p className="text-[13px] font-semibold text-stone-900">{fmtEur(totalValor)}</p></div>
                <div className={`rounded-xl p-3 ${totalGanho>=0?'bg-brand-50':'bg-red-50'}`}>
                  <p className="text-[10px] text-stone-500 mb-1 uppercase tracking-wide">Ganho</p>
                  <p className={`text-[13px] font-semibold ${totalGanho>=0?'text-brand-600':'text-red-500'}`}>{totalGanho>=0?'+':''}{fmtEur(totalGanho)}</p>
                  <p className={`text-[10px] ${totalGanho>=0?'text-brand-500':'text-red-400'}`}>{totalGanho>=0?'+':''}{fmt(totalPct)}%</p>
                </div>
              </div>
            </div>
          )}
        </>)}

        {aba==='dividendos'&&(<>
          {carregandoDiv ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
              <div className="h-4 w-24 bg-stone-100 rounded animate-pulse"/>
              <div className="grid grid-cols-2 gap-2">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-14 bg-stone-50 rounded-xl animate-pulse"/>)}
              </div>
            </div>
          ) : posicoes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 text-center">
              <p className="text-[13px] text-stone-500">Adiciona posições para ver os teus dividendos.</p>
            </div>
          ) : (
            <>
              {/* Resumo */}
              <div className="bg-white rounded-2xl border border-stone-200 p-4">
                <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-3">Resumo</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Total recebido',        value: fmtDiv(totalRecebido),     green: true  },
                    { label: 'Recebido este ano',     value: fmtDiv(recebidoEsteAno),   green: true  },
                    { label: 'Ações com dividendos',  value: String(acoesComDividendo), green: false },
                    { label: 'Estimado este mês',     value: fmtDiv(estimadoEsteMes),   green: false },
                    { label: 'Estimado este ano',     value: fmtDiv(estimadoEsteAno),   green: false },
                    { label: 'Yield on Cost',         value: yieldOnCost.toLocaleString('pt-PT',{minimumFractionDigits:1,maximumFractionDigits:1}) + '%', green: false },
                  ].map(m => (
                    <div key={m.label} className="bg-stone-50 rounded-xl p-3">
                      <p className="text-[10px] text-stone-500 mb-1">{m.label}</p>
                      <p className={`text-[14px] font-semibold ${m.green ? 'text-brand-600' : 'text-stone-900'}`}>
                        {m.value}
                      </p>
                    </div>
                  ))}
                </div>
                {semDadosDiv && (
                  <p className="text-[11px] text-stone-400 mt-3">
                    Não foi possível obter dados de dividendos para os teus tickers neste momento.
                  </p>
                )}
              </div>

              {/* Ações com dividendos recebidos */}
              {listaAcoesComDividendos.length > 0 && (
                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                  <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider px-4 pt-4 pb-1">
                    Ações com dividendos recebidos
                  </p>
                  {(mostrarTodas ? listaAcoesComDividendos : listaAcoesComDividendos.slice(0, 3)).map(a => (
                    <DividendoRow
                      key={a.ticker}
                      ticker={a.ticker} nome={a.nome} tipo={a.tipo}
                      valor={fmtDiv(a.total)}
                      sub={`${a.numPagamentos} pagamento${a.numPagamentos > 1 ? 's' : ''}`}
                    />
                  ))}
                  {listaAcoesComDividendos.length > 3 && (
                    <button
                      onClick={() => setMostrarTodas(v => !v)}
                      className="w-full text-center text-[12px] text-brand-600 font-medium py-3 border-t border-stone-100">
                      {mostrarTodas
                        ? 'Mostrar menos'
                        : `Mostrar mais ${listaAcoesComDividendos.length - 3} ação${listaAcoesComDividendos.length - 3 > 1 ? 'ões' : ''}`}
                    </button>
                  )}
                </div>
              )}

              {/* Previsão mensal */}
              {pagamentosProjetados.length > 0 && (
                <div className="bg-white rounded-2xl border border-stone-200 p-4">
                  <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-3">
                    Previsão mensal (próximos 12 meses)
                  </p>
                  <div className="space-y-[6px]">
                    {previsaoMensal.map((d, i) => (
                      <div key={`${d.mes}-${i}`} className="flex items-center gap-3">
                        <p className="text-[11px] text-stone-500 w-7">{d.mes}</p>
                        <div className="flex-1 h-[13px] bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-400 rounded-full"
                            style={{ width: `${(d.val / maxValDiv) * 100}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-stone-600 w-14 text-right">{fmtDiv(d.val)}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-stone-400 mt-3">
                    Projeção com base na cadência de pagamentos trimestrais de cada posição. Os valores
                    e datas reais podem variar ligeiramente.
                  </p>
                </div>
              )}

              {/* Próximos pagamentos */}
              {proximosPagamentos.length > 0 && (
                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                  <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider px-4 pt-4 pb-1">
                    Próximos pagamentos
                  </p>
                  {proximosPagamentos.map((p, i) => (
                    <DividendoRow
                      key={`${p.ticker}-${i}`}
                      ticker={p.ticker} nome={p.nome} tipo={p.tipo}
                      valor={fmtDiv(p.valor)}
                      sub={`Pagamento: ${p.data.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>)}

        {aba==='historico'&&(<>
          {carregando?(
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center"><p className="text-[14px] text-stone-400">A carregar...</p></div>
          ):historicoFiltrado.length===0?(
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center"><p className="text-[14px] text-stone-500">Ainda não tens transações.</p></div>
          ):(
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              {historicoFiltrado.map(t=>(
                <HistoricoRow key={t.id} t={t} onApagar={()=>setApagarId(t.id)}/>
              ))}
            </div>
          )}
        </>)}
      </div>
    </div>
  )
}

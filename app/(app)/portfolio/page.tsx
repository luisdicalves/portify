'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, X, Check, RefreshCw, Trash2, History, BarChart2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'

/* ─── Tipos ─── */
type Tipo      = 'Ação' | 'ETF' | 'REIT'
type Operacao  = 'compra' | 'venda'
type Filtro    = 'Todos' | 'ETFs' | 'Ações' | 'REITs'
type Aba       = 'posicoes' | 'historico'
type OrdemKey  = 'ticker' | 'valor' | 'ganho_pct'
type OrdemDir  = 'asc' | 'desc'

type Transacao = {
  id: string
  ticker: string
  nome: string
  tipo: Tipo
  unidades: number
  preco_medio: number
  moeda: string
  data_compra?: string
  user_id?: string
}

type PosicaoAgregada = {
  ticker: string
  tipo: Tipo
  unidades: number
  preco_medio: number
  moeda: string
}

type Cotacao = {
  preco: number; variacao: number; variacaoPct: number
  moeda: string; bandeira: string; nome: string; timestamp: string
}

/* ─── Helpers ─── */
function fmt(n: number, casas = 2) {
  return n.toLocaleString('pt-PT', { minimumFractionDigits: casas, maximumFractionDigits: casas })
}
function fmtEur(n: number) { return '€' + fmt(n) }
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

/* Agrega transações por ticker — soma unidades, recalcula PM ponderado */
function agregarPosicoes(transacoes: Transacao[]): PosicaoAgregada[] {
  const mapa = new Map<string, PosicaoAgregada>()
  for (const t of transacoes) {
    const existing = mapa.get(t.ticker)
    if (!existing) {
      mapa.set(t.ticker, { ticker: t.ticker, tipo: t.tipo, unidades: t.unidades, preco_medio: t.preco_medio, moeda: t.moeda })
    } else {
      const novasUnidades = existing.unidades + t.unidades
      if (novasUnidades <= 0) {
        mapa.delete(t.ticker)
      } else {
        const novoPm = novasUnidades > 0
          ? (existing.preco_medio * existing.unidades + t.preco_medio * t.unidades) / novasUnidades
          : 0
        mapa.set(t.ticker, { ...existing, unidades: novasUnidades, preco_medio: Math.max(0, novoPm) })
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
  onClose: () => void
  onAdd: (t: Omit<Transacao,'id'>) => Promise<string | null>
}) {
  const [operacao, setOperacao] = useState<Operacao>('compra')
  const [ticker,   setTicker]   = useState('')
  const [unidades, setUnidades] = useState('')
  const [pm,       setPm]       = useState('')
  const [tipo,     setTipo]     = useState<Tipo>('Ação')
  const [data,     setData]     = useState(hojeISO())
  const [hora,     setHora]     = useState(horaNow())
  const [erro,     setErro]     = useState('')
  const [loading,  setLoading]  = useState(false)

  async function confirmar() {
    const u = parseFloat(unidades.replace(',','.'))
    const p = parseFloat(pm.replace(',','.'))
    if (!ticker.trim()) { setErro('Insere o símbolo.'); return }
    if (!u || u <= 0)   { setErro('Nº de ações inválido.'); return }
    if (!p || p <= 0)   { setErro('Preço inválido.'); return }
    setErro(''); setLoading(true)
    const erroMsg = await onAdd({
      ticker:      ticker.trim().toUpperCase(),
      nome:        ticker.trim().toUpperCase(),
      tipo, moeda: 'EUR',
      unidades:    operacao === 'venda' ? -u : u,
      preco_medio: p,
      data_compra: hora ? `${data}T${hora}` : `${data}T00:00`,
    })
    setLoading(false)
    if (erroMsg) { setErro(erroMsg); return }
    onClose()
  }

  const custoTotal = (() => {
    const u = parseFloat(unidades.replace(',','.')); const p = parseFloat(pm.replace(',','.'))
    return isNaN(u)||isNaN(p) ? null : u * p
  })()

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose}/>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white
        rounded-t-3xl z-50 pb-8 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-white z-10">
          <div className="w-10 h-1 bg-stone-200 rounded-full"/>
        </div>
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-stone-100 sticky top-5 bg-white z-10">
          <p className="text-[16px] font-semibold text-stone-900">Registar transação</p>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center">
            <X size={14} color="#5F5E5A" strokeWidth={2}/>
          </button>
        </div>
        <div className="px-5 pt-4 space-y-4">
          <div className="flex bg-stone-100 rounded-xl p-1 gap-1">
            {(['compra','venda'] as Operacao[]).map(op => (
              <button key={op} onClick={() => setOperacao(op)}
                className={`flex-1 py-2 rounded-lg text-[13px] font-medium transition-all capitalize
                  ${operacao===op ? op==='compra' ? 'bg-white text-brand-700 shadow-sm' : 'bg-white text-red-600 shadow-sm' : 'text-stone-500'}`}>
                {op === 'compra' ? 'Compra' : 'Venda'}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-[12px] font-medium text-stone-500 mb-1.5">Símbolo</label>
            <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())}
              placeholder="Ex: AAPL, AMD.DE, VWCE"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-[11px]
                text-[14px] font-medium text-stone-900 placeholder:font-normal placeholder:text-stone-400
                focus:outline-none focus:border-brand-400 transition-colors"/>
            {ticker && <p className="text-[11px] text-stone-400 mt-1 ml-1">{getBandeira(ticker)} {ticker}</p>}
          </div>
          <div>
            <label className="block text-[12px] font-medium text-stone-500 mb-1.5">Tipo de ativo</label>
            <div className="flex gap-2">
              {(['Ação','ETF','REIT'] as Tipo[]).map(t => (
                <button key={t} onClick={() => setTipo(t)}
                  className={`flex-1 py-[10px] rounded-xl border text-[13px] font-medium transition-all
                    ${tipo===t ? 'bg-brand-50 border-brand-400 text-brand-800' : 'bg-stone-50 border-stone-200 text-stone-600'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-stone-500 mb-1.5">
                {operacao==='compra' ? 'Nº de ações' : 'Ações a vender'}
              </label>
              <input type="number" inputMode="decimal" min="0" placeholder="Ex: 10"
                value={unidades} onChange={e => setUnidades(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-[11px]
                  text-[14px] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-brand-400"/>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-stone-500 mb-1.5">
                {operacao==='compra' ? 'Preço médio (€)' : 'Preço de venda (€)'}
              </label>
              <input type="number" inputMode="decimal" min="0" placeholder="Ex: 88.20"
                value={pm} onChange={e => setPm(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-[11px]
                  text-[14px] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-brand-400"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-stone-500 mb-1.5">Data</label>
              <input type="date" value={data} onChange={e => setData(e.target.value)} max={hojeISO()}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-[11px]
                  text-[13px] text-stone-900 focus:outline-none focus:border-brand-400"/>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-stone-500 mb-1.5">Hora</label>
              <input type="time" value={hora} onChange={e => setHora(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-[11px]
                  text-[13px] text-stone-900 focus:outline-none focus:border-brand-400"/>
            </div>
          </div>
          {custoTotal !== null && (
            <div className={`rounded-xl px-4 py-3 border ${operacao==='compra' ? 'bg-brand-50 border-brand-100' : 'bg-red-50 border-red-100'}`}>
              <div className="flex justify-between text-[12px]">
                <span className="text-stone-500">{operacao==='compra' ? 'Custo total' : 'Valor de venda'}</span>
                <span className={`font-semibold ${operacao==='compra' ? 'text-brand-800' : 'text-red-700'}`}>{fmtEur(custoTotal)}</span>
              </div>
            </div>
          )}
          {erro && <p className="text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{erro}</p>}
          <button onClick={confirmar} disabled={loading}
            className={`w-full text-white font-medium text-[15px] py-[13px] rounded-xl disabled:opacity-50 active:scale-[0.98] transition-all
              ${operacao==='compra' ? 'bg-brand-400' : 'bg-red-500'}`}>
            {loading ? 'A guardar...' : operacao==='compra' ? 'Registar compra' : 'Registar venda'}
          </button>
        </div>
      </div>
    </>
  )
}

/* ─── Dialog confirmar apagar ─── */
function DialogApagar({ texto, onClose, onConfirm }: { texto:string; onClose:()=>void; onConfirm:()=>void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose}/>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white rounded-t-3xl z-50 pb-8 shadow-2xl">
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-stone-200 rounded-full"/></div>
        <div className="px-5 pt-4 pb-2 text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 size={22} color="#D85A30"/>
          </div>
          <p className="text-[17px] font-semibold text-stone-900 mb-2">Apagar registo?</p>
          <p className="text-[13px] text-stone-500 leading-relaxed mb-6">{texto}</p>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 bg-stone-50 border border-stone-200 rounded-xl py-[13px] text-[14px] font-medium text-stone-700">
              Cancelar
            </button>
            <button onClick={onConfirm}
              className="flex-1 bg-red-500 rounded-xl py-[13px] text-[14px] font-medium text-white active:scale-[0.98] transition-all">
              Apagar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

/* ─── Linha posição agregada ─── */
function PosicaoRow({ pos, cotacao, onApagar }: { pos:PosicaoAgregada; cotacao?:Cotacao; onApagar:()=>void }) {
  const precoAtual = cotacao?.preco ?? pos.preco_medio
  const valor      = precoAtual * pos.unidades
  const custo      = pos.preco_medio * pos.unidades
  const ganho      = valor - custo
  const ganhoPct   = custo > 0 ? (ganho/custo)*100 : 0
  const positivo   = ganho >= 0
  const bandeira   = cotacao?.bandeira ?? getBandeira(pos.ticker)

  return (
    <div className="px-3 py-3 border-b border-stone-100 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-[17px] flex-shrink-0">{bandeira}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[13px] font-bold text-stone-900">{pos.ticker}</span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${TIPO_COLORS[pos.tipo]}`}>{pos.tipo}</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5">
            {fmt(pos.unidades,4)} ações · PM {fmtEur(pos.preco_medio)}
          </p>
          {cotacao && (
            <p className="text-[10px] text-stone-400 mt-0.5">
              <span className="font-medium text-stone-600">{fmtEur(cotacao.preco)}</span>
              {' '}<span className={cotacao.variacaoPct>=0?'text-brand-500':'text-red-400'}>
                {cotacao.variacaoPct>=0?'+':''}{fmt(cotacao.variacaoPct)}%
              </span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-0 flex-shrink-0">
          <div className="w-[60px] text-right"><p className="text-[12px] text-stone-600">{fmtEur(custo)}</p></div>
          <div className="w-[64px] text-right"><p className="text-[12px] font-bold text-stone-900">{fmtEur(valor)}</p></div>
          <div className="w-[72px] text-right">
            <p className={`text-[12px] font-semibold ${positivo?'text-brand-600':'text-red-500'}`}>{positivo?'+':''}{fmtEur(ganho)}</p>
            <p className={`text-[10px] ${positivo?'text-brand-500':'text-red-400'}`}>{positivo?'+':''}{fmt(ganhoPct)}%</p>
          </div>
          <button onClick={onApagar} className="ml-2 w-6 h-6 flex items-center justify-center text-stone-300 hover:text-red-400 transition-colors flex-shrink-0">
            <X size={14} strokeWidth={2}/>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Linha histórico ─── */
function HistoricoRow({ t, onApagar }: { t:Transacao; onApagar:()=>void }) {
  const isVenda  = t.unidades < 0
  const data     = t.data_compra ? new Date(t.data_compra).toLocaleDateString('pt-PT') : '—'
  const hora     = t.data_compra ? new Date(t.data_compra).toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'}) : ''
  const bandeira = getBandeira(t.ticker)
  const total    = Math.abs(t.unidades) * t.preco_medio

  return (
    <div className="px-3 py-3 border-b border-stone-100 last:border-0 flex items-center gap-2">
      <span className="text-[15px] flex-shrink-0">{bandeira}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-bold text-stone-900">{t.ticker}</span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full
            ${isVenda ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-700'}`}>
            {isVenda ? 'Venda' : 'Compra'}
          </span>
        </div>
        <p className="text-[11px] text-stone-400 mt-0.5">
          {fmt(Math.abs(t.unidades),4)} ações · {fmtEur(t.preco_medio)}/ação
        </p>
        <p className="text-[10px] text-stone-400">{data} {hora}</p>
      </div>
      <div className="text-right flex-shrink-0 mr-2">
        <p className={`text-[13px] font-semibold ${isVenda?'text-red-500':'text-brand-600'}`}>
          {isVenda?'-':'+'}{ fmtEur(total)}
        </p>
      </div>
      <button onClick={onApagar} className="w-6 h-6 flex items-center justify-center text-stone-300 hover:text-red-400 transition-colors flex-shrink-0">
        <X size={14} strokeWidth={2}/>
      </button>
    </div>
  )
}

/* ─── Botão ordenação ─── */
function BotaoOrdem({ label, campo, ordem, onOrdenar }: {
  label:string; campo:OrdemKey
  ordem:{key:OrdemKey;dir:OrdemDir}|null
  onOrdenar:(k:OrdemKey)=>void
}) {
  const ativo = ordem?.key === campo
  const dir   = ativo ? ordem!.dir : null
  return (
    <button onClick={()=>onOrdenar(campo)}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] border transition-colors
        ${ativo?'bg-brand-50 border-brand-400 text-brand-800 font-medium':'bg-white border-stone-200 text-stone-600'}`}>
      {label}
      {dir==='asc'  ? <ChevronUp size={12}/>    :
       dir==='desc' ? <ChevronDown size={12}/>   :
                      <ChevronsUpDown size={12} className="opacity-40"/>}
    </button>
  )
}

/* ─── Página principal ─── */
export default function Portfolio() {
  const [aba,             setAba]             = useState<Aba>('posicoes')
  const [filtro,          setFiltro]          = useState<Filtro>('Todos')
  const [modalAberto,     setModalAberto]     = useState(false)
  const [transacoes,      setTransacoes]      = useState<Transacao[]>([])
  const [cotacoes,        setCotacoes]        = useState<Record<string,Cotacao>>({})
  const [carregando,      setCarregando]      = useState(true)
  const [atualizando,     setAtualizando]     = useState(false)
  const [ultimaConsulta,  setUltimaConsulta]  = useState<Date|null>(null)
  const [apagarId,        setApagarId]        = useState<string|null>(null)
  const [ordem,           setOrdem]           = useState<{key:OrdemKey;dir:OrdemDir}|null>(null)

  useEffect(()=>{ carregar() },[])

  async function carregar() {
    setCarregando(true)
    const {data:{session}} = await supabase.auth.getSession()
    if (!session) { setCarregando(false); return }
    const {data} = await supabase.from('posicoes').select('*').order('data_compra',{ascending:true})
    if (data) {
      setTransacoes(data as Transacao[])
      await buscarCotacoes(data as Transacao[])
    }
    setCarregando(false)
  }

  const buscarCotacoes = useCallback(async (lista:Transacao[])=>{
    setAtualizando(true)
    const tickers = lista.map(p=>p.ticker).filter((t,i,a)=>a.indexOf(t)===i)
    const novas:Record<string,Cotacao>={}
    await Promise.all(tickers.map(async ticker=>{
      try{
        const res=await fetch(`/api/cotacao?ticker=${encodeURIComponent(ticker)}`)
        if(res.ok) novas[ticker]=await res.json()
      }catch{}
    }))
    setCotacoes(novas)
    setUltimaConsulta(new Date())
    setAtualizando(false)
  },[])

  async function adicionarTransacao(nova:Omit<Transacao,'id'>):Promise<string|null>{
    const {data:{session}}=await supabase.auth.getSession()
    if(!session?.user) return 'Sem sessão.'
    const {data,error}=await supabase.from('posicoes')
      .insert({...nova,user_id:session.user.id}).select().single()
    if(error) return error.message
    if(data){
      const novas=[...transacoes, data as Transacao].sort((a,b)=>
        (a.data_compra??'') < (b.data_compra??'') ? -1 : 1)
      setTransacoes(novas)
      buscarCotacoes(novas)
    }
    return null
  }

  async function apagarTransacao(id:string){
    await supabase.from('posicoes').delete().eq('id',id)
    const novas=transacoes.filter(t=>t.id!==id)
    setTransacoes(novas)
    setApagarId(null)
  }

  /* Agregar posições */
  const posicoes = agregarPosicoes(transacoes)

  /* Filtrar */
  const posicoesFiltradas = posicoes.filter(p=>{
    if(filtro==='Todos') return true
    if(filtro==='ETFs')  return p.tipo==='ETF'
    if(filtro==='Ações') return p.tipo==='Ação'
    if(filtro==='REITs') return p.tipo==='REIT'
    return true
  })

  /* Ordenar */
  function toggleOrdem(key:OrdemKey){
    setOrdem(prev=>{
      if(!prev||prev.key!==key) return {key,dir:'asc'}
      if(prev.dir==='asc')      return {key,dir:'desc'}
      return null
    })
  }

  const posicoesOrdenadas = [...posicoesFiltradas].sort((a,b)=>{
    if(!ordem) return 0
    const dir = ordem.dir==='asc' ? 1 : -1
    if(ordem.key==='ticker') return a.ticker.localeCompare(b.ticker)*dir
    if(ordem.key==='valor'){
      const vA=(cotacoes[a.ticker]?.preco??a.preco_medio)*a.unidades
      const vB=(cotacoes[b.ticker]?.preco??b.preco_medio)*b.unidades
      return (vA-vB)*dir
    }
    if(ordem.key==='ganho_pct'){
      const cA=a.preco_medio*a.unidades
      const cB=b.preco_medio*b.unidades
      const gA=cA>0?((cotacoes[a.ticker]?.preco??a.preco_medio)*a.unidades-cA)/cA:0
      const gB=cB>0?((cotacoes[b.ticker]?.preco??b.preco_medio)*b.unidades-cB)/cB:0
      return (gA-gB)*dir
    }
    return 0
  })

  /* Totais */
  const totalCusto = posicoesOrdenadas.reduce((s,p)=>s+p.preco_medio*p.unidades,0)
  const totalValor = posicoesOrdenadas.reduce((s,p)=>s+(cotacoes[p.ticker]?.preco??p.preco_medio)*p.unidades,0)
  const totalGanho = totalValor-totalCusto
  const totalPct   = totalCusto>0?(totalGanho/totalCusto)*100:0

  const contagens = {
    Todos:posicoes.length, ETFs:posicoes.filter(p=>p.tipo==='ETF').length,
    Ações:posicoes.filter(p=>p.tipo==='Ação').length, REITs:posicoes.filter(p=>p.tipo==='REIT').length
  }

  const historicoFiltrado = [...transacoes].sort((a,b)=>
    (b.data_compra??'') > (a.data_compra??'') ? 1 : -1)

  const transacaoApagar = transacoes.find(t=>t.id===apagarId)

  return (
    <div className="pb-2">
      {modalAberto && <ModalTransacao onClose={()=>setModalAberto(false)} onAdd={adicionarTransacao}/>}
      {apagarId && transacaoApagar && (
        <DialogApagar
          texto={`Tens a certeza que queres apagar este registo de ${transacaoApagar.unidades<0?'venda':'compra'} de ${transacaoApagar.ticker}?`}
          onClose={()=>setApagarId(null)} onConfirm={()=>apagarTransacao(apagarId)}/>
      )}

      {/* Top bar */}
      <div className="bg-white px-5 pt-12 pb-3 border-b border-stone-100">
        <div className="flex justify-between items-center mb-2">
          <p className="text-[17px] font-semibold text-stone-900">Portfólio</p>
          <button onClick={()=>setModalAberto(true)}
            className="flex items-center gap-1.5 bg-brand-50 border border-brand-100
              rounded-full px-3 py-1.5 text-[12px] text-brand-800 font-medium active:scale-[0.97] transition-transform">
            <Plus size={13} strokeWidth={2.5}/>Adicionar
          </button>
        </div>
        {/* Abas */}
        <div className="flex gap-1 mb-2">
          <button onClick={()=>setAba('posicoes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] border transition-colors
              ${aba==='posicoes'?'bg-brand-50 border-brand-400 text-brand-800 font-medium':'bg-white border-stone-200 text-stone-600'}`}>
            <BarChart2 size={12}/>Posições
          </button>
          <button onClick={()=>setAba('historico')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] border transition-colors
              ${aba==='historico'?'bg-brand-50 border-brand-400 text-brand-800 font-medium':'bg-white border-stone-200 text-stone-600'}`}>
            <History size={12}/>Histórico
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full
              ${aba==='historico'?'bg-brand-100 text-brand-700':'bg-stone-100 text-stone-500'}`}>
              {transacoes.length}
            </span>
          </button>
        </div>
        {/* Data actualização */}
        <div className="flex items-center gap-2">
          <p className="text-[11px] text-stone-400">
            {ultimaConsulta
              ? `Atualizado: ${ultimaConsulta.toLocaleDateString('pt-PT')} ${ultimaConsulta.toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'})}`
              : carregando?'A carregar...':''}
          </p>
          {!carregando&&(
            <button onClick={()=>buscarCotacoes(transacoes)} disabled={atualizando}
              className="flex items-center gap-1 text-[11px] text-brand-600 disabled:opacity-40">
              <RefreshCw size={11} className={atualizando?'animate-spin':''}/>
              {atualizando?'':'Atualizar'}
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">

        {/* ABA: POSIÇÕES */}
        {aba==='posicoes' && (
          <>
            {/* Filtros */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(['Todos','ETFs','Ações','REITs'] as Filtro[]).map(f=>(
                <button key={f} onClick={()=>setFiltro(f)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] border transition-colors
                    ${filtro===f?'bg-brand-50 border-brand-400 text-brand-800 font-medium':'bg-white border-stone-200 text-stone-600'}`}>
                  {f}
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                    ${filtro===f?'bg-brand-100 text-brand-700':'bg-stone-100 text-stone-500'}`}>
                    {contagens[f]}
                  </span>
                </button>
              ))}
            </div>

            {/* Ordenação */}
            {posicoesOrdenadas.length > 1 && (
              <div className="flex gap-2 items-center overflow-x-auto pb-1">
                <span className="text-[11px] text-stone-400 flex-shrink-0">Ordenar:</span>
                <BotaoOrdem label="Ticker A-Z"  campo="ticker"    ordem={ordem} onOrdenar={toggleOrdem}/>
                <BotaoOrdem label="Valor"        campo="valor"     ordem={ordem} onOrdenar={toggleOrdem}/>
                <BotaoOrdem label="Ganho %"      campo="ganho_pct" ordem={ordem} onOrdenar={toggleOrdem}/>
              </div>
            )}

            {/* Cabeçalho tabela */}
            {posicoesOrdenadas.length>0&&(
              <div className="flex items-center px-3 py-1.5">
                <div className="w-[25px] flex-shrink-0"/>
                <div className="flex-1"><p className="text-[10px] font-medium text-stone-400 uppercase tracking-wide">Ação</p></div>
                <div className="flex items-center gap-0 flex-shrink-0">
                  <div className="w-[60px] text-right"><p className="text-[10px] font-medium text-stone-400 uppercase tracking-wide">Custo€</p></div>
                  <div className="w-[64px] text-right"><p className="text-[10px] font-medium text-stone-400 uppercase tracking-wide">Valor€</p></div>
                  <div className="w-[72px] text-right"><p className="text-[10px] font-medium text-stone-400 uppercase tracking-wide">Ganho€</p></div>
                  <div className="w-[32px]"/>
                </div>
              </div>
            )}

            {carregando?(
              <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
                <p className="text-[14px] text-stone-400">A carregar...</p>
              </div>
            ):posicoesOrdenadas.length===0?(
              <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
                <p className="text-[14px] text-stone-500 mb-1">
                  {filtro==='Todos'?'Ainda não tens posições.':'Sem posições do tipo '+filtro+'.'}
                </p>
                {filtro==='Todos'&&(
                  <button onClick={()=>setModalAberto(true)} className="text-[13px] text-brand-600 font-medium mt-1">
                    + Adicionar primeira posição
                  </button>
                )}
              </div>
            ):(
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                {posicoesOrdenadas.map(p=>(
                  <PosicaoRow key={p.ticker} pos={p} cotacao={cotacoes[p.ticker]}
                    onApagar={()=>{
                      // Apaga TODAS as transacoes deste ticker
                      const ids = transacoes.filter(t=>t.ticker===p.ticker).map(t=>t.id)
                      if(ids.length===1) setApagarId(ids[0])
                      else {
                        // Se houver várias, abre aviso especial com o primeiro id como placeholder
                        setApagarId(ids[0])
                      }
                    }}/>
                ))}
              </div>
            )}

            {/* Totais */}
            {posicoesOrdenadas.length>0&&(
              <div className="bg-white rounded-2xl border border-stone-200 p-4">
                <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-3">
                  Total — {posicoesOrdenadas.length} posições
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-stone-50 rounded-xl p-3">
                    <p className="text-[10px] text-stone-500 mb-1 uppercase tracking-wide">Custo</p>
                    <p className="text-[13px] font-semibold text-stone-900">{fmtEur(totalCusto)}</p>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-3">
                    <p className="text-[10px] text-stone-500 mb-1 uppercase tracking-wide">Valor</p>
                    <p className="text-[13px] font-semibold text-stone-900">{fmtEur(totalValor)}</p>
                  </div>
                  <div className={`rounded-xl p-3 ${totalGanho>=0?'bg-brand-50':'bg-red-50'}`}>
                    <p className="text-[10px] text-stone-500 mb-1 uppercase tracking-wide">Ganho</p>
                    <p className={`text-[13px] font-semibold ${totalGanho>=0?'text-brand-600':'text-red-500'}`}>
                      {totalGanho>=0?'+':''}{fmtEur(totalGanho)}
                    </p>
                    <p className={`text-[10px] ${totalGanho>=0?'text-brand-500':'text-red-400'}`}>
                      {totalGanho>=0?'+':''}{fmt(totalPct)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ABA: HISTÓRICO */}
        {aba==='historico' && (
          <>
            {carregando?(
              <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
                <p className="text-[14px] text-stone-400">A carregar...</p>
              </div>
            ):historicoFiltrado.length===0?(
              <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
                <p className="text-[14px] text-stone-500">Ainda não tens transações.</p>
              </div>
            ):(
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <div className="flex items-center px-3 py-2 border-b border-stone-100">
                  <div className="w-[25px] flex-shrink-0"/>
                  <div className="flex-1"><p className="text-[10px] font-medium text-stone-400 uppercase tracking-wide">Transação</p></div>
                  <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wide mr-8">Total</p>
                </div>
                {historicoFiltrado.map(t=>(
                  <HistoricoRow key={t.id} t={t} onApagar={()=>setApagarId(t.id)}/>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}

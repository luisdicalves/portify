'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, X, Search, Check, RefreshCw, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'

/* ─── Tipos ─── */
type Tipo = 'Ação' | 'ETF' | 'REIT'
type Filtro = 'Todos' | 'ETFs' | 'Ações' | 'REITs'

type Posicao = {
  id: string
  ticker: string
  nome: string
  tipo: Tipo
  unidades: number
  preco_medio: number
  moeda: string
  data_compra?: string
}

type Cotacao = {
  preco: number
  variacao: number
  variacaoPct: number
  moeda: string
  bandeira: string
  nome: string
  timestamp: string
}

/* ─── Helpers ─── */
function fmt(n: number, casas = 2) {
  return n.toLocaleString('pt-PT', { minimumFractionDigits: casas, maximumFractionDigits: casas })
}
function fmtEur(n: number) { return '€' + fmt(n) }

function getBandeiraTicker(ticker: string): string {
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
  if (t.endsWith('.AX')) return '🇦🇺'
  if (t.endsWith('.TO')) return '🇨🇦'
  if (['VWCE','CSPX','IWDA','EIMI','IUSQ','VUSA','VUAA'].includes(t.split('.')[0])) return '🇮🇪'
  return '🇺🇸'
}

const TIPO_COLORS: Record<Tipo, string> = {
  'Ação': 'bg-blue-50 text-blue-700',
  'ETF':  'bg-brand-50 text-brand-700',
  'REIT': 'bg-amber-50 text-amber-700',
}

/* ─── Modal adicionar ─── */
function ModalAdicionar({ onClose, onAdd }: {
  onClose: () => void
  onAdd: (p: Omit<Posicao, 'id'>) => Promise<string | null>
}) {
  const [ticker,    setTicker]    = useState('')
  const [unidades,  setUnidades]  = useState('')
  const [pm,        setPm]        = useState('')
  const [tipo,      setTipo]      = useState<Tipo>('Ação')
  const [dataCompra,setDataCompra]= useState('')
  const [horaCompra,setHoraCompra]= useState('')
  const [erro,      setErro]      = useState('')
  const [loading,   setLoading]   = useState(false)

  async function confirmar() {
    const u = parseFloat(unidades.replace(',', '.'))
    const p = parseFloat(pm.replace(',', '.'))
    if (!ticker.trim())  { setErro('Insere o símbolo do ativo.'); return }
    if (!u || u <= 0)    { setErro('Insere um número de ações válido.'); return }
    if (!p || p <= 0)    { setErro('Insere um preço médio válido.'); return }
    if (!dataCompra)     { setErro('Seleciona a data de compra.'); return }

    setErro('')
    setLoading(true)
    const dtCompra = horaCompra
      ? `${dataCompra}T${horaCompra}`
      : `${dataCompra}T00:00`
    const erroMsg = await onAdd({
      ticker:       ticker.trim().toUpperCase(),
      nome:         ticker.trim().toUpperCase(),
      tipo,
      unidades:     u,
      preco_medio:  p,
      moeda:        'EUR',
      data_compra:  dtCompra,
    })
    setLoading(false)
    if (erroMsg) { setErro(erroMsg); return }
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose}/>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm
        bg-white rounded-t-3xl z-50 pb-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-white">
          <div className="w-10 h-1 bg-stone-200 rounded-full"/>
        </div>
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-stone-100 sticky top-5 bg-white">
          <p className="text-[16px] font-semibold text-stone-900">Adicionar posição</p>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center">
            <X size={14} color="#5F5E5A" strokeWidth={2}/>
          </button>
        </div>

        <div className="px-5 pt-4 space-y-4">

          {/* Símbolo */}
          <div>
            <label className="block text-[12px] font-medium text-stone-500 mb-1.5">
              Símbolo <span className="text-stone-400 font-normal">(ex: AAPL, AMD.DE, VWCE)</span>
            </label>
            <input
              value={ticker}
              onChange={e => setTicker(e.target.value.toUpperCase())}
              placeholder="Ex: AAPL"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-[11px]
                text-[14px] font-medium text-stone-900 uppercase placeholder:normal-case
                placeholder:text-stone-400 focus:outline-none focus:border-brand-400 transition-colors"/>
            {ticker && (
              <p className="text-[11px] text-stone-400 mt-1 ml-1">
                {getBandeiraTicker(ticker)} {ticker.toUpperCase()}
              </p>
            )}
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-[12px] font-medium text-stone-500 mb-1.5">Tipo</label>
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

          {/* Nº ações */}
          <div>
            <label className="block text-[12px] font-medium text-stone-500 mb-1.5">Nº de ações</label>
            <input type="number" inputMode="decimal" min="0" placeholder="Ex: 10"
              value={unidades} onChange={e => setUnidades(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-[11px]
                text-[14px] text-stone-900 placeholder:text-stone-400
                focus:outline-none focus:border-brand-400 transition-colors"/>
          </div>

          {/* Preço médio */}
          <div>
            <label className="block text-[12px] font-medium text-stone-500 mb-1.5">Preço médio de compra (€)</label>
            <input type="number" inputMode="decimal" min="0" placeholder="Ex: 88.20"
              value={pm} onChange={e => setPm(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-[11px]
                text-[14px] text-stone-900 placeholder:text-stone-400
                focus:outline-none focus:border-brand-400 transition-colors"/>
          </div>

          {/* Data e hora */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[12px] font-medium text-stone-500 mb-1.5">Data de compra</label>
              <input type="date" value={dataCompra} onChange={e => setDataCompra(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-[11px]
                  text-[13px] text-stone-900 focus:outline-none focus:border-brand-400 transition-colors"/>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-stone-500 mb-1.5">Hora (opcional)</label>
              <input type="time" value={horaCompra} onChange={e => setHoraCompra(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-[11px]
                  text-[13px] text-stone-900 focus:outline-none focus:border-brand-400 transition-colors"/>
            </div>
          </div>

          {/* Resumo */}
          {unidades && pm && (
            <div className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 space-y-1">
              <div className="flex justify-between text-[12px]">
                <span className="text-stone-500">Custo total</span>
                <span className="font-semibold text-stone-900">
                  {fmtEur(parseFloat(unidades||'0') * parseFloat(pm||'0'))}
                </span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-stone-500">Preço médio por ação</span>
                <span className="font-medium text-stone-900">{fmtEur(parseFloat(pm||'0'))}</span>
              </div>
            </div>
          )}

          {erro && (
            <p className="text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{erro}</p>
          )}

          <button onClick={confirmar} disabled={loading}
            className="w-full bg-brand-400 text-white font-medium text-[15px]
              py-[13px] rounded-xl disabled:opacity-50 active:scale-[0.98] transition-all">
            {loading ? 'A guardar...' : 'Adicionar ao portfólio'}
          </button>
        </div>
      </div>
    </>
  )
}

/* ─── Linha de posição ─── */
function PosicaoRow({ pos, cotacao }: { pos: Posicao; cotacao?: Cotacao }) {
  const precoAtual = cotacao?.preco ?? pos.preco_medio
  const valor      = precoAtual * pos.unidades
  const custo      = pos.preco_medio * pos.unidades
  const ganho      = valor - custo
  const ganhoPct   = custo > 0 ? (ganho / custo) * 100 : 0
  const positivo   = ganho >= 0
  const bandeira   = cotacao?.bandeira ?? getBandeiraTicker(pos.ticker)

  return (
    <div className="px-4 py-3 border-b border-stone-100 last:border-0">
      {/* Linha principal */}
      <div className="flex items-start gap-3">
        {/* Bandeira + ticker */}
        <div className="flex-shrink-0 mt-0.5">
          <span className="text-[18px]">{bandeira}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-semibold text-stone-900">{pos.ticker}</span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${TIPO_COLORS[pos.tipo]}`}>
              {pos.tipo}
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5">
            {fmt(pos.unidades, 4)} ações · PM {fmtEur(pos.preco_medio)}
          </p>
        </div>
        {/* Custo | Valor | Ganho | % */}
        <div className="flex-shrink-0 text-right">
          <div className="flex items-center gap-3 text-[12px]">
            <div className="hidden sm:block">
              <p className="text-stone-400 text-[10px] uppercase tracking-wide">Custo</p>
              <p className="text-stone-600 font-medium">{fmtEur(custo)}</p>
            </div>
            <div>
              <p className="text-stone-400 text-[10px] uppercase tracking-wide">Valor</p>
              <p className="text-stone-900 font-bold">{fmtEur(valor)}</p>
            </div>
            <div>
              <p className="text-stone-400 text-[10px] uppercase tracking-wide">Ganho</p>
              <p className={`font-semibold ${positivo ? 'text-brand-600' : 'text-red-500'}`}>
                {positivo ? '+' : ''}{fmtEur(ganho)}
              </p>
              <p className={`text-[11px] font-medium ${positivo ? 'text-brand-500' : 'text-red-400'}`}>
                {positivo ? '+' : ''}{fmt(ganhoPct)}%
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Cotação atual se disponível */}
      {cotacao && (
        <div className="mt-1.5 ml-7 flex items-center gap-2">
          <span className="text-[11px] text-stone-400">
            Cotação: <span className="font-medium text-stone-600">{fmtEur(cotacao.preco)}</span>
          </span>
          <span className={`text-[11px] font-medium ${cotacao.variacaoPct >= 0 ? 'text-brand-500' : 'text-red-400'}`}>
            {cotacao.variacaoPct >= 0 ? '+' : ''}{fmt(cotacao.variacaoPct)}% hoje
          </span>
        </div>
      )}
    </div>
  )
}

/* ─── Página principal ─── */
export default function Portfolio() {
  const [filtro,       setFiltro]       = useState<Filtro>('Todos')
  const [modalAberto,  setModalAberto]  = useState(false)
  const [posicoes,     setPosicoes]     = useState<Posicao[]>([])
  const [cotacoes,     setCotacoes]     = useState<Record<string, Cotacao>>({})
  const [carregando,   setCarregando]   = useState(true)
  const [atualizando,  setAtualizando]  = useState(false)
  const [ultimaConsulta, setUltimaConsulta] = useState<Date | null>(null)

  useEffect(() => { carregarPosicoes() }, [])

  async function carregarPosicoes() {
    setCarregando(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setCarregando(false); return }
    const { data } = await supabase
      .from('posicoes').select('*').order('criado_em', { ascending: false })
    if (data) {
      setPosicoes(data as Posicao[])
      await buscarCotacoes(data as Posicao[])
    }
    setCarregando(false)
  }

  const buscarCotacoes = useCallback(async (lista: Posicao[]) => {
    setAtualizando(true)
    const tickers = lista.map(p => p.ticker).filter((t, i, arr) => arr.indexOf(t) === i)
    const novasCotacoes: Record<string, Cotacao> = {}
    await Promise.all(tickers.map(async ticker => {
      try {
        const res = await fetch(`/api/cotacao?ticker=${encodeURIComponent(ticker)}`)
        if (res.ok) {
          const data = await res.json()
          novasCotacoes[ticker] = data
        }
      } catch {}
    }))
    setCotacoes(novasCotacoes)
    setUltimaConsulta(new Date())
    setAtualizando(false)
  }, [])

  async function adicionarPosicao(nova: Omit<Posicao, 'id'>): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return 'Sem sessão.'
    const { data, error } = await supabase
      .from('posicoes')
      .insert({ ...nova, user_id: session.user.id })
      .select().single()
    if (error) return error.message
    if (data) {
      const novas = [data as Posicao, ...posicoes]
      setPosicoes(novas)
      buscarCotacoes(novas)
    }
    return null
  }

  // Contagem por tipo
  const contagens = {
    Todos: posicoes.length,
    ETFs:  posicoes.filter(p => p.tipo === 'ETF').length,
    Ações: posicoes.filter(p => p.tipo === 'Ação').length,
    REITs: posicoes.filter(p => p.tipo === 'REIT').length,
  }

  const filtradas = posicoes.filter(p => {
    if (filtro === 'Todos') return true
    if (filtro === 'ETFs')  return p.tipo === 'ETF'
    if (filtro === 'Ações') return p.tipo === 'Ação'
    if (filtro === 'REITs') return p.tipo === 'REIT'
    return true
  })

  // Totais
  const totalCusto = filtradas.reduce((s, p) => s + p.preco_medio * p.unidades, 0)
  const totalValor = filtradas.reduce((s, p) => {
    const c = cotacoes[p.ticker]
    return s + (c?.preco ?? p.preco_medio) * p.unidades
  }, 0)
  const totalGanho = totalValor - totalCusto
  const totalPct   = totalCusto > 0 ? (totalGanho / totalCusto) * 100 : 0

  return (
    <div className="pb-2">
      {modalAberto && (
        <ModalAdicionar onClose={() => setModalAberto(false)} onAdd={adicionarPosicao}/>
      )}

      {/* Top bar */}
      <div className="bg-white px-5 pt-12 pb-3 border-b border-stone-100">
        <div className="flex justify-between items-center mb-1">
          <p className="text-[17px] font-semibold text-stone-900">Portfólio</p>
          <button onClick={() => setModalAberto(true)}
            className="flex items-center gap-1.5 bg-brand-50 border border-brand-100
              rounded-full px-3 py-1.5 text-[12px] text-brand-800 font-medium
              active:scale-[0.97] transition-transform">
            <Plus size={13} strokeWidth={2.5}/>Adicionar
          </button>
        </div>
        {/* Data/hora da última consulta */}
        <div className="flex items-center gap-2">
          <p className="text-[11px] text-stone-400">
            {ultimaConsulta
              ? `Atualizado: ${ultimaConsulta.toLocaleDateString('pt-PT')} ${ultimaConsulta.toLocaleTimeString('pt-PT', { hour:'2-digit', minute:'2-digit' })}`
              : 'A carregar cotações...'}
          </p>
          <button onClick={() => buscarCotacoes(posicoes)} disabled={atualizando}
            className="flex items-center gap-1 text-[11px] text-brand-600 disabled:opacity-40">
            <RefreshCw size={11} className={atualizando ? 'animate-spin' : ''}/>
            {atualizando ? 'A atualizar...' : 'Atualizar'}
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">

        {/* Filtros com contagem */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['Todos','ETFs','Ações','REITs'] as Filtro[]).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] border transition-colors
                ${filtro===f ? 'bg-brand-50 border-brand-400 text-brand-800 font-medium' : 'bg-white border-stone-200 text-stone-600'}`}>
              {f}
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                ${filtro===f ? 'bg-brand-100 text-brand-700' : 'bg-stone-100 text-stone-500'}`}>
                {contagens[f]}
              </span>
            </button>
          ))}
        </div>

        {/* Tabela de cabeçalho */}
        {filtradas.length > 0 && (
          <div className="flex items-center px-4 py-2 text-[10px] font-medium text-stone-400 uppercase tracking-wide">
            <span className="flex-1">Ação</span>
            <div className="flex gap-3 text-right">
              <span className="hidden sm:block w-16">Custo</span>
              <span className="w-16">Valor</span>
              <span className="w-20">Ganho</span>
            </div>
          </div>
        )}

        {/* Lista */}
        {carregando ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
            <p className="text-[14px] text-stone-400">A carregar...</p>
          </div>
        ) : filtradas.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
            <p className="text-[14px] text-stone-500 mb-1">
              {filtro==='Todos' ? 'Ainda não tens posições.' : `Sem posições do tipo ${filtro}.`}
            </p>
            {filtro==='Todos' && (
              <button onClick={() => setModalAberto(true)}
                className="text-[13px] text-brand-600 font-medium mt-1">
                + Adicionar primeira posição
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            {filtradas.map(p => (
              <PosicaoRow key={p.id} pos={p} cotacao={cotacoes[p.ticker]}/>
            ))}
          </div>
        )}

        {/* Resumo totais */}
        {filtradas.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-200 p-4">
            <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-3">
              Resumo — {filtro} ({filtradas.length} posições)
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-stone-50 rounded-xl p-3">
                <p className="text-[10px] text-stone-500 mb-1 uppercase tracking-wide">Custo total</p>
                <p className="text-[14px] font-semibold text-stone-900">{fmtEur(totalCusto)}</p>
              </div>
              <div className="bg-stone-50 rounded-xl p-3">
                <p className="text-[10px] text-stone-500 mb-1 uppercase tracking-wide">Valor atual</p>
                <p className="text-[14px] font-semibold text-stone-900">{fmtEur(totalValor)}</p>
              </div>
              <div className={`rounded-xl p-3 ${totalGanho >= 0 ? 'bg-brand-50' : 'bg-red-50'}`}>
                <p className="text-[10px] text-stone-500 mb-1 uppercase tracking-wide">Ganho</p>
                <p className={`text-[14px] font-semibold ${totalGanho >= 0 ? 'text-brand-600' : 'text-red-500'}`}>
                  {totalGanho >= 0 ? '+' : ''}{fmtEur(totalGanho)}
                </p>
                <p className={`text-[11px] ${totalGanho >= 0 ? 'text-brand-500' : 'text-red-400'}`}>
                  {totalGanho >= 0 ? '+' : ''}{fmt(totalPct)}%
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

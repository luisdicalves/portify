'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Search, ChevronDown, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { setores } from '@/lib/mock-data'

type Posicao = {
  id?: string
  ticker: string
  nome: string
  tipo: string
  unidades: number
  preco_medio: number
  moeda: string
}

type Filtro = 'Todos' | 'ETFs' | 'Ações' | 'REITs'

const MOEDAS = ['EUR €', 'USD $', 'GBP £', 'CHF Fr']

const SUGESTOES = [
  { ticker: 'VWCE', nome: 'Vanguard FTSE All-World ETF',  tipo: 'ETF'  },
  { ticker: 'CSPX', nome: 'iShares Core S&P 500 ETF',     tipo: 'ETF'  },
  { ticker: 'IWDA', nome: 'iShares Core MSCI World ETF',  tipo: 'ETF'  },
  { ticker: 'EIMI', nome: 'iShares Core MSCI EM IMI ETF', tipo: 'ETF'  },
  { ticker: 'AAPL', nome: 'Apple Inc.',                   tipo: 'Ação' },
  { ticker: 'MSFT', nome: 'Microsoft Corporation',        tipo: 'Ação' },
  { ticker: 'GOOGL',nome: 'Alphabet Inc.',                tipo: 'Ação' },
  { ticker: 'NVDA', nome: 'NVIDIA Corporation',           tipo: 'Ação' },
  { ticker: 'AMZN', nome: 'Amazon.com Inc.',              tipo: 'Ação' },
  { ticker: 'TSLA', nome: 'Tesla Inc.',                   tipo: 'Ação' },
  { ticker: 'O',    nome: 'Realty Income Corporation',    tipo: 'REIT' },
  { ticker: 'VNQ',  nome: 'Vanguard Real Estate ETF',     tipo: 'REIT' },
]

function fmt(n: number) {
  return n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function AdicionarModal({ onClose, onAdd }: {
  onClose: () => void
  onAdd: (p: Omit<Posicao, 'id'>) => void
}) {
  const [pesquisa,    setPesquisa]    = useState('')
  const [selecionado, setSelecionado] = useState<typeof SUGESTOES[0] | null>(null)
  const [quantidade,  setQuantidade]  = useState('')
  const [pm,          setPm]          = useState('')
  const [moeda,       setMoeda]       = useState('EUR €')
  const [moedaOpen,   setMoedaOpen]   = useState(false)
  const [step,        setStep]        = useState<'pesquisa' | 'detalhe'>('pesquisa')
  const [erro,        setErro]        = useState('')

  const filtradas = SUGESTOES.filter(s =>
    s.ticker.toLowerCase().includes(pesquisa.toLowerCase()) ||
    s.nome.toLowerCase().includes(pesquisa.toLowerCase())
  )

  function escolher(s: typeof SUGESTOES[0]) {
    setSelecionado(s)
    setPesquisa(s.ticker + ' — ' + s.nome)
    setStep('detalhe')
  }

  function confirmar() {
    const q = parseFloat(quantidade.replace(',', '.'))
    const p = parseFloat(pm.replace(',', '.'))
    if (!selecionado) { setErro('Seleciona um ativo.'); return }
    if (!q || q <= 0) { setErro('Insere um número de ações válido.'); return }
    if (!p || p <= 0) { setErro('Insere um preço médio válido.'); return }
    setErro('')
    onAdd({
      ticker:      selecionado.ticker,
      nome:        selecionado.nome,
      tipo:        selecionado.tipo,
      unidades:    q,
      preco_medio: p,
      moeda:       moeda.split(' ')[0],
    })
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm
        bg-white rounded-t-3xl z-50 pb-8 shadow-2xl">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-stone-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            {step === 'detalhe' && (
              <button onClick={() => { setStep('pesquisa'); setSelecionado(null); setPesquisa('') }}
                className="text-[13px] text-stone-500">← Voltar</button>
            )}
            <p className="text-[16px] font-semibold text-stone-900">
              {step === 'pesquisa' ? 'Adicionar posição' : selecionado?.ticker}
            </p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center">
            <X size={14} color="#5F5E5A" strokeWidth={2} />
          </button>
        </div>

        <div className="px-5 pt-4 space-y-4">
          {step === 'pesquisa' && (
            <>
              <div>
                <label className="block text-[12px] font-medium text-stone-500 mb-1.5">
                  Símbolo ou nome do ativo
                </label>
                <div className="relative">
                  <Search size={15} color="#B4B2A9" className="absolute left-3 top-1/2 -translate-y-1/2" />
                  <input autoFocus value={pesquisa}
                    onChange={e => { setPesquisa(e.target.value); setSelecionado(null) }}
                    placeholder="Ex: VWCE, Apple, MSFT..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl
                      pl-9 pr-4 py-[11px] text-[14px] text-stone-900 placeholder:text-stone-400
                      focus:outline-none focus:border-brand-400 transition-colors" />
                </div>
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {(pesquisa ? filtradas : SUGESTOES).map(s => (
                  <button key={s.ticker} onClick={() => escolher(s)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                      hover:bg-brand-50 active:bg-brand-50 transition-colors text-left">
                    <div className="w-9 h-9 rounded-[9px] bg-stone-100 border border-stone-200
                      flex items-center justify-center text-[10px] font-semibold
                      text-stone-600 flex-shrink-0">
                      {s.ticker.slice(0, 4)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-stone-900 truncate">{s.ticker}</p>
                      <p className="text-[11px] text-stone-400 truncate">{s.nome}</p>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0
                      ${s.tipo === 'ETF'  ? 'bg-brand-50 text-brand-700' :
                        s.tipo === 'REIT' ? 'bg-amber-50 text-amber-700' :
                                            'bg-blue-50 text-blue-700'}`}>
                      {s.tipo}
                    </span>
                  </button>
                ))}
                {pesquisa && filtradas.length === 0 && (
                  <p className="text-[13px] text-stone-400 text-center py-6">
                    Nenhum resultado para "{pesquisa}"
                  </p>
                )}
              </div>
            </>
          )}

          {step === 'detalhe' && selecionado && (
            <>
              <div className="flex items-center gap-3 bg-brand-50 border border-brand-100
                rounded-xl px-3 py-2.5">
                <div className="w-9 h-9 rounded-[9px] bg-white border border-brand-100
                  flex items-center justify-center text-[10px] font-semibold text-brand-700">
                  {selecionado.ticker.slice(0, 4)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-brand-800">{selecionado.ticker}</p>
                  <p className="text-[11px] text-brand-600 truncate">{selecionado.nome}</p>
                </div>
                <Check size={15} color="#1D9E75" strokeWidth={2.5} />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-stone-500 mb-1.5">
                  Número de ações
                </label>
                <input type="number" inputMode="decimal" min="0"
                  placeholder="Ex: 10" value={quantidade}
                  onChange={e => setQuantidade(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl
                    px-4 py-[11px] text-[14px] text-stone-900 placeholder:text-stone-400
                    focus:outline-none focus:border-brand-400 transition-colors" />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-stone-500 mb-1.5">
                  Preço médio de compra
                </label>
                <div className="flex gap-2">
                  <input type="number" inputMode="decimal" min="0"
                    placeholder="Ex: 88.20" value={pm}
                    onChange={e => setPm(e.target.value)}
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-xl
                      px-4 py-[11px] text-[14px] text-stone-900 placeholder:text-stone-400
                      focus:outline-none focus:border-brand-400 transition-colors" />
                  <div className="relative">
                    <button onClick={() => setMoedaOpen(v => !v)}
                      className="flex items-center gap-1.5 bg-stone-50 border border-stone-200
                        rounded-xl px-3 py-[11px] text-[13px] text-stone-700 font-medium
                        focus:outline-none whitespace-nowrap">
                      {moeda.split(' ')[1]}
                      <ChevronDown size={13} color="#888780" />
                    </button>
                    {moedaOpen && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-stone-200
                        rounded-xl shadow-lg z-10 overflow-hidden min-w-[110px]">
                        {MOEDAS.map(m => (
                          <button key={m} onClick={() => { setMoeda(m); setMoedaOpen(false) }}
                            className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors
                              ${moeda === m ? 'bg-brand-50 text-brand-800 font-medium' : 'text-stone-700 hover:bg-stone-50'}`}>
                            {m}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {quantidade && pm && (
                <div className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3
                  flex justify-between items-center">
                  <p className="text-[12px] text-stone-500">Valor total investido</p>
                  <p className="text-[15px] font-semibold text-stone-900">
                    {(parseFloat(quantidade||'0') * parseFloat(pm||'0')).toLocaleString('pt-PT', {minimumFractionDigits:2})} {moeda.split(' ')[1]}
                  </p>
                </div>
              )}

              {erro && (
                <p className="text-[12px] text-red-500 bg-red-50 border border-red-100
                  rounded-xl px-4 py-3">{erro}</p>
              )}

              <button onClick={confirmar}
                className="w-full bg-brand-400 text-white font-medium text-[15px]
                  py-[13px] rounded-xl active:scale-[0.98] transition-all">
                Adicionar ao portfólio
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default function Portfolio() {
  const [filtro,       setFiltro]       = useState<Filtro>('Todos')
  const [modalAberto,  setModalAberto]  = useState(false)
  const [posicoes,     setPosicoes]     = useState<Posicao[]>([])
  const [carregando,   setCarregando]   = useState(true)

  useEffect(() => {
    carregarPosicoes()
  }, [])

  async function carregarPosicoes() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('posicoes')
      .select('*')
      .order('criado_em', { ascending: false })
    if (!error && data) setPosicoes(data)
    setCarregando(false)
  }

  async function adicionarPosicao(nova: Omit<Posicao, 'id'>) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    const existente = posicoes.find(p => p.ticker === nova.ticker)
    if (existente) {
      const totalUnid = existente.unidades + nova.unidades
      const pmMedio   = (existente.preco_medio * existente.unidades + nova.preco_medio * nova.unidades) / totalUnid
      const { data } = await supabase
        .from('posicoes')
        .update({ unidades: totalUnid, preco_medio: pmMedio })
        .eq('id', existente.id)
        .select()
        .single()
      if (data) setPosicoes(prev => prev.map(p => p.id === existente.id ? data : p))
    } else {
      const { data } = await supabase
        .from('posicoes')
        .insert({ ...nova, user_id: session.user.id })
        .select()
        .single()
      if (data) setPosicoes(prev => [data, ...prev])
    }
  }

  const filtradas = posicoes.filter(p => {
    if (filtro === 'Todos') return true
    if (filtro === 'ETFs')  return p.tipo === 'ETF'
    if (filtro === 'Ações') return p.tipo === 'Ação'
    if (filtro === 'REITs') return p.tipo === 'REIT'
    return true
  })

  const melhor = posicoes.length >= 2
    ? [...posicoes].sort((a,b) => (b.preco_medio - a.preco_medio) / a.preco_medio - (a.preco_medio - b.preco_medio) / b.preco_medio)[0]
    : null
  const pior = posicoes.length >= 2
    ? [...posicoes].sort((a,b) => a.preco_medio - b.preco_medio)[0]
    : null

  return (
    <div className="pb-2">
      {modalAberto && (
        <AdicionarModal
          onClose={() => setModalAberto(false)}
          onAdd={adicionarPosicao}
        />
      )}

      <div className="bg-white px-5 pt-12 pb-3 flex justify-between items-center border-b border-stone-100">
        <p className="text-[17px] font-semibold text-stone-900">Portfólio</p>
        <button onClick={() => setModalAberto(true)}
          className="flex items-center gap-1.5 bg-brand-50 border border-brand-100
            rounded-full px-3 py-1.5 text-[12px] text-brand-800 font-medium
            active:scale-[0.97] transition-transform">
          <Plus size={13} strokeWidth={2.5} />Adicionar
        </button>
      </div>

      <div className="px-4 pt-4 space-y-3">
        <div className="flex gap-2">
          {(['Todos','ETFs','Ações','REITs'] as Filtro[]).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-full text-[12px] border transition-colors
                ${filtro === f
                  ? 'bg-brand-50 border-brand-400 text-brand-800 font-medium'
                  : 'bg-white border-stone-200 text-stone-600'}`}>
              {f}
            </button>
          ))}
        </div>

        {carregando ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
            <p className="text-[14px] text-stone-400">A carregar...</p>
          </div>
        ) : filtradas.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
            <p className="text-[14px] text-stone-500 mb-1">
              {filtro === 'Todos' ? 'Ainda não tens posições.' : `Sem posições do tipo ${filtro}.`}
            </p>
            {filtro === 'Todos' && (
              <button onClick={() => setModalAberto(true)}
                className="text-[13px] text-brand-600 font-medium mt-1">
                + Adicionar a primeira posição
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            {filtradas.map((p, i) => (
              <div key={p.id ?? p.ticker}
                className={`flex items-center gap-3 px-4 py-3
                  ${i < filtradas.length - 1 ? 'border-b border-stone-100' : ''}`}>
                <div className="w-9 h-9 rounded-[9px] bg-stone-50 border border-stone-200
                  flex items-center justify-center flex-shrink-0
                  text-[10px] font-semibold text-stone-600">
                  {p.ticker.slice(0,4)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-stone-900 truncate">{p.nome}</p>
                  <p className="text-[11px] text-stone-400">{p.unidades} un · PM {fmt(p.preco_medio)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[13px] font-medium text-stone-900">
                    {fmt(p.preco_medio * p.unidades)}
                  </p>
                  <p className="text-[11px] text-stone-400">{p.moeda}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {posicoes.length >= 2 && melhor && pior && (
          <div className="bg-white rounded-2xl border border-stone-200 p-4">
            <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-3">Performance</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-stone-50 rounded-xl p-3">
                <p className="text-[11px] text-stone-500 mb-1">Maior posição</p>
                <p className="text-[14px] font-semibold text-brand-600">{melhor.ticker}</p>
              </div>
              <div className="bg-stone-50 rounded-xl p-3">
                <p className="text-[11px] text-stone-500 mb-1">Menor posição</p>
                <p className="text-[14px] font-semibold text-stone-600">{pior.ticker}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-3">Por setor</p>
          {setores.map(s => (
            <div key={s.nome} className="flex items-center gap-3 mb-2 last:mb-0">
              <p className="text-[12px] text-stone-600 w-24 flex-shrink-0">{s.nome}</p>
              <div className="flex-1 h-[13px] bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-400 rounded-full" style={{ width: `${s.pct}%` }} />
              </div>
              <p className="text-[12px] text-stone-600 w-8 text-right">{s.pct}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

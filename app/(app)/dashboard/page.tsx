'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Bell, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { recomendacoes } from '@/lib/mock-data'

/* ─── Tipos ─── */
type Transacao = { ticker:string; unidades:number; preco_medio:number; tipo:string; data_compra?:string }
type Cotacao   = { preco:number; variacaoPct:number; bandeira:string }
type PosicaoAgregada = { ticker:string; tipo:string; unidades:number; preco_medio:number }

/* ─── Helpers ─── */
function fmt(n:number, casas=2) { return n.toLocaleString('pt-PT',{minimumFractionDigits:casas,maximumFractionDigits:casas}) }
function fmtEur(n:number) { return '€'+fmt(n) }
function getIniciais(nome:string,apelido:string) { return ((nome?.[0]??'')+(apelido?.[0]??'')).toUpperCase()||'?' }

function agregarPosicoes(transacoes:Transacao[]): PosicaoAgregada[] {
  const mapa = new Map<string,PosicaoAgregada>()
  for (const t of transacoes) {
    const ex = mapa.get(t.ticker)
    if (!ex) { mapa.set(t.ticker,{ticker:t.ticker,tipo:t.tipo,unidades:t.unidades,preco_medio:t.preco_medio}) }
    else {
      const novas = ex.unidades+t.unidades
      if (novas<=0) { mapa.delete(t.ticker) }
      else { mapa.set(t.ticker,{...ex,unidades:novas,preco_medio:(ex.preco_medio*ex.unidades+t.preco_medio*t.unidades)/novas}) }
    }
  }
  return Array.from(mapa.values()).filter(p=>p.unidades>0)
}

/* Calcula alocação por tipo */
function calcAlocacao(posicoes:PosicaoAgregada[], cotacoes:Record<string,Cotacao>) {
  const totais: Record<string,number> = {}
  let total = 0
  for (const p of posicoes) {
    const preco = cotacoes[p.ticker]?.preco ?? p.preco_medio
    const valor = preco * p.unidades
    totais[p.tipo] = (totais[p.tipo]??0) + valor
    total += valor
  }
  const CORES: Record<string,string> = { 'ETF':'#1D9E75','Ação':'#378ADD','REIT':'#EF9F27' }
  return Object.entries(totais).map(([tipo,valor])=>({
    nome: tipo+'s', valor: total>0?Math.round((valor/total)*100):0, cor: CORES[tipo]??'#D3D1C7'
  }))
}

const TIME_TABS = ['1M','3M','6M','1A','Tudo']

function MetricCard({ label,value,sub,green,red }: { label:string;value:string;sub?:string;green?:boolean;red?:boolean }) {
  return (
    <div className="bg-stone-50 rounded-xl p-3">
      <p className="text-[11px] text-stone-500 mb-1">{label}</p>
      <p className={`text-[16px] font-semibold ${green?'text-brand-600':red?'text-red-500':'text-stone-900'}`}>{value}</p>
      {sub&&<p className="text-[11px] text-stone-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [nomeCompleto,   setNomeCompleto]   = useState('')
  const [iniciais,       setIniciais]       = useState('...')
  const [transacoes,     setTransacoes]     = useState<Transacao[]>([])
  const [cotacoes,       setCotacoes]       = useState<Record<string,Cotacao>>({})
  const [carregando,     setCarregando]     = useState(true)
  const riscos        = recomendacoes.filter(r=>r.tipo==='risco')
  const oportunidades = recomendacoes.filter(r=>r.tipo==='oportunidade')

  useEffect(()=>{
    async function load() {
      const {data:{session}} = await supabase.auth.getSession()
      if (!session?.user) { router.push('/login'); return }

      // Perfil
      const {data:perfil} = await supabase.from('perfis').select('nome,apelido').eq('id',session.user.id).single()
      const nome    = perfil?.nome    ?? session.user.user_metadata?.nome    ?? ''
      const apelido = perfil?.apelido ?? session.user.user_metadata?.apelido ?? ''
      setNomeCompleto(`${nome} ${apelido}`.trim() || session.user.email?.split('@')[0] || '?')
      setIniciais(getIniciais(nome,apelido))

      // Transações
      const {data:trans} = await supabase.from('posicoes').select('*').order('data_compra',{ascending:true})
      if (trans) {
        setTransacoes(trans as Transacao[])
        // Buscar cotações
        const tickers = (trans as Transacao[]).map(t=>t.ticker).filter((t,i,a)=>a.indexOf(t)===i)
        const novas:Record<string,Cotacao>={}
        await Promise.all(tickers.map(async ticker=>{
          try { const r=await fetch(`/api/cotacao?ticker=${encodeURIComponent(ticker)}`); if(r.ok) novas[ticker]=await r.json() } catch{}
        }))
        setCotacoes(novas)
      }
      setCarregando(false)
    }
    load()
  },[router])

  /* Calcular métricas reais */
  const posicoes      = agregarPosicoes(transacoes)
  const totalInvestido= transacoes.filter(t=>t.unidades>0).reduce((s,t)=>s+t.unidades*t.preco_medio,0)
  const valorAtual    = posicoes.reduce((s,p)=>{
    const preco = cotacoes[p.ticker]?.preco ?? p.preco_medio
    return s + preco * p.unidades
  },0)
  const ganhoTotal    = valorAtual - posicoes.reduce((s,p)=>s+p.preco_medio*p.unidades,0)
  const ganhoPercent  = posicoes.reduce((s,p)=>s+p.preco_medio*p.unidades,0) > 0
    ? (ganhoTotal / posicoes.reduce((s,p)=>s+p.preco_medio*p.unidades,0)) * 100 : 0
  const positivo      = ganhoTotal >= 0
  const alocacao      = calcAlocacao(posicoes, cotacoes)

  /* Gráfico — evolução simples baseada nas datas de compra */
  const evolucaoGrafico = (() => {
    if (transacoes.length === 0) return []
    const ordenadas = [...transacoes].sort((a,b)=>(a.data_compra??'')<(b.data_compra??'')?-1:1)
    const pontos: {mes:string;investido:number;atual:number}[] = []
    let investidoAcum = 0
    const mesesVistos = new Set<string>()
    for (const t of ordenadas) {
      if (!t.data_compra) continue
      const d = new Date(t.data_compra)
      const mes = d.toLocaleDateString('pt-PT',{month:'short',year:'2-digit'})
      investidoAcum += t.unidades * t.preco_medio
      if (!mesesVistos.has(mes)) {
        mesesVistos.add(mes)
        pontos.push({ mes, investido: Math.round(investidoAcum), atual: Math.round(investidoAcum) })
      } else {
        const ultimo = pontos[pontos.length-1]
        if (ultimo) ultimo.investido = Math.round(investidoAcum)
      }
    }
    // Último ponto com valor atual real
    if (pontos.length > 0) pontos[pontos.length-1].atual = Math.round(valorAtual)
    return pontos
  })()

  return (
    <div className="pb-2">
      <div className="bg-white px-5 pt-12 pb-3 flex justify-between items-center border-b border-stone-100">
        <div>
          <p className="text-[12px] text-stone-500">Bom dia,</p>
          <p className="text-[17px] font-semibold text-stone-900">{nomeCompleto||'...'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={()=>router.push('/notificacoes')} className="relative w-9 h-9 flex items-center justify-center">
            <Bell size={22} strokeWidth={1.75} color="#5F5E5A"/>
            <span className="absolute top-0.5 right-0.5 w-[7px] h-[7px] bg-red-500 rounded-full"/>
          </button>
          <button onClick={()=>router.push('/perfil')}
            className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center text-[12px] font-semibold text-brand-800">
            {iniciais}
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">

        {/* Valor hero + gráfico */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-[12px] text-stone-500 mb-1">Valor atual da carteira</p>
          {carregando ? (
            <div className="h-8 bg-stone-100 rounded-lg animate-pulse mb-2"/>
          ) : (
            <>
              <p className="text-[28px] font-bold text-stone-900 leading-none mb-1">{fmtEur(valorAtual)}</p>
              <div className={`flex items-center gap-1 text-[13px] mb-4 ${positivo?'text-brand-600':'text-red-500'}`}>
                {positivo?<TrendingUp size={14} strokeWidth={2}/>:<TrendingDown size={14} strokeWidth={2}/>}
                <span>{positivo?'+':''}{fmtEur(ganhoTotal)} ({positivo?'+':''}{fmt(ganhoPercent)}%)</span>
              </div>
            </>
          )}
          <div className="flex gap-1 mb-3">
            {TIME_TABS.map(t=>(
              <button key={t} className={`flex-1 text-[11px] py-[5px] rounded-md transition-colors
                ${t==='Tudo'?'bg-brand-50 text-brand-800 font-medium':'text-stone-500 hover:bg-stone-50'}`}>{t}</button>
            ))}
          </div>
          {evolucaoGrafico.length > 1 ? (
            <ResponsiveContainer width="100%" height={90}>
              <AreaChart data={evolucaoGrafico} margin={{top:4,right:0,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="gradAtual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#1D9E75" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#1D9E75" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="mes" hide/>
                <YAxis domain={['dataMin - 100','dataMax + 100']} hide/>
                <Tooltip contentStyle={{fontSize:11,borderRadius:8,border:'0.5px solid #E8E6E0'}} formatter={(v:number)=>[fmtEur(v),'']}/>
                <Area type="monotone" dataKey="investido" stroke="#D3D1C7" strokeWidth={1} strokeDasharray="4 3" fill="none" dot={false}/>
                <Area type="monotone" dataKey="atual"     stroke="#1D9E75" strokeWidth={2} fill="url(#gradAtual)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[90px] flex items-center justify-center">
              <p className="text-[12px] text-stone-400">Adiciona posições para ver o gráfico</p>
            </div>
          )}
        </div>

        {/* Métricas reais */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-3">Resumo</p>
          {carregando ? (
            <div className="grid grid-cols-2 gap-2">
              {[0,1,2,3].map(i=><div key={i} className="h-16 bg-stone-100 rounded-xl animate-pulse"/>)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <MetricCard label="Total investido"  value={fmtEur(totalInvestido)}/>
              <MetricCard label="Ganho total"       value={(positivo?'+':'')+fmtEur(ganhoTotal)} sub={(positivo?'+':'')+fmt(ganhoPercent)+'%'} green={positivo} red={!positivo}/>
              <MetricCard label="Posições abertas" value={String(posicoes.length)}/>
              <MetricCard label="Valor atual"       value={fmtEur(valorAtual)} green={positivo}/>
            </div>
          )}
        </div>

        {/* Alocação real */}
        {alocacao.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-200 p-4">
            <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-3">Alocação</p>
            <div className="flex items-center gap-4">
              <div className="relative w-[72px] h-[72px] flex-shrink-0">
                <svg viewBox="0 0 36 36" className="rotate-[-90deg]">
  {alocacao.reduce<{ els: React.ReactElement[]; offset: number }>(
    (acc, a) => {
      const d = (a.valor / 100) * 100
      acc.els.push(
        <circle
          key={a.nome}
          cx="18" cy="18" r="15.9"
          fill="none"
          stroke={a.cor}
          strokeWidth="4"
          strokeDasharray={`${d} ${100 - d}`}
          strokeDashoffset={-acc.offset}
        />
      )
      acc.offset += d
      return acc
    },
    { els: [], offset: 0 }
  ).els}
</svg>
              </div>
              <div className="flex flex-col gap-[5px]">
                {alocacao.map(a=>(
                  <div key={a.nome} className="flex items-center gap-2 text-[12px]">
                    <div className="w-2 h-2 rounded-full" style={{background:a.cor}}/>
                    <span className="text-stone-600">{a.nome}</span>
                    <span className="font-medium text-stone-900 ml-auto">{a.valor}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recomendações */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-[26px] h-[26px] bg-brand-400 rounded-[8px] flex items-center justify-center">
                <span className="text-white text-[13px]">✦</span>
              </div>
              <p className="text-[13px] font-medium text-stone-900">Recomendações para ti</p>
            </div>
            <button onClick={()=>router.push('/para-ti')} className="flex items-center gap-0.5 text-[12px] text-brand-600 font-medium">
              ver todas <ChevronRight size={13}/>
            </button>
          </div>
          {[...riscos.slice(0,1),...oportunidades.slice(0,1)].map(r=>(
            <button key={r.id} onClick={()=>router.push('/para-ti')}
              className={`w-full text-left rounded-xl p-3 mb-2 last:mb-0 flex gap-3 items-start border
                ${r.tipo==='risco'?'bg-amber-50 border-amber-200':'bg-brand-50 border-brand-100'}`}>
              <span className="text-[16px] mt-0.5">{r.tipo==='risco'?'⚠':'💡'}</span>
              <div>
                <p className={`text-[12px] font-medium ${r.tipo==='risco'?'text-amber-800':'text-brand-800'}`}>{r.titulo}</p>
                <p className={`text-[11px] mt-0.5 ${r.tipo==='risco'?'text-amber-700':'text-brand-600'}`}>{r.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

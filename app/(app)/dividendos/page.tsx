'use client'

import { useRouter } from 'next/navigation'
import { BarChart2, History, Coins } from 'lucide-react'
import { dividendos, dividendosMensais, proximosPagamentos } from '@/lib/mock-data'
import { PageHeader } from '@/components/PageHeader'

const DIAS_JUNHO = Array.from({ length: 30 }, (_, i) => i + 1)
const EX_DIVIDEND = [9, 18]
const PAGAMENTO   = [15, 22]
const HOJE        = 10
const OFFSET      = 6 // Junho começa a sábado (offset 0=Dom)

function fmt(n: number) {
  return n.toLocaleString('pt-PT', { minimumFractionDigits: 2 }) + ' €'
}

const maxVal = Math.max(...dividendosMensais.map(d => d.val))

export default function Dividendos() {
  const router = useRouter()
  return (
    <div className="pb-2">
      {/* Top bar */}
      <PageHeader title="Dividendos" />

      {/* Abas (submenu do portfólio) */}
      <div className="bg-white px-5 pb-2 border-b border-stone-100">
        <div className="flex gap-1">
          <button onClick={()=>router.push('/portfolio')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] border transition-colors bg-white border-stone-200 text-stone-600">
            <BarChart2 size={12}/>Posições
          </button>
          <button onClick={()=>router.push('/portfolio')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] border transition-colors bg-white border-stone-200 text-stone-600">
            <History size={12}/>Histórico
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] border transition-colors bg-brand-50 border-brand-400 text-brand-800 font-medium">
            <Coins size={12}/>Dividendos
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">

        {/* Resumo */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-3">Resumo</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Este mês', value: fmt(dividendos.esteMes), green: true },
              { label: 'Este ano',  value: fmt(dividendos.esteAno),  green: true },
              { label: 'Yield on Cost', value: '2,6%', green: false },
            ].map(m => (
              <div key={m.label} className="bg-stone-50 rounded-xl p-3">
                <p className="text-[10px] text-stone-500 mb-1">{m.label}</p>
                <p className={`text-[14px] font-semibold ${m.green ? 'text-brand-600' : 'text-stone-900'}`}>
                  {m.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Previsão mensal */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-3">
            Previsão mensal
          </p>
          <div className="space-y-[6px]">
            {dividendosMensais.map(d => (
              <div key={d.mes} className="flex items-center gap-3">
                <p className="text-[11px] text-stone-500 w-7">{d.mes}</p>
                <div className="flex-1 h-[13px] bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-400 rounded-full"
                    style={{ width: `${(d.val / maxVal) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-stone-600 w-12 text-right">{d.val} €</p>
              </div>
            ))}
          </div>
        </div>

        {/* Calendário */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-3">
            Calendário — Junho
          </p>
          <div className="grid grid-cols-7 gap-[3px] mb-3">
            {['S','T','Q','Q','S','S','D'].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-medium text-stone-400 py-1">{d}</div>
            ))}
            {Array.from({ length: OFFSET }).map((_, i) => <div key={`e${i}`} />)}
            {DIAS_JUNHO.map(dia => {
              const isEx  = EX_DIVIDEND.includes(dia)
              const isPay = PAGAMENTO.includes(dia)
              const isHoje= dia === HOJE
              return (
                <div key={dia}
                  className={`text-center text-[11px] py-[5px] rounded-md font-medium
                    ${isEx  ? 'bg-amber-100 text-amber-800'     :
                      isPay ? 'bg-brand-50 text-brand-800'      :
                      isHoje? 'border border-brand-400 text-stone-900' :
                              'text-stone-600'}`}>
                  {dia}
                </div>
              )
            })}
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
              <div className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-300" />
              Ex-dividend
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
              <div className="w-3 h-3 rounded-sm bg-brand-50 border border-brand-200" />
              Pagamento
            </div>
          </div>
        </div>

        {/* Próximos pagamentos */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-3">
            Próximos pagamentos
          </p>
          {proximosPagamentos.map((p, i) => (
            <div key={p.ticker}
              className={`flex items-center gap-3 py-3
                ${i < proximosPagamentos.length - 1 ? 'border-b border-stone-100' : ''}`}>
              <div className="w-9 h-9 rounded-[9px] bg-stone-50 border border-stone-200
                flex items-center justify-center text-[10px] font-semibold text-stone-600 flex-shrink-0">
                {p.ticker}
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-stone-900">{p.nome}</p>
                <p className="text-[11px] text-stone-400">Pagamento: {p.data}</p>
              </div>
              <p className="text-[14px] font-semibold text-brand-600">+{fmt(p.valor)}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

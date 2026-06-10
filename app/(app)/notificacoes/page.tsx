'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Coins, AlertTriangle, Trophy, TrendingUp, Calendar } from 'lucide-react'
import { notificacoes } from '@/lib/mock-data'

type Filtro = 'Todas' | 'Dividendos' | 'Alertas' | 'Plano'

const ICON_MAP: Record<string, React.ElementType> = {
  dividendo: Coins, alerta: AlertTriangle, objetivo: Trophy,
  historico: TrendingUp, calendario: Calendar,
}
const BG_MAP: Record<string, string> = {
  dividendo: '#E1F5EE', alerta: '#FAEEDA', objetivo: '#E1F5EE',
  historico: '#F7F6F2', calendario: '#EEF4FC',
}
const COLOR_MAP: Record<string, string> = {
  dividendo: '#0F6E56', alerta: '#854F0B', objetivo: '#0F6E56',
  historico: '#888780', calendario: '#185FA5',
}

export default function Notificacoes() {
  const router  = useRouter()
  const [filtro, setFiltro] = useState<Filtro>('Todas')

  const filtradas = notificacoes.filter(n => {
    if (filtro === 'Todas')     return true
    if (filtro === 'Dividendos')return n.tipo === 'dividendo'
    if (filtro === 'Alertas')   return n.tipo === 'alerta'
    if (filtro === 'Plano')     return n.tipo === 'objetivo'
    return true
  })

  const hoje   = filtradas.filter(n => ['n1','n2','n3'].includes(n.id))
  const semana = filtradas.filter(n => ['n4','n5','n6'].includes(n.id))

  function NotifRow({ n }: { n: typeof notificacoes[0] }) {
    const Icon = ICON_MAP[n.tipo] ?? Coins
    return (
      <div className={`flex items-start gap-3 py-3 border-b border-stone-100 last:border-0
        ${n.lida ? 'opacity-60' : ''}`}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: BG_MAP[n.tipo] }}>
          <Icon size={18} strokeWidth={1.75} color={COLOR_MAP[n.tipo]} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-stone-900">{n.titulo}</p>
          <p className="text-[12px] text-stone-500 mt-0.5 leading-relaxed">{n.desc}</p>
          <p className="text-[11px] text-stone-400 mt-1">{n.tempo}</p>
        </div>
        {!n.lida && (
          <div className="w-2 h-2 rounded-full bg-brand-400 flex-shrink-0 mt-1.5" />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Top bar */}
      <div className="bg-white px-5 pt-12 pb-3 flex justify-between items-center border-b border-stone-100">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center">
            <ArrowLeft size={20} strokeWidth={1.75} color="#888780" />
          </button>
          <p className="text-[17px] font-semibold text-stone-900">Notificações</p>
        </div>
        <button className="text-[12px] text-brand-600 font-medium">Marcar tudo lido</button>
      </div>

      <div className="px-4 pt-4 space-y-3">

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['Todas','Dividendos','Alertas','Plano'] as Filtro[]).map(f => (
            <button key={f}
              onClick={() => setFiltro(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] border transition-colors
                ${filtro === f
                  ? 'bg-brand-50 border-brand-400 text-brand-800 font-medium'
                  : 'bg-white border-stone-200 text-stone-600'}`}>
              {f}
            </button>
          ))}
        </div>

        {hoje.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-200 p-4">
            <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-2">Hoje</p>
            {hoje.map(n => <NotifRow key={n.id} n={n} />)}
          </div>
        )}

        {semana.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-200 p-4">
            <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-2">Esta semana</p>
            {semana.map(n => <NotifRow key={n.id} n={n} />)}
          </div>
        )}

      </div>
    </div>
  )
}

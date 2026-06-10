'use client'

import { recomendacoes } from '@/lib/mock-data'

type Tipo = 'risco' | 'oportunidade' | 'info'

const PERGUNTAS = [
  'Estou exposto demais a tecnologia?',
  'Posso reformar-me com esta carteira?',
  'Quanto devo investir por mês?',
  'Devo vender alguma posição?',
]

const TIPO_CONFIG: Record<Tipo, { bg: string; border: string; iconBg: string; titleColor: string; subColor: string; tagBg: string; tagText: string; label: string }> = {
  risco:       { bg: '#FFF8F0', border: '#FAC775', iconBg: '#FAEEDA', titleColor: '#633806', subColor: '#854F0B', tagBg: '#FAEEDA', tagText: '#633806', label: 'Riscos' },
  oportunidade:{ bg: '#F0FBF7', border: '#9FE1CB', iconBg: '#E1F5EE', titleColor: '#085041', subColor: '#0F6E56', tagBg: '#E1F5EE', tagText: '#085041', label: 'Oportunidades' },
  info:        { bg: '#EEF4FC', border: '#B5D4F4', iconBg: '#E6F1FB', titleColor: '#0C447C', subColor: '#185FA5', tagBg: '#E6F1FB', tagText: '#0C447C', label: 'Informação' },
}

const TIPO_ICON: Record<Tipo, string> = {
  risco: '⚠', oportunidade: '💡', info: 'ℹ',
}

const GRUPOS: Tipo[] = ['risco', 'oportunidade', 'info']

export default function ParaTi() {
  return (
    <div className="pb-2">
      {/* Top bar */}
      <div className="bg-white px-5 pt-12 pb-3 flex justify-between items-center border-b border-stone-100">
        <p className="text-[17px] font-semibold text-stone-900">Para ti</p>
        <div className="bg-brand-50 border border-brand-100 rounded-full px-3 py-1
          text-[12px] text-brand-800 font-medium">
          {recomendacoes.length} recomendações
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">

        {/* Tags resumo */}
        <div className="flex gap-2 flex-wrap">
          {GRUPOS.map(tipo => {
            const c = TIPO_CONFIG[tipo]
            const count = recomendacoes.filter(r => r.tipo === tipo).length
            return (
              <div key={tipo}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium"
                style={{ background: c.tagBg, color: c.tagText }}>
                <span>{TIPO_ICON[tipo]}</span>
                {c.label} ({count})
              </div>
            )
          })}
        </div>

        {/* Grupos */}
        {GRUPOS.map(tipo => {
          const items = recomendacoes.filter(r => r.tipo === tipo)
          if (!items.length) return null
          const c = TIPO_CONFIG[tipo]
          return (
            <div key={tipo} className="bg-white rounded-2xl border border-stone-200 p-4">
              <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-3">
                {c.label}
              </p>
              <div className="space-y-3">
                {items.map(r => (
                  <div key={r.id}
                    className="rounded-xl p-3 border"
                    style={{ background: c.bg, borderColor: c.border }}>
                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0"
                        style={{ background: c.iconBg }}>
                        <span className="text-[15px]">{TIPO_ICON[tipo]}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-medium" style={{ color: c.titleColor }}>
                          {r.titulo}
                        </p>
                        <p className="text-[12px] mt-1 leading-relaxed" style={{ color: c.subColor }}>
                          {r.desc}
                        </p>
                        {r.sugestao && (
                          <div className="mt-2 rounded-lg px-3 py-2 text-[12px] leading-relaxed"
                            style={{ background: 'rgba(255,255,255,0.6)', color: c.titleColor }}>
                            <strong>Sugestão:</strong> {r.sugestao}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Perguntas rápidas */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-3">
            Perguntas rápidas
          </p>
          <div className="space-y-2">
            {PERGUNTAS.map(q => (
              <button key={q}
                className="w-full text-left flex items-center justify-between gap-3
                  bg-stone-50 rounded-xl px-4 py-3 active:bg-stone-100 transition-colors">
                <span className="text-[13px] text-stone-900">{q}</span>
                <span className="text-brand-400 text-[14px] flex-shrink-0">›</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

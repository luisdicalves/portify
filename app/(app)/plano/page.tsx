'use client'

import { useState } from 'react'
import type { Periodo } from '@/lib/onboarding-context'

/* ─── Dados de configuração ─── */

const BUDGETS = [100, 250, 300, 500, 1000]

const PERIODOS: { label: string; value: Periodo; multMensal: number }[] = [
  { label: 'Semanal',    value: 'semanal',    multMensal: 4      },
  { label: 'Quinzenal',  value: 'quinzenal',  multMensal: 2      },
  { label: 'Mensal',     value: 'mensal',     multMensal: 1      },
  { label: 'Trimestral', value: 'trimestral', multMensal: 1/3    },
  { label: 'Semestral',  value: 'semestral',  multMensal: 1/6    },
  { label: 'Anual',      value: 'anual',      multMensal: 1/12   },
]

const HORIZONTES: { label: string; value: string; anos: number }[] = [
  { label: '< 2 anos',   value: '2anos',  anos: 2  },
  { label: '2–5 anos',   value: '2a5',    anos: 5  },
  { label: '5–10 anos',  value: '5a10',   anos: 10 },
  { label: '> 10 anos',  value: '10mais', anos: 20 },
]

/* ─── Helpers ─── */

function calcFV(pmtMensal: number, anos: number, r: number) {
  const n  = anos * 12
  const rm = r / 12
  if (rm === 0) return Math.round(pmtMensal * n)
  return Math.round(pmtMensal * ((Math.pow(1 + rm, n) - 1) / rm))
}

function fmt(n: number) {
  return n.toLocaleString('pt-PT') + ' €'
}

/* ─── Chip local (não usa o global para ter controlo total do estilo) ─── */
function Chip({ label, selected, onClick }: {
  label: string; selected: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-[7px] rounded-full text-[13px] border transition-all duration-150
        ${selected
          ? 'bg-brand-50 border-brand-400 text-brand-800 font-medium'
          : 'bg-stone-50 border-stone-300 text-stone-600 active:bg-stone-100'
        }`}
    >
      {label}
    </button>
  )
}

/* ─── Campo inline para valor personalizado ─── */
function CampoPersonalizado({ value, onChange, placeholder, unidade }: {
  value: string; onChange: (v: string) => void
  placeholder: string; unidade?: string
}) {
  return (
    <div className="mt-2 flex items-center gap-2 bg-stone-50 border border-brand-400
      rounded-xl px-4 py-[10px] focus-within:ring-2 focus-within:ring-brand-200 transition-all">
      {unidade && <span className="text-[14px] text-stone-400 flex-shrink-0">{unidade}</span>}
      <input
        autoFocus
        type="number"
        inputMode="decimal"
        min="0"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 bg-transparent text-[16px] font-medium text-stone-900
          placeholder:text-stone-300 focus:outline-none min-w-0"
      />
    </div>
  )
}

/* ─── Página ─── */

export default function Plano() {
  /* Investimento */
  const [investPreset,   setInvestPreset]   = useState<number | null>(300)
  const [investCustom,   setInvestCustom]   = useState('')
  const [investPersonal, setInvestPersonal] = useState(false)

  /* Periodicidade */
  const [periodo, setPeriodo] = useState<Periodo>('mensal')

  /* Horizonte */
  const [horizontePreset,   setHorizontePreset]   = useState<string | null>('10mais')
  const [horizonteCustom,   setHorizonteCustom]   = useState('')
  const [horizontePersonal, setHorizontePersonal] = useState(false)

  /* Valores efectivos */
  const investValor = investPersonal
    ? (parseFloat(investCustom.replace(',', '.')) || 0)
    : (investPreset ?? 0)

  const anosValor = horizontePersonal
    ? (parseInt(horizonteCustom) || 0)
    : (HORIZONTES.find(h => h.value === horizontePreset)?.anos ?? 20)

  const multMensal = PERIODOS.find(p => p.value === periodo)?.multMensal ?? 1
  const pmtMensal  = investValor * multMensal

  const min = calcFV(pmtMensal, anosValor, 0.08)
  const max = calcFV(pmtMensal, anosValor, 0.11)

  const meta    = 100000
  const atual   = 28540
  const progPct = Math.min(Math.round((atual / meta) * 100), 100)

  const periodoLabel = PERIODOS.find(p => p.value === periodo)?.label.toLowerCase() ?? periodo
  const projecaoValida = investValor > 0 && anosValor > 0

  /* Handlers */
  function selectBudget(v: number) {
    setInvestPreset(v)
    setInvestPersonal(false)
    setInvestCustom('')
  }

  function togglePersonalInvest() {
    setInvestPersonal(p => {
      if (!p) setInvestPreset(null)
      else     setInvestPreset(300)
      return !p
    })
    setInvestCustom('')
  }

  function selectHorizonte(v: string) {
    setHorizontePreset(v)
    setHorizontePersonal(false)
    setHorizonteCustom('')
  }

  function togglePersonalHorizonte() {
    setHorizontePersonal(p => {
      if (!p) setHorizontePreset(null)
      else     setHorizontePreset('10mais')
      return !p
    })
    setHorizonteCustom('')
  }

  return (
    <div className="pb-2">

      {/* Top bar */}
      <PageHeader title="Plano de investimento" />

      <div className="px-4 pt-4 space-y-3">

        {/* ── Objetivo ── */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-3">Objetivo</p>
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-[11px] text-stone-400">Atual</p>
              <p className="text-[20px] font-bold text-stone-900">{fmt(atual)}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-stone-400">Objetivo</p>
              <p className="text-[20px] font-bold text-stone-900">{fmt(meta)}</p>
            </div>
          </div>
          <div className="h-[9px] bg-stone-100 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-brand-400 rounded-full transition-all"
              style={{ width: `${progPct}%` }} />
          </div>
          <div className="flex justify-between">
            <p className="text-[12px] text-brand-600 font-medium">{progPct}% concluído</p>
            <p className="text-[12px] text-stone-400">{fmt(meta - atual)} em falta</p>
          </div>
        </div>

        {/* ── Configuração ── */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-5">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">Configuração</p>

          {/* Investimento por período */}
          <div>
            <p className="text-[12px] font-medium text-stone-500 mb-2">Investimento por período</p>
            <div className="flex flex-wrap gap-2">
              {BUDGETS.map(b => (
                <Chip key={b}
                  label={`${b.toLocaleString('pt-PT')} €`}
                  selected={!investPersonal && investPreset === b}
                  onClick={() => selectBudget(b)}
                />
              ))}
              <Chip
                label="Personalizado"
                selected={investPersonal}
                onClick={togglePersonalInvest}
              />
            </div>
            {investPersonal && (
              <CampoPersonalizado
                value={investCustom}
                onChange={setInvestCustom}
                placeholder="Ex: 450"
                unidade="€"
              />
            )}
          </div>

          {/* Periodicidade */}
          <div>
            <p className="text-[12px] font-medium text-stone-500 mb-2">Periodicidade</p>
            <div className="flex flex-wrap gap-2">
              {PERIODOS.map(p => (
                <Chip key={p.value} label={p.label}
                  selected={periodo === p.value}
                  onClick={() => setPeriodo(p.value)}
                />
              ))}
            </div>
          </div>

          {/* Horizonte temporal */}
          <div>
            <p className="text-[12px] font-medium text-stone-500 mb-2">Horizonte temporal</p>
            <div className="flex flex-wrap gap-2">
              {HORIZONTES.map(h => (
                <Chip key={h.value} label={h.label}
                  selected={!horizontePersonal && horizontePreset === h.value}
                  onClick={() => selectHorizonte(h.value)}
                />
              ))}
              <Chip
                label="Personalizado"
                selected={horizontePersonal}
                onClick={togglePersonalHorizonte}
              />
            </div>
            {horizontePersonal && (
              <CampoPersonalizado
                value={horizonteCustom}
                onChange={setHorizonteCustom}
                placeholder="Ex: 15"
                unidade="anos"
              />
            )}
          </div>
        </div>

        {/* ── Projeção IA ── */}
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
                Com <strong>{fmt(investValor)}/{periodoLabel}</strong> durante{' '}
                <strong>{anosValor} {anosValor === 1 ? 'ano' : 'anos'}</strong>, podes atingir entre
              </p>
              <p className="text-[24px] font-bold text-brand-800 mb-1">
                {fmt(min)} – {fmt(max)}
              </p>
              <p className="text-[12px] text-brand-400">com CAGR estimado entre 8% e 11%</p>
            </>
          ) : (
            <p className="text-[13px] text-brand-500 leading-relaxed">
              Preenche o investimento e o horizonte temporal para ver a projeção.
            </p>
          )}
        </div>

      </div>
    </div>
  )
}

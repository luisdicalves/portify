'use client'

import { Check } from 'lucide-react'
import { ReactNode } from 'react'

/* ── Botão primário ── */
export function BtnPrimary({
  children, onClick, disabled = false, className = '',
}: { children: ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full bg-brand-400 text-white font-medium text-[15px] py-[13px] rounded-xl
        active:scale-[0.98] transition-transform disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  )
}

/* ── Botão ghost ── */
export function BtnGhost({
  children, onClick, className = '',
}: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full bg-transparent border border-stone-300 text-stone-600 font-medium
        text-[14px] py-[11px] rounded-xl active:scale-[0.98] transition-transform ${className}`}
    >
      {children}
    </button>
  )
}

/* ── Dots de progresso ── */
export function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-[6px] mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-[6px] rounded-full transition-all duration-200 ${
            i === current
              ? 'w-[18px] bg-brand-400'
              : i < current
              ? 'w-[6px] bg-brand-100'
              : 'w-[6px] bg-stone-300'
          }`}
        />
      ))}
    </div>
  )
}

/* ── Barra de progresso ── */
export function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-[3px] bg-stone-200 rounded-full mb-6 overflow-hidden">
      <div
        className="h-full bg-brand-400 rounded-full transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/* ── Opção seleccionável ── */
export function OptionItem({
  title, subtitle, selected, onClick,
}: { title: string; subtitle?: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl px-4 py-3 border transition-all duration-150
        flex items-center justify-between gap-3
        ${selected
          ? 'bg-brand-50 border-brand-400'
          : 'bg-stone-50 border-stone-300 active:bg-stone-100'
        }`}
    >
      <div>
        <p className={`text-[14px] font-medium ${selected ? 'text-brand-800' : 'text-stone-900'}`}>
          {title}
        </p>
        {subtitle && (
          <p className={`text-[12px] mt-0.5 ${selected ? 'text-brand-600' : 'text-stone-500'}`}>
            {subtitle}
          </p>
        )}
      </div>
      <div className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0
        ${selected ? 'bg-brand-400 border-brand-400' : 'border-stone-300'}`}>
        {selected && <Check size={11} color="white" strokeWidth={3} />}
      </div>
    </button>
  )
}

/* ── Chip seleccionável ── */
export function Chip({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-full text-[13px] border transition-all duration-150
        ${selected
          ? 'bg-brand-50 border-brand-400 text-brand-800 font-medium'
          : 'bg-stone-50 border-stone-300 text-stone-600 active:bg-stone-100'
        }`}
    >
      {label}
    </button>
  )
}

/* ── Campo de texto ── */
export function Field({
  label, type = 'text', placeholder, value, onChange,
}: {
  label: string; type?: string; placeholder?: string
  value: string; onChange: (v: string) => void
}) {
  return (
    <div className="mb-[13px]">
      <label className="block text-[12px] font-medium text-stone-500 mb-[5px]">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-[13px] py-[11px]
          text-[14px] text-stone-900 placeholder:text-stone-400
          focus:outline-none focus:border-brand-400 transition-colors"
      />
    </div>
  )
}

/* ── Ecrã wrapper (telemóvel centrado) ── */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 flex items-start justify-center py-0 sm:py-8">
      <div className="w-full max-w-sm min-h-screen sm:min-h-0 bg-white sm:rounded-3xl
        sm:border sm:border-stone-200 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  )
}

/* ── Status bar simulada ── */
export function StatusBar() {
  return (
    <div className="flex justify-between items-center px-5 pt-3 pb-1 bg-white">
      <span className="text-[11px] text-stone-500">9:41</span>
      <div className="flex gap-1 items-center">
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <rect x="0" y="6" width="3" height="6" rx="1" fill="#888780"/>
          <rect x="4" y="4" width="3" height="8" rx="1" fill="#888780"/>
          <rect x="8" y="2" width="3" height="10" rx="1" fill="#888780"/>
          <rect x="12" y="0" width="3" height="12" rx="1" fill="#1D9E75"/>
        </svg>
      </div>
    </div>
  )
}

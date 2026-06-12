'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type RiskProfile  = 'conservador' | 'moderado' | 'arrojado' | 'muito-arrojado'
export type Experience   = 'iniciante' | 'intermedio' | 'avancado'
export type Objetivo     = 'independencia' | 'reforma' | 'rendimento' | 'crescimento'
export type Horizonte    = '2anos' | '2a5' | '5a10' | '10mais'
export type Periodo      = 'semanal' | 'quinzenal' | 'mensal' | 'trimestral' | 'semestral' | 'anual'
export type TipoAtivo    = 'acoes' | 'etfs' | 'reits' | 'cripto' | 'obrigacoes' | 'materias-primas'

interface OnboardingData {
  userId:       string
  nome:         string
  apelido:      string
  email:        string
  experience:   Experience  | null
  risk:         RiskProfile | null
  objetivo:     Objetivo    | null
  querPlano:    boolean | null
  metaEuros:    number
  investEuros:  number
  periodo:      Periodo
  horizonte:    Horizonte
  tiposAtivo:   TipoAtivo[]
  setores:      string[]
}

interface OnboardingContextType {
  data:   OnboardingData
  update: (partial: Partial<OnboardingData>) => void
}

const defaults: OnboardingData = {
  userId:       '',
  nome:         '',
  apelido:      '',
  email:        '',
  experience:   null,
  risk:         null,
  objetivo:     null,
  querPlano:    null,
  metaEuros:    100000,
  investEuros:  300,
  periodo:      'mensal',
  horizonte:    '10mais',
  tiposAtivo:   [],
  setores:      [],
}

const OnboardingContext = createContext<OnboardingContextType>({
  data:   defaults,
  update: () => {},
})

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaults)
  const update = (partial: Partial<OnboardingData>) =>
    setData(prev => ({ ...prev, ...partial }))
  return (
    <OnboardingContext.Provider value={{ data, update }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  return useContext(OnboardingContext)
}

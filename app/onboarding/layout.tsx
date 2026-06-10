import { OnboardingProvider } from '@/lib/onboarding-context'
import { ReactNode } from 'react'

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <OnboardingProvider>{children}</OnboardingProvider>
}

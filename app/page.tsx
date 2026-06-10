import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function Home() {
  // Verificação simples — o middleware trata da sessão
  // Por agora redireciona para onboarding e o dashboard verifica a sessão
  redirect('/onboarding')
}

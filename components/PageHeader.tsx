'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// Páginas onde o ícone de perfil NÃO aparece
const SEM_PERFIL = ['/perfil', '/definicoes']

interface PageHeaderProps {
  title?: string
  /** Se true, mostra saudação "Bom dia, Nome" (só no dashboard) */
  greeting?: boolean
  /** Se true, mostra botão de voltar atrás */
  back?: boolean
  /** Conteúdo extra à direita (ex: botão Adicionar) */
  right?: React.ReactNode
}

export function PageHeader({ title, greeting, back, right }: PageHeaderProps) {
  const router   = useRouter()
  const pathname = usePathname()

  const [iniciais,     setIniciais]     = useState('...')
  const [nomeCompleto, setNomeCompleto] = useState('')

  const mostrarPerfil = !SEM_PERFIL.some(p => pathname.startsWith(p))

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return
      supabase.from('perfis').select('nome,apelido').eq('id', session.user.id).single()
        .then(({ data }) => {
          if (data) {
            setNomeCompleto(`${data.nome} ${data.apelido}`.trim())
            setIniciais(`${data.nome?.[0] ?? ''}${data.apelido?.[0] ?? ''}`.toUpperCase())
          }
        })
    })
  }, [])

  // Calcular saudação
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 19 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="bg-white px-5 pt-12 pb-3 flex items-center border-b border-stone-100 min-h-[72px]">
      {/* Esquerda */}
      {back ? (
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center mr-2 flex-shrink-0">
          <ArrowLeft size={20} strokeWidth={1.75} color="#888780"/>
        </button>
      ) : null}

      <div className="flex-1 min-w-0">
        {greeting ? (
          <>
            <p className="text-[12px] text-stone-500">{saudacao},</p>
            <p className="text-[17px] font-semibold text-stone-900 truncate">{nomeCompleto || '...'}</p>
          </>
        ) : (
          <p className="text-[17px] font-semibold text-stone-900">{title}</p>
        )}
      </div>

      {/* Direita */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        {right}
        {mostrarPerfil && (
          <>
            <button onClick={() => router.push('/notificacoes')} className="relative w-9 h-9 flex items-center justify-center">
              <Bell size={22} strokeWidth={1.75} color="#5F5E5A"/>
              <span className="absolute top-0.5 right-0.5 w-[7px] h-[7px] bg-red-500 rounded-full"/>
            </button>
            <button
              onClick={() => router.push('/perfil')}
              className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center text-[12px] font-semibold text-brand-800">
              {iniciais}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Home, BarChart2, Sparkles, Target, User } from 'lucide-react'

const NAV = [
  { href: '/dashboard',    Icon: Home,      label: 'Início'    },
  { href: '/portfolio',    Icon: BarChart2,  label: 'Portfólio' },
  { href: '/para-ti',      Icon: Sparkles,   label: 'Para ti'   },
  { href: '/plano',        Icon: Target,     label: 'Plano'     },
  { href: '/perfil',       Icon: User,       label: 'Perfil'    },
]

export function BottomNav() {
  const router   = useRouter()
  const pathname = usePathname()

  return (
    <nav className="bg-white border-t border-stone-200 flex pb-safe">
      {NAV.map(({ href, Icon, label }) => {
        const active = pathname.startsWith(href)
        return (
          <button key={href}
            onClick={() => router.push(href)}
            className="flex-1 flex flex-col items-center gap-[3px] pt-2 pb-3">
            <Icon
              size={22}
              strokeWidth={1.75}
              color={active ? '#1D9E75' : '#B4B2A9'}
            />
            <span className={`text-[10px] ${active ? 'text-brand-400 font-medium' : 'text-stone-400'}`}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

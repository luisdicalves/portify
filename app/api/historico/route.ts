import { NextRequest, NextResponse } from 'next/server'

const PERIODOS: Record<string, { range: string; interval: string; revalidate: number }> = {
  '1D':   { range: '1d',  interval: '5m',  revalidate: 60    },
  '1S':   { range: '5d',  interval: '30m', revalidate: 300   },
  '1M':   { range: '1mo', interval: '1d',  revalidate: 3600  },
  '3M':   { range: '3mo', interval: '1d',  revalidate: 3600  },
  '6M':   { range: '6mo', interval: '1wk', revalidate: 3600  },
  '1A':   { range: '1y',  interval: '1wk', revalidate: 86400 },
  'Tudo': { range: '5y',  interval: '1mo', revalidate: 86400 },
}

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker')
  const tab    = req.nextUrl.searchParams.get('tab') ?? 'Tudo'
  if (!ticker) return NextResponse.json({ error: 'ticker em falta' }, { status: 400 })

  const cfg = PERIODOS[tab] ?? PERIODOS['Tudo']

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}` +
      `?interval=${cfg.interval}&range=${cfg.range}`

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: cfg.revalidate },
    })

    if (!res.ok) return NextResponse.json({ error: `Yahoo: ${res.status}` }, { status: 502 })

    const json   = await res.json()
    const result = json?.chart?.result?.[0]
    if (!result) return NextResponse.json({ error: 'Sem dados' }, { status: 404 })

    const timestamps: number[] = result.timestamp ?? []
    const closes: number[]     = result.indicators?.quote?.[0]?.close ?? []

    const pontos = timestamps
      .map((ts, i) => ({ ts, preco: closes[i] }))
      .filter(p => p.preco != null && !isNaN(p.preco))
      .map(p => {
        const d = new Date(p.ts * 1000)
        let label = ''
        if (tab === '1D') {
          label = d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
        } else if (tab === '1S') {
          label = d.toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric' })
        } else if (tab === '1M' || tab === '3M') {
          label = d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
        } else {
          label = d.toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' })
        }
        return { label, preco: Math.round(p.preco * 100) / 100 }
      })

    return NextResponse.json({ pontos })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'

interface DadosDividendo {
  ticker: string
  nome: string
  dividendRate: number       // valor anual estimado por unidade
  dividendYield: number      // percentagem
  exDividendDate: string | null  // ISO
  dividendDate: string | null    // ISO (próximo pagamento, estimado)
  moeda: string
}

export async function GET(req: NextRequest) {
  const tickersParam = req.nextUrl.searchParams.get('tickers')
  if (!tickersParam) return NextResponse.json({ error: 'tickers em falta' }, { status: 400 })

  const tickers = tickersParam.split(',').map(t => t.trim()).filter(Boolean)

  try {
    const resultados = await Promise.all(tickers.map(async (ticker): Promise<DadosDividendo | null> => {
      try {
        // chart endpoint com eventos de dividendos — não precisa de crumb/cookie
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}` +
          `?range=2y&interval=1mo&events=div`

        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          next: { revalidate: 21600 }, // cache 6h
        })
        if (!res.ok) return null

        const json = await res.json()
        const result = json?.chart?.result?.[0]
        if (!result) return null

        const meta = result.meta ?? {}
        const dividendsObj: Record<string, { amount: number; date: number }> = result.events?.dividends ?? {}

        const entries = Object.values(dividendsObj).sort((a, b) => a.date - b.date)

        // Dividendos pagos nos últimos 12 meses → soma anualizada
        const umAnoAtras = Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60
        const ultimosAno = entries.filter(e => e.date >= umAnoAtras)

        const dividendRate = ultimosAno.length > 0
          ? ultimosAno.reduce((s, e) => s + e.amount, 0)
          : entries.length > 0
            ? entries[entries.length - 1].amount * (entries.length >= 4 ? 4 : entries.length) // fallback grosseiro
            : 0

        const preco = meta.regularMarketPrice ?? meta.previousClose ?? 0
        const dividendYield = preco > 0 ? (dividendRate / preco) * 100 : 0

        // Última data ex-dividend conhecida
        const ultimaEx = entries.length > 0 ? entries[entries.length - 1] : null
        const exDividendDate = ultimaEx ? new Date(ultimaEx.date * 1000).toISOString() : null

        // Estimar próxima data: se há pelo menos 2 dividendos, calcular intervalo médio e projetar
        let dividendDate: string | null = null
        if (entries.length >= 2 && ultimaEx) {
          const intervalos = []
          for (let i = 1; i < entries.length; i++) {
            intervalos.push(entries[i].date - entries[i - 1].date)
          }
          const intervaloMedio = intervalos.reduce((s, v) => s + v, 0) / intervalos.length
          const proximaExEstimada = ultimaEx.date + intervaloMedio
          // Pagamento costuma ser ~2-4 semanas após ex-dividend
          const proximoPagamentoEstimado = proximaExEstimada + 18 * 24 * 60 * 60
          dividendDate = new Date(proximoPagamentoEstimado * 1000).toISOString()
        }

        return {
          ticker: ticker.toUpperCase(),
          nome: meta.longName ?? meta.shortName ?? ticker,
          dividendRate: Math.round(dividendRate * 10000) / 10000,
          dividendYield: Math.round(dividendYield * 100) / 100,
          exDividendDate,
          dividendDate,
          moeda: meta.currency ?? 'USD',
        }
      } catch {
        return null
      }
    }))

    const dados = resultados.filter((r): r is DadosDividendo => r !== null)
    return NextResponse.json({ dados })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

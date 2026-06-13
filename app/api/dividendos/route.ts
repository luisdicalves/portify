import { NextRequest, NextResponse } from 'next/server'

// Detecta o sufixo Yahoo a partir do ticker (igual ao usado em /api/cotacao)
function tickerYahoo(ticker: string): string {
  return ticker.toUpperCase()
}

interface DadosDividendo {
  ticker: string
  nome: string
  dividendRate: number       // valor anual estimado por unidade, na moeda do ticker
  dividendYield: number      // em percentagem
  exDividendDate: string | null  // ISO
  dividendDate: string | null    // ISO (próximo pagamento)
  moeda: string
}

export async function GET(req: NextRequest) {
  const tickersParam = req.nextUrl.searchParams.get('tickers')
  if (!tickersParam) return NextResponse.json({ error: 'tickers em falta' }, { status: 400 })

  const tickers = tickersParam.split(',').map(t => t.trim()).filter(Boolean)

  try {
    const resultados = await Promise.all(tickers.map(async (ticker): Promise<DadosDividendo | null> => {
      try {
        const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(tickerYahoo(ticker))}` +
          `?modules=summaryDetail,calendarEvents,price`

        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          next: { revalidate: 21600 }, // cache 6h — dados de dividendos mudam pouco
        })
        if (!res.ok) return null

        const json = await res.json()
        const result = json?.quoteSummary?.result?.[0]
        if (!result) return null

        const summary  = result.summaryDetail  ?? {}
        const calendar = result.calendarEvents ?? {}
        const price    = result.price          ?? {}

        const dividendRate  = summary.dividendRate?.raw  ?? 0
        const dividendYield = summary.dividendYield?.raw ? summary.dividendYield.raw * 100 : 0

        const exDateRaw  = calendar.exDividendDate?.raw ?? summary.exDividendDate?.raw ?? null
        const payDateRaw = calendar.dividendDate?.raw   ?? null

        return {
          ticker: ticker.toUpperCase(),
          nome:   price.longName ?? price.shortName ?? ticker,
          dividendRate,
          dividendYield,
          exDividendDate: exDateRaw  ? new Date(exDateRaw  * 1000).toISOString() : null,
          dividendDate:   payDateRaw ? new Date(payDateRaw * 1000).toISOString() : null,
          moeda: price.currency ?? 'USD',
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

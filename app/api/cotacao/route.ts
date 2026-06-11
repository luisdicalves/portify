import { NextRequest, NextResponse } from 'next/server'

// Detecta país/bolsa pelo sufixo do ticker
function getBolsa(ticker: string): { sufixo: string; bandeira: string; moeda: string } {
  const t = ticker.toUpperCase()
  if (t.endsWith('.DE')) return { sufixo: '.DE', bandeira: '🇩🇪', moeda: 'EUR' }
  if (t.endsWith('.PA')) return { sufixo: '.PA', bandeira: '🇫🇷', moeda: 'EUR' }
  if (t.endsWith('.AS')) return { sufixo: '.AS', bandeira: '🇳🇱', moeda: 'EUR' }
  if (t.endsWith('.MI')) return { sufixo: '.MI', bandeira: '🇮🇹', moeda: 'EUR' }
  if (t.endsWith('.MC')) return { sufixo: '.MC', bandeira: '🇪🇸', moeda: 'EUR' }
  if (t.endsWith('.L'))  return { sufixo: '.L',  bandeira: '🇬🇧', moeda: 'GBP' }
  if (t.endsWith('.T'))  return { sufixo: '.T',  bandeira: '🇯🇵', moeda: 'JPY' }
  if (t.endsWith('.HK')) return { sufixo: '.HK', bandeira: '🇭🇰', moeda: 'HKD' }
  if (t.endsWith('.AX')) return { sufixo: '.AX', bandeira: '🇦🇺', moeda: 'AUD' }
  if (t.endsWith('.TO')) return { sufixo: '.TO', bandeira: '🇨🇦', moeda: 'CAD' }
  if (t.endsWith('.SW')) return { sufixo: '.SW', bandeira: '🇨🇭', moeda: 'CHF' }
  if (t.endsWith('.LS')) return { sufixo: '.LS', bandeira: '🇵🇹', moeda: 'EUR' }
  // ETFs irlandeses listados em Xetra
  if (['VWCE','CSPX','IWDA','EIMI','IUSQ','VUSA','VUAA','IUIT','HEAL'].includes(t.split('.')[0]))
    return { sufixo: '', bandeira: '🇮🇪', moeda: 'USD' }
  // Default: EUA
  return { sufixo: '', bandeira: '🇺🇸', moeda: 'USD' }
}

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker')
  if (!ticker) return NextResponse.json({ error: 'ticker em falta' }, { status: 400 })

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 }, // cache 5 min
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Yahoo Finance erro: ${res.status}` }, { status: 502 })
    }

    const json = await res.json()
    const meta  = json?.chart?.result?.[0]?.meta
    if (!meta) return NextResponse.json({ error: 'Ticker não encontrado' }, { status: 404 })

    const preco        = meta.regularMarketPrice ?? meta.previousClose ?? 0
    const precoAnterior= meta.previousClose ?? preco
    const variacao     = preco - precoAnterior
    const variacaoPct  = precoAnterior > 0 ? (variacao / precoAnterior) * 100 : 0
    const moedaYahoo   = meta.currency ?? 'USD'
    const { bandeira } = getBolsa(ticker)

    return NextResponse.json({
      ticker:       ticker.toUpperCase(),
      preco,
      variacao,
      variacaoPct,
      moeda:        moedaYahoo,
      bandeira,
      nome:         meta.longName ?? meta.shortName ?? ticker,
      timestamp:    new Date().toISOString(),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

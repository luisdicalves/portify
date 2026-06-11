import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/* ── Converte número serial do Excel para data ISO ── */
function excelDateToISO(serial: number): string {
  // Excel epoch: 1 Jan 1900 (com bug do ano 1900 como bissexto)
  const utc = (serial - 25569) * 86400 * 1000
  return new Date(utc).toISOString()
}

/* ── Detecta tipo de ativo pelo ticker ── */
function detectarTipo(symbol: string): 'Ação' | 'ETF' | 'REIT' {
  const s = symbol.toUpperCase()
  const etfs = ['VWCE','CSPX','IWDA','EIMI','IUSQ','VUSA','VUAA','IUIT','HEAL','SPY','QQQ','VTI','SCHD']
  if (etfs.some(e => s.startsWith(e))) return 'ETF'
  return 'Ação'
}

/* ── Parser do formato XTB: extrai volume e preço do Comment ── */
function parseComment(comment: string): { volume: number; preco: number } | null {
  // "OPEN BUY 0.5 @ 132.62" ou "OPEN BUY 0.1542/1.1542 @ 49.45"
  const match = comment.match(/OPEN BUY\s+([\d.]+)(?:\/[\d.]+)?\s*@\s*([\d.]+)/i)
  if (!match) return null
  return {
    volume: parseFloat(match[1]),
    preco:  parseFloat(match[2]),
  }
}

/* ── Normaliza símbolo XTB → Yahoo Finance ── */
function normalizarTicker(symbol: string): string {
  // XTB usa sufixos: AIR.FR → AIR.PA, ABN.NL → ABN.AS, AMD.DE → AMD.DE, etc.
  const mapa: Record<string, string> = {
    '.FR': '.PA',
    '.NL': '.AS',
    '.US': '',
    '.DE': '.DE',
    '.ES': '.MC',
    '.IT': '.MI',
    '.PT': '.LS',
    '.UK': '.L',
  }
  for (const [sufixo, yahoo] of Object.entries(mapa)) {
    if (symbol.toUpperCase().endsWith(sufixo)) {
      return symbol.slice(0, -sufixo.length) + yahoo
    }
  }
  return symbol
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { linhas, userId } = body as {
      linhas: { type: string; time: number | string; comment: string; symbol: string; amount: number }[]
      userId: string
    }

    if (!linhas || !userId) {
      return NextResponse.json({ error: 'Dados em falta' }, { status: 400 })
    }

    // Filtrar apenas compras de ações
    const compras = linhas.filter(l =>
      l.type?.toLowerCase().includes('stock purchase') ||
      l.type?.toLowerCase().includes('buy')
    )

    const posicoes: {
      ticker: string; nome: string; tipo: string
      unidades: number; preco_medio: number; moeda: string
      data_compra: string; user_id: string
    }[] = []

    const erros: string[] = []

    for (const linha of compras) {
      const parsed = parseComment(linha.comment ?? '')
      if (!parsed) {
        erros.push(`Linha ignorada: "${linha.comment}"`)
        continue
      }

      const tickerOriginal = linha.symbol ?? ''
      const ticker = normalizarTicker(tickerOriginal)
      if (!ticker) continue

      // Converter data — pode ser serial Excel ou string
      let dataISO = new Date().toISOString()
      if (typeof linha.time === 'number' && linha.time > 40000) {
        dataISO = excelDateToISO(linha.time)
      } else if (typeof linha.time === 'string' && linha.time.includes('/')) {
        // "09/06/2025 09:00"
        const partes = linha.time.split(' ')
        const [d, m, a] = partes[0].split('/')
        dataISO = `${a}-${m}-${d}T${partes[1] ?? '00:00'}:00.000Z`
      }

      posicoes.push({
        ticker,
        nome:        ticker,
        tipo:        detectarTipo(ticker),
        unidades:    parsed.volume,
        preco_medio: parsed.preco,
        moeda:       'EUR',
        data_compra: dataISO,
        user_id:     userId,
      })
    }

    if (posicoes.length === 0) {
      return NextResponse.json({ importadas: 0, erros, aviso: 'Nenhuma compra encontrada no ficheiro.' })
    }

    // Guardar no Supabase usando a service role key para bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase.from('posicoes').insert(posicoes)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ importadas: posicoes.length, erros, posicoes })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

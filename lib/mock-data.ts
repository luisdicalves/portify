export const carteira = {
  valorAtual:    28540,
  totalInvestido: 24000,
  ganhoTotal:     4540,
  ganhoPercent:   18.9,
  dividendosAno:  612,
  cagr:           11.4,
  yieldOnCost:    2.6,
  saldoCaixa:     1200,
}

export const evolucao = [
  { mes: 'Jan', investido: 20000, atual: 20200 },
  { mes: 'Fev', investido: 20500, atual: 20800 },
  { mes: 'Mar', investido: 21000, atual: 21600 },
  { mes: 'Abr', investido: 21000, atual: 21100 },
  { mes: 'Mai', investido: 22000, atual: 22800 },
  { mes: 'Jun', investido: 22500, atual: 23400 },
  { mes: 'Jul', investido: 23000, atual: 24200 },
  { mes: 'Ago', investido: 23500, atual: 25000 },
  { mes: 'Set', investido: 24000, atual: 27100 },
  { mes: 'Out', investido: 24000, atual: 28540 },
]

export const alocacao = [
  { nome: 'ETFs',   valor: 52, cor: '#1D9E75' },
  { nome: 'Ações',  valor: 33, cor: '#378ADD' },
  { nome: 'REITs',  valor: 10, cor: '#EF9F27' },
  { nome: 'Cash',   valor:  5, cor: '#D85A30' },
]

export const setores = [
  { nome: 'Tecnologia', pct: 62 },
  { nome: 'Financeiro', pct: 18 },
  { nome: 'Saúde',      pct: 10 },
  { nome: 'Imobiliário',pct:  7 },
  { nome: 'Outro',      pct:  3 },
]

export type Posicao = {
  ticker: string
  nome:   string
  tipo:   'ETF' | 'Ação' | 'REIT'
  unid:   number
  pm:     number
  atual:  number
}

export const posicoes: Posicao[] = [
  { ticker: 'VWCE', nome: 'Vanguard FTSE All-World', tipo: 'ETF',  unid: 15, pm:  88.20, atual:  93.71 },
  { ticker: 'CSPX', nome: 'iShares S&P 500',         tipo: 'ETF',  unid: 10, pm: 420.00, atual: 467.88 },
  { ticker: 'AAPL', nome: 'Apple Inc.',               tipo: 'Ação', unid:  8, pm: 162.40, atual: 189.12 },
  { ticker: 'MSFT', nome: 'Microsoft Corp.',          tipo: 'Ação', unid:  5, pm: 290.00, atual: 368.00 },
  { ticker: 'O',    nome: 'Realty Income',            tipo: 'REIT', unid: 20, pm:  52.10, atual:  49.08 },
]

export const dividendos = {
  esteMes:    48,
  esteAno:   612,
  ultimos12: 580,
}

export const dividendosMensais = [
  { mes: 'Jan', val: 32 }, { mes: 'Fev', val: 28 }, { mes: 'Mar', val: 55 },
  { mes: 'Abr', val: 40 }, { mes: 'Mai', val: 48 }, { mes: 'Jun', val: 62 },
  { mes: 'Jul', val: 38 }, { mes: 'Ago', val: 44 }, { mes: 'Set', val: 58 },
  { mes: 'Out', val: 70 }, { mes: 'Nov', val: 45 }, { mes: 'Dez', val: 52 },
]

export const proximosPagamentos = [
  { ticker: 'O',    nome: 'Realty Income',  data: '15 jun', valor: 14.20 },
  { ticker: 'AAPL', nome: 'Apple Inc.',     data: '22 jun', valor:  6.40 },
  { ticker: 'MSFT', nome: 'Microsoft Corp.',data: '12 jul', valor:  9.75 },
]

export const recomendacoes = [
  {
    id: 'r1', tipo: 'risco' as const,
    titulo: 'Concentração elevada em tecnologia',
    desc:    '45% da carteira em tecnologia está acima do recomendado (máx. 35%).',
    sugestao:'Reduz MSFT ou AAPL e redireciona para VWCE.',
  },
  {
    id: 'r2', tipo: 'risco' as const,
    titulo: 'Dependência excessiva dos EUA',
    desc:    '78% da carteira exposta ao mercado americano.',
    sugestao:'Adiciona exposição Europa ou Emergentes via ETF.',
  },
  {
    id: 'r3', tipo: 'oportunidade' as const,
    titulo: 'Reforça setor saúde',
    desc:    '0% de exposição a saúde. Setor defensivo com crescimento consistente.',
    sugestao:'Considera iShares Healthcare ETF (HEAL) ou similar.',
  },
  {
    id: 'r4', tipo: 'oportunidade' as const,
    titulo: 'Aumenta contribuição mensal',
    desc:    'Com +50 €/mês atinges o objetivo 2 anos mais cedo.',
    sugestao:'Objetivo em 18 anos em vez de 20.',
  },
  {
    id: 'r5', tipo: 'oportunidade' as const,
    titulo: 'Reinveste dividendos',
    desc:    'Reinvestir os 612 €/ano acelera o crescimento por composição.',
    sugestao:'Activa reinvestimento automático na tua corretora.',
  },
  {
    id: 'r6', tipo: 'info' as const,
    titulo: 'O teu CAGR está acima da média',
    desc:    '11,4% supera os 9,8% de média histórica do S&P 500.',
    sugestao:'',
  },
]

export const notificacoes = [
  { id: 'n1', lida: false, tipo: 'dividendo',   titulo: 'Dividendo recebido — Realty Income', desc: 'Recebeste 14,20 € de dividendo.',                             tempo: 'Há 23 min'       },
  { id: 'n2', lida: false, tipo: 'alerta',      titulo: 'Concentração elevada em tecnologia', desc: 'A tua exposição subiu para 45%. Acima do recomendado.',        tempo: 'Há 2 horas'      },
  { id: 'n3', lida: false, tipo: 'objetivo',    titulo: '25% do objetivo atingido',           desc: 'A tua carteira ultrapassou os 25.000 €.',                     tempo: 'Hoje, 09:14'     },
  { id: 'n4', lida: true,  tipo: 'historico',   titulo: 'Novo máximo histórico',              desc: 'A tua carteira atingiu um novo máximo de 28.540 €.',           tempo: 'Ontem, 16:42'    },
  { id: 'n5', lida: true,  tipo: 'dividendo',   titulo: 'Dividendo recebido — Apple Inc.',    desc: 'Recebeste 6,40 € de dividendo.',                              tempo: 'Segunda, 10:05'  },
  { id: 'n6', lida: true,  tipo: 'calendario',  titulo: 'Ex-dividend da Microsoft a 18 jun', desc: 'Tens 5 dias para teres a posição em carteira.',                tempo: 'Segunda, 08:00'  },
]

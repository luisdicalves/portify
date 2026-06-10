# Portify — Onboarding

App de gestão de património financeiro. Este repositório contém o onboarding completo (8 ecrãs).

## Pré-requisitos

- [Node.js 18+](https://nodejs.org) — descarrega e instala (versão LTS)

## Como correr

```bash
# 1. Entra na pasta do projeto
cd portify

# 2. Instala as dependências (só na primeira vez)
npm install

# 3. Corre em modo de desenvolvimento
npm run dev
```

Abre o browser em **http://localhost:3000**

## Estrutura de ecrãs

```
/onboarding              → Boas-vindas
/onboarding/criar-conta  → Registo (nome, email, password)
/onboarding/seguranca    → PIN + biometria
/onboarding/experiencia  → Nível de experiência
/onboarding/perfil-risco → Perfil de risco
/onboarding/objetivo     → Objetivo principal
/onboarding/quer-plano   → Decisão: quer plano?
/onboarding/definir-plano→ Configurar plano (se Sim)
/onboarding/pronto       → Conclusão + projeção IA
/dashboard               → Placeholder (a desenvolver)
```

## Ficheiros importantes

| Ficheiro | O que faz |
|---|---|
| `lib/onboarding-context.tsx` | Estado partilhado entre todos os ecrãs |
| `components/ui/index.tsx` | Botões, campos, chips, barras de progresso |
| `tailwind.config.js` | Cores da marca (brand-400 = verde #1D9E75) |

## Próximos passos

1. Dashboard com gráfico de carteira
2. Portfólio — lista de posições
3. Para ti — recomendações IA
4. Plano — objetivo e projeção
5. Perfil + Definições

## Stack

- **Next.js 14** — framework React
- **Tailwind CSS** — estilos
- **TypeScript** — tipagem
- **Vercel** — hosting gratuito (deploy com `vercel deploy`)

## Ecrãs da app principal

```
/dashboard      → Dashboard (gráfico, métricas, alocação, recomendações)
/portfolio      → Portfólio (posições, filtros, setores)
/para-ti        → Recomendações IA (riscos, oportunidades, perguntas)
/plano          → Plano de investimento (objetivo, projeção dinâmica)
/perfil         → Perfil do utilizador
/dividendos     → Dividendos (resumo, calendário, próximos pagamentos)
/notificacoes   → Notificações (sino)
/definicoes     → Definições (tema, notifs, segurança, exportar)
```

## Alterações v2

- Adicionado `recharts` para gráficos
- Route group `(app)` com BottomNav partilhado
- Dados mock centralizados em `lib/mock-data.ts`
- Projeção financeira calculada em tempo real no Plano
- Toggles funcionais nas Definições

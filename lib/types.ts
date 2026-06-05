export interface Bot {
  fullName: string
  owner: string
  repo: string
  description: string
  stars: number
  language: string | null
  botScore: number
  chains: string[]
  dexes: string[]
  strategies: string[]
  redFlagCount: number
  updatedAt: string
  // X social pulse (optional — present once the stack's x-social-pulse has run)
  socialScore?: number
  buzzVerdict?: string
  profitRatio?: number
  mentions?: number
  // Simulated out-of-sample backtest (present once `npm run enrich` has run)
  backtestable?: boolean
  backtestReturn?: number // fraction, e.g. -0.114 = -11.4% (simulated, not real)
  backtestSharpe?: number
  backtestSortino?: number
  backtestExposure?: number // avg fraction of equity in the asset
  backtestDrawdown?: number
  backtestAlpha?: number // return minus buy & hold — does it beat holding?
  backtestWinRate?: number | null // fraction of winning trades (null if no closed trades)
  backtestTrades?: number
  backtestProfitFactor?: number | null // gross profit / gross loss (null if no closed trades)
  backtestCurve?: number[] // equity curve, normalized to start=1, ~24 points
  backtestMarket?: string
  backtestAssets?: string[]
  backtestStrategy?: string
}

export interface Dataset {
  generatedAt: string | null
  stats: {
    totalBots: number
    avgScore: number
    flaggedBots: number
    topLanguage: string | null
    lastScan: string | null
  }
  categories: {
    chains: string[]
    dexes: string[]
    strategies: string[]
    languages: string[]
  }
  social?: {
    available: boolean
    simulated: boolean
    backend: string | null
  }
  backtest?: {
    available: boolean
    simulated: boolean
    generatedAt: string | null
    evaluated: number
  }
  bots: Bot[]
}

export function combinedRank(b: Bot): number {
  // Same 70/30 blend as the stack ranker, used to sort by overall rank.
  return 0.7 * b.botScore + 0.3 * (b.socialScore ?? 0)
}

export function securityBadge(redFlagCount: number): { label: string; cls: string } {
  return redFlagCount > 0
    ? { label: "⚠ red flags", cls: "badge-risky" }
    : { label: "✓ clean", cls: "badge-safe" }
}

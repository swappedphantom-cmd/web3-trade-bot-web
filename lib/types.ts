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
  bots: Bot[]
}

export function securityBadge(redFlagCount: number): { label: string; cls: string } {
  return redFlagCount > 0
    ? { label: "⚠ red flags", cls: "badge-risky" }
    : { label: "✓ clean", cls: "badge-safe" }
}

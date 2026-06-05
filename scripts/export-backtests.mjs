// Generate downloadable backtest reports (JSON + CSV) into public/ from data/bots.json.
// Run: node scripts/export-backtests.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const data = JSON.parse(readFileSync(path.join(root, "data/bots.json"), "utf8"))
const bots = data.bots.filter((b) => b.backtestable)

const fields = [
  ["fullName", (b) => b.fullName],
  ["strategy", (b) => b.backtestStrategy ?? ""],
  ["assets", (b) => (b.backtestAssets ?? []).join(" ")],
  ["return", (b) => b.backtestReturn],
  ["alpha_vs_hold", (b) => b.backtestAlpha],
  ["win_rate", (b) => b.backtestWinRate],
  ["trades", (b) => b.backtestTrades],
  ["profit_factor", (b) => b.backtestProfitFactor],
  ["sharpe", (b) => b.backtestSharpe],
  ["sortino", (b) => b.backtestSortino],
  ["max_drawdown", (b) => b.backtestDrawdown],
  ["avg_exposure", (b) => b.backtestExposure],
  ["code_score", (b) => b.botScore],
  ["red_flags", (b) => b.redFlagCount],
]

const report = {
  generatedAt: data.backtest?.generatedAt ?? null,
  simulated: true,
  note: "Out-of-sample, multi-asset averaged, walk-forward. Simulated — not real gains.",
  count: bots.length,
  bots: bots
    .slice()
    .sort((a, b) => (b.backtestAlpha ?? -Infinity) - (a.backtestAlpha ?? -Infinity))
    .map((b) => Object.fromEntries(fields.map(([k, f]) => [k, f(b)]))),
}

const pub = path.join(root, "public")
mkdirSync(pub, { recursive: true })
writeFileSync(path.join(pub, "backtests.json"), JSON.stringify(report, null, 2))

const esc = (v) => {
  const s = v == null ? "" : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const header = fields.map(([k]) => k).join(",")
const rows = report.bots.map((row) => fields.map(([k]) => esc(row[k])).join(","))
writeFileSync(path.join(pub, "backtests.csv"), [header, ...rows].join("\n") + "\n")

console.log(`wrote public/backtests.json + public/backtests.csv (${bots.length} bots)`)

// Build a SIMULATED paper-trading portfolio from the backtest equity curves.
// Equal-weights the top-N backtestable bots by alpha (beats hold), combines
// their normalized equity curves into a portfolio curve. Writes data/paper.json.
// Run: node scripts/build-paper.mjs
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const data = JSON.parse(readFileSync(path.join(root, "data/bots.json"), "utf8"))

const CAPITAL = 10000
const N = 6
const r3 = (x) => Math.round(x * 1000) / 1000
const r2 = (x) => Math.round(x * 100) / 100

const picks = data.bots
  .filter((b) => b.backtestable && Array.isArray(b.backtestCurve) && b.backtestCurve.length > 1)
  .sort((a, b) => (b.backtestAlpha ?? -Infinity) - (a.backtestAlpha ?? -Infinity))
  .slice(0, N)

const each = CAPITAL / picks.length
const len = Math.min(...picks.map((p) => p.backtestCurve.length))

const positions = picks.map((b) => {
  const curve = b.backtestCurve.slice(0, len)
  const scaled = curve.map((v) => v * each) // $ value of this line over time
  const finalValue = scaled[scaled.length - 1]
  return {
    fullName: b.fullName,
    owner: b.owner,
    repo: b.repo,
    strategy: b.backtestStrategy,
    weight: r3(1 / picks.length),
    amount: r2(each),
    return: r3(curve[curve.length - 1] - 1),
    pnl: r2(finalValue - each),
    finalValue: r2(finalValue),
    alpha: b.backtestAlpha,
    winRate: b.backtestWinRate,
    scaled: scaled.map(r2),
  }
})

const curve = []
for (let t = 0; t < len; t++) curve.push(r2(positions.reduce((s, p) => s + p.scaled[t], 0)))

let peak = -Infinity
let maxDD = 0
for (const v of curve) {
  if (v > peak) peak = v
  if (peak > 0) maxDD = Math.max(maxDD, (peak - v) / peak)
}
const finalValue = curve[curve.length - 1]

const out = {
  generatedAt: data.backtest?.generatedAt ?? null,
  simulated: true,
  capital: CAPITAL,
  strategy: `équipondéré sur les ${picks.length} meilleurs bots backtestables par alpha`,
  portfolio: {
    initialValue: CAPITAL,
    finalValue: r2(finalValue),
    pnl: r2(finalValue - CAPITAL),
    return: r3(finalValue / CAPITAL - 1),
    maxDrawdown: r3(maxDD),
    curve,
  },
  positions,
}

writeFileSync(path.join(root, "data/paper.json"), JSON.stringify(out, null, 2))
console.log(
  `wrote data/paper.json — ${picks.length} positions, $${CAPITAL} -> $${r2(finalValue)} (${(out.portfolio.return * 100).toFixed(1)}%)`,
)

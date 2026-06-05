// Forward paper-trading tracker (deterministic, no real money).
// Freezes the portfolio + grid params at a start date, then replays the
// strategy over REAL price data from that date to now. Re-run daily (GitHub
// Actions) to extend the forward P&L track record. Writes data/paper-live.json.
//
// Forward = strategy params come ONLY from data BEFORE startDate (no lookahead);
// the equity curve is computed on data FROM startDate onward.
import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const OUT = path.join(root, "data/paper-live.json")
const CAPITAL = 10000
const DAY = 86_400_000

const r2 = (x) => Math.round(x * 100) / 100
const r3 = (x) => Math.round(x * 1000) / 1000

const HOSTS = ["https://api.binance.com", "https://data-api.binance.vision"]
async function klines(symbol, interval = "1d", limit = 400) {
  for (const h of HOSTS) {
    try {
      const r = await fetch(`${h}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`)
      if (!r.ok) continue
      const rows = await r.json()
      return rows.map((k) => ({ time: k[0], high: +k[2], low: +k[3], close: +k[4] }))
    } catch {
      /* try next host */
    }
  }
  return null
}

// Stateful grid equity curve; eq[0] = capital. Fees + slippage applied.
function gridCurve(candles, { lower, upper, grids }, capital) {
  const levels = Array.from({ length: grids + 1 }, (_, i) => lower + ((upper - lower) * i) / grids)
  const bucket = (p) => levels.filter((l) => l <= p).length
  const cap = capital / grids
  const fee = 0.001
  const slip = 0.0005
  let cash = capital
  let base = 0
  let lastB = bucket(candles[0].close)
  const eq = []
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i]
    if (i > 0) {
      const idx = bucket(c.close)
      if (idx < lastB)
        for (let k = 0; k < lastB - idx; k++) {
          const spend = Math.min(cap, cash)
          if (spend > 0) {
            base += (spend / (c.close * (1 + slip))) * (1 - fee)
            cash -= spend
          }
        }
      else if (idx > lastB)
        for (let k = 0; k < idx - lastB; k++) {
          const sell = Math.min(cap / c.close, base)
          if (sell > 0) {
            cash += sell * c.close * (1 - slip) * (1 - fee)
            base -= sell
          }
        }
      lastB = idx
    }
    eq.push(cash + base * c.close)
  }
  return eq
}

async function main() {
  const paper = JSON.parse(readFileSync(path.join(root, "data/paper.json"), "utf8"))
  const bots = JSON.parse(readFileSync(path.join(root, "data/bots.json"), "utf8"))
  const assetOf = (fullName) =>
    (bots.bots.find((b) => b.fullName === fullName)?.backtestAssets ?? [])[0] ?? null

  // Stable start date: kept from the existing file, else 30 days ago (midnight UTC).
  const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : null
  const nowDay = Math.floor(Date.now() / DAY) * DAY
  const startMs = prev?.startMs ?? nowDay - 30 * DAY

  const each = CAPITAL / paper.positions.length
  const series = [] // per position: {fullName, owner, repo, asset, eq:[], times:[]}
  for (const pos of paper.positions) {
    const sym = assetOf(pos.fullName)
    if (!sym) continue
    const c = await klines(sym, "1d", 400)
    if (!c || c.length < 60) continue
    const pre = c.filter((x) => x.time < startMs)
    const fwd = c.filter((x) => x.time >= startMs)
    if (fwd.length < 2) continue
    const bounds = pre.length >= 30 ? pre : fwd
    const lower = Math.min(...bounds.map((x) => x.low))
    const upper = Math.max(...bounds.map((x) => x.high))
    const raw = gridCurve(fwd, { lower, upper, grids: 10 }, each)
    series.push({ fullName: pos.fullName, owner: pos.owner, repo: pos.repo, asset: sym, eq: raw, times: fwd.map((x) => x.time) })
  }

  if (series.length === 0) {
    console.error("no series — aborting")
    process.exit(1)
  }
  const len = Math.min(...series.map((s) => s.eq.length))
  const times = series[0].times.slice(0, len)
  const curve = []
  for (let t = 0; t < len; t++) {
    const value = series.reduce((s, p) => s + p.eq[t], 0)
    curve.push({ date: new Date(times[t]).toISOString().slice(0, 10), value: r2(value) })
  }
  const finalValue = curve[curve.length - 1].value
  let peak = -Infinity
  let mdd = 0
  for (const p of curve) {
    if (p.value > peak) peak = p.value
    if (peak > 0) mdd = Math.max(mdd, (peak - p.value) / peak)
  }
  const positions = series.map((p) => {
    const fv = p.eq[len - 1]
    return { fullName: p.fullName, owner: p.owner, repo: p.repo, asset: p.asset, amount: r2(each), finalValue: r2(fv), return: r3(fv / each - 1) }
  })

  const out = {
    simulated: true,
    capital: CAPITAL,
    startMs,
    startDate: new Date(startMs).toISOString().slice(0, 10),
    updatedAt: new Date(nowDay).toISOString().slice(0, 10),
    days: curve.length,
    portfolio: {
      initialValue: CAPITAL,
      finalValue,
      pnl: r2(finalValue - CAPITAL),
      return: r3(finalValue / CAPITAL - 1),
      maxDrawdown: r3(mdd),
      curve,
    },
    positions,
  }
  writeFileSync(OUT, JSON.stringify(out, null, 2))
  console.log(`paper-live: ${out.startDate} -> ${out.updatedAt} (${out.days}d), $${CAPITAL} -> $${finalValue} (${(out.portfolio.return * 100).toFixed(1)}%), ${positions.length} positions`)
}

main()

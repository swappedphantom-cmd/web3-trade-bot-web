import Link from "next/link"
import dataset from "../../../../data/bots.json"
import type { Bot, Dataset } from "../../../../lib/types"
import { securityBadge } from "../../../../lib/types"
import { notFound } from "next/navigation"

const data = dataset as Dataset

export function generateStaticParams() {
  return data.bots
    .filter((b) => b.backtestable)
    .map((b) => ({ owner: b.owner, repo: b.repo }))
}

export function generateMetadata({ params }: { params: { owner: string; repo: string } }) {
  return { title: `${params.owner}/${params.repo} — backtest | Web3 Trading Bot Index` }
}

const pct = (x: number | null | undefined, signed = false) =>
  x == null ? "—" : `${signed && x >= 0 ? "+" : ""}${(x * 100).toFixed(1)}%`
const num = (x: number | null | undefined, d = 2) => (x == null ? "—" : x.toFixed(d))
const cls = (x: number | null | undefined) => ((x ?? 0) >= 0 ? "pos" : "neg")

function Chart({ data: curve }: { data: number[] }) {
  const w = 720
  const h = 180
  const pad = 10
  const min = Math.min(...curve)
  const max = Math.max(...curve)
  const span = max - min || 1
  const x = (i: number) => pad + (i * (w - 2 * pad)) / (curve.length - 1)
  const y = (v: number) => h - pad - ((v - min) / span) * (h - 2 * pad)
  const line = curve.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")
  const up = curve[curve.length - 1]! >= curve[0]!
  const color = up ? "#00d4a0" : "#ff6b81"
  const area = `${x(0).toFixed(1)},${(h - pad).toFixed(1)} ${line} ${x(curve.length - 1).toFixed(1)},${(h - pad).toFixed(1)}`
  const yBase = 1 >= min && 1 <= max ? y(1) : null
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="bigchart">
      <polygon points={area} fill={color} fillOpacity="0.08" />
      {yBase != null && (
        <line x1={pad} x2={w - pad} y1={yBase} y2={yBase} stroke="#3a3f52" strokeWidth="1" strokeDasharray="4 4" />
      )}
      <polyline points={line} fill="none" stroke={color} strokeWidth="2.5" />
    </svg>
  )
}

function Stat({ label, value, big, color }: { label: string; value: string; big?: boolean; color?: string }) {
  return (
    <div className={`bstat ${big ? "bstat-big" : ""}`}>
      <div className={`bstat-value ${color ?? ""}`}>{value}</div>
      <div className="bstat-label">{label}</div>
    </div>
  )
}

export default function Page({ params }: { params: { owner: string; repo: string } }) {
  const bot: Bot | undefined = data.bots.find((b) => b.fullName === `${params.owner}/${params.repo}`)
  if (!bot || !bot.backtestable) notFound()
  const badge = securityBadge(bot.redFlagCount)

  return (
    <main>
      <header className="hero">
        <Link className="backlink" href="/backtests">
          ← retour au leaderboard
        </Link>
        <h1>
          {bot.fullName} <span className={`badge ${badge.cls}`}>{badge.label}</span>
        </h1>
        <p className="subtitle">{bot.description || "—"}</p>
        <div className="bstats">
          <Stat label="win rate (trades gagnants)" value={pct(bot.backtestWinRate)} big color="accent" />
          <Stat label="α vs hold" value={pct(bot.backtestAlpha, true)} big color={cls(bot.backtestAlpha)} />
          <Stat label="rendement (oos)" value={pct(bot.backtestReturn, true)} big color={cls(bot.backtestReturn)} />
        </div>
        <p className="sim-banner">
          📈 Backtest <strong>simulé</strong> out-of-sample ({bot.backtestStrategy}, {bot.backtestMarket}).
          Pas un gain réel.
        </p>
      </header>

      <section className="panel">
        <h2 className="panel-title">Courbe d&apos;équité (base 100, moyenne multi-actifs)</h2>
        {bot.backtestCurve && bot.backtestCurve.length > 1 ? (
          <Chart data={bot.backtestCurve} />
        ) : (
          <p className="muted">pas de courbe disponible</p>
        )}
      </section>

      <section className="panel">
        <h2 className="panel-title">Métriques de performance</h2>
        <div className="bgrid">
          <Stat label="win rate" value={pct(bot.backtestWinRate)} />
          <Stat label="trades simulés" value={num(bot.backtestTrades, 0)} />
          <Stat label="profit factor" value={num(bot.backtestProfitFactor)} />
          <Stat label="Sharpe" value={num(bot.backtestSharpe)} />
          <Stat label="Sortino" value={num(bot.backtestSortino)} />
          <Stat label="max drawdown" value={pct(bot.backtestDrawdown)} />
          <Stat label="exposition moy." value={pct(bot.backtestExposure)} />
          <Stat label="score code" value={num(bot.botScore, 0)} />
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">Le bot</h2>
        <div className="tags">
          {bot.strategies.map((s) => (
            <span key={s} className="tag tag-strat">
              {s}
            </span>
          ))}
          {bot.chains.map((c) => (
            <span key={c} className="tag tag-chain">
              {c}
            </span>
          ))}
          {bot.dexes.map((d) => (
            <span key={d} className="tag tag-dex">
              {d}
            </span>
          ))}
        </div>
        <p className="meta-line">
          ⭐ {bot.stars.toLocaleString("fr-FR")} · {bot.language || "—"} ·{" "}
          <a href={`https://github.com/${bot.fullName}`} target="_blank" rel="noreferrer">
            voir sur GitHub →
          </a>
        </p>
      </section>

      <footer className="footer">
        ⚠️ Outil d&apos;analyse. Backtests simulés — ne préjugent pas des résultats futurs. Ne jamais
        exécuter un bot tiers avec une vraie clé privée.
      </footer>
    </main>
  )
}

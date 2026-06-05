import Link from "next/link"
import dataset from "../../data/bots.json"
import type { Dataset } from "../../lib/types"
import BacktestTable from "./BacktestTable"

export const metadata = {
  title: "Backtests — Web3 Trading Bot Index",
  description: "Performance simulée out-of-sample des bots de trading: alpha vs hold, win rate, profit factor.",
}

// Fully static (SSG): the bundled JSON is read at build time. Ideal for Vercel.
const pct = (x: number) => `${(x * 100).toFixed(0)}%`

export default function Page() {
  const data = dataset as Dataset
  const bots = data.bots.filter((b) => b.backtestable)
  const beat = bots.filter((b) => (b.backtestAlpha ?? 0) > 0).length
  const wins = bots.map((b) => b.backtestWinRate).filter((w): w is number => w != null)
  const avgWin = wins.length ? wins.reduce((a, b) => a + b, 0) / wins.length : 0
  const avgAlpha = bots.length ? bots.reduce((a, b) => a + (b.backtestAlpha ?? 0), 0) / bots.length : 0
  return (
    <main>
      <header className="hero">
        <Link className="backlink" href="/">
          ← retour à l&apos;index
        </Link>
        <h1>
          Backtests <span className="accent">📈</span>
        </h1>
        <span className="navlinks">
          <Link className="navlink" href="/paper">
            🧪 Paper trading →
          </Link>
          <Link className="navlink" href="/methodologie">
            🔬 Méthodologie →
          </Link>
        </span>
        <p className="subtitle">
          Performance <strong>simulée out-of-sample</strong> des {bots.length} bots backtestables — triable
          par alpha, win rate, profit factor, Sharpe…
        </p>
        <p className="sim-banner">
          📈 Backtests <strong>simulés</strong> sur un panier d&apos;actifs liquides par chaîne (stratégies
          DCA / grid, walk-forward). <strong>Pas des gains réels.</strong> La plupart sont négatifs en absolu,
          mais battent souvent le simple hold (α &gt; 0).
        </p>
        <div className="stats">
          <div className="stat">
            <div className="stat-value">
              {beat}/{bots.length}
            </div>
            <div className="stat-label">battent le hold (α &gt; 0)</div>
          </div>
          <div className="stat">
            <div className="stat-value">{pct(avgWin)}</div>
            <div className="stat-label">win rate moyen</div>
          </div>
          <div className="stat">
            <div className={`stat-value ${avgAlpha >= 0 ? "" : "stat-warn"}`}>
              {avgAlpha >= 0 ? "+" : ""}
              {pct(avgAlpha)}
            </div>
            <div className="stat-label">alpha moyen vs hold</div>
          </div>
        </div>
        <p className="reports">
          📥 Rapport complet :{" "}
          <a href="/web3-trade-bot-web/backtests.csv" download>
            CSV
          </a>{" "}
          ·{" "}
          <a href="/web3-trade-bot-web/backtests.json" download>
            JSON
          </a>
        </p>
      </header>

      <BacktestTable bots={bots} />

      <footer className="footer">
        ⚠️ Outil d&apos;analyse. Ne jamais exécuter un bot tiers avec une vraie clé privée. Les performances
        passées simulées ne préjugent pas des résultats futurs.
      </footer>
    </main>
  )
}

import dataset from "../../data/bots.json"
import type { Dataset } from "../../lib/types"
import BacktestTable from "./BacktestTable"

export const metadata = {
  title: "Backtests — Web3 Trading Bot Index",
  description: "Performance simulée out-of-sample des bots de trading: alpha vs hold, win rate, profit factor.",
}

// Fully static (SSG): the bundled JSON is read at build time. Ideal for Vercel.
export default function Page() {
  const data = dataset as Dataset
  const bots = data.bots.filter((b) => b.backtestable)
  return (
    <main>
      <header className="hero">
        <a className="backlink" href="/">
          ← retour à l&apos;index
        </a>
        <h1>
          Backtests <span className="accent">📈</span>
        </h1>
        <p className="subtitle">
          Performance <strong>simulée out-of-sample</strong> des {bots.length} bots backtestables — triable
          par alpha, win rate, profit factor, Sharpe…
        </p>
        <p className="sim-banner">
          📈 Backtests <strong>simulés</strong> sur un panier d&apos;actifs liquides par chaîne (stratégies
          DCA / grid, walk-forward). <strong>Pas des gains réels.</strong> La plupart sont négatifs en absolu,
          mais battent souvent le simple hold (α &gt; 0).
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

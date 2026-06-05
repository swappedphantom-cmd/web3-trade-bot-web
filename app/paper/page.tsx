import Link from "next/link"
import paper from "../../data/paper.json"
import live from "../../data/paper-live.json"

export const metadata = {
  title: "Paper trading — Web3 Trading Bot Index",
  description: "Portefeuille papier simulé à partir des backtests out-of-sample.",
}

type Pos = (typeof paper.positions)[number]

const pct = (x: number, signed = false) => `${signed && x >= 0 ? "+" : ""}${(x * 100).toFixed(1)}%`
const eur = (x: number) => `$${x.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}`
const cls = (x: number) => (x >= 0 ? "pos" : "neg")

function Chart({ curve, base }: { curve: number[]; base: number }) {
  const w = 760
  const h = 200
  const pad = 12
  const min = Math.min(...curve, base)
  const max = Math.max(...curve, base)
  const span = max - min || 1
  const x = (i: number) => pad + (i * (w - 2 * pad)) / (curve.length - 1)
  const y = (v: number) => h - pad - ((v - min) / span) * (h - 2 * pad)
  const line = curve.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")
  const up = curve[curve.length - 1]! >= curve[0]!
  const color = up ? "#00d4a0" : "#ff6b81"
  const area = `${x(0).toFixed(1)},${(h - pad).toFixed(1)} ${line} ${x(curve.length - 1).toFixed(1)},${(h - pad).toFixed(1)}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="bigchart">
      <polygon points={area} fill={color} fillOpacity="0.08" />
      <line x1={pad} x2={w - pad} y1={y(base)} y2={y(base)} stroke="#3a3f52" strokeWidth="1" strokeDasharray="4 4" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2.5" />
    </svg>
  )
}

export default function Page() {
  const p = paper.portfolio
  return (
    <main>
      <header className="hero">
        <Link className="backlink" href="/">
          ← retour à l&apos;index
        </Link>
        <h1>
          Paper trading <span className="accent">🧪</span>
        </h1>
        <p className="subtitle">
          Portefeuille <strong>papier</strong> (argent fictif) : {eur(paper.capital)} {paper.strategy}, suivi sur
          la période backtest out-of-sample.
        </p>
        <p className="sim-banner">
          🧪 <strong>Simulation, pas d&apos;argent réel.</strong> En absolu la plupart des bots perdent sur la
          période — mais ils <strong>battent le hold</strong> (alpha positif). Le paper trading sert à valider
          AVANT d&apos;engager du capital.
        </p>
        <div className="bstats">
          <div className="bstat bstat-big">
            <div className="bstat-value">{eur(p.finalValue)}</div>
            <div className="bstat-label">valeur finale (départ {eur(p.initialValue)})</div>
          </div>
          <div className="bstat bstat-big">
            <div className={`bstat-value ${cls(p.pnl)}`}>
              {p.pnl >= 0 ? "+" : ""}
              {eur(p.pnl)}
            </div>
            <div className="bstat-label">P&amp;L</div>
          </div>
          <div className="bstat bstat-big">
            <div className={`bstat-value ${cls(p.return)}`}>{pct(p.return, true)}</div>
            <div className="bstat-label">rendement</div>
          </div>
          <div className="bstat bstat-big">
            <div className="bstat-value neg">{pct(p.maxDrawdown)}</div>
            <div className="bstat-label">max drawdown</div>
          </div>
        </div>
      </header>

      <section className="panel">
        <h2 className="panel-title">
          📡 Forward (live) — depuis {live.startDate}, mis à jour {live.updatedAt}
        </h2>
        <div className="bstats">
          <div className="bstat bstat-big">
            <div className={`bstat-value ${cls(live.portfolio.return)}`}>{pct(live.portfolio.return, true)}</div>
            <div className="bstat-label">rendement forward ({live.days} j)</div>
          </div>
          <div className="bstat bstat-big">
            <div className="bstat-value">{eur(live.portfolio.finalValue)}</div>
            <div className="bstat-label">valeur (départ {eur(live.capital)})</div>
          </div>
          <div className="bstat bstat-big">
            <div className="bstat-value neg">{pct(live.portfolio.maxDrawdown)}</div>
            <div className="bstat-label">max drawdown</div>
          </div>
        </div>
        <Chart curve={live.portfolio.curve.map((c) => c.value)} base={live.capital} />
        <p className="meta-line">
          🤖 Mis à jour <strong>chaque jour</strong> (GitHub Actions) sur les vraies données de marché. Params
          figés au {live.startDate} — c&apos;est du <strong>vrai forward</strong>, pas du backtest rétro-ajusté.
        </p>
      </section>

      <section className="panel">
        <h2 className="panel-title">Réplay backtest (période out-of-sample)</h2>
        <Chart curve={p.curve} base={paper.capital} />
      </section>

      <section className="panel">
        <h2 className="panel-title">Positions ({paper.positions.length})</h2>
        <div className="table-wrap">
          <table className="bt-table">
            <thead>
              <tr>
                <th className="left">bot</th>
                <th className="left">stratégie</th>
                <th>poids</th>
                <th>montant</th>
                <th>valeur finale</th>
                <th>rendement</th>
                <th>α vs hold</th>
                <th>win</th>
              </tr>
            </thead>
            <tbody>
              {paper.positions.map((pos: Pos) => (
                <tr key={pos.fullName}>
                  <td className="left">
                    <Link href={`/bot/${pos.owner}/${pos.repo}`}>{pos.fullName}</Link>
                  </td>
                  <td className="left muted">{pos.strategy}</td>
                  <td>{pct(pos.weight)}</td>
                  <td>{eur(pos.amount)}</td>
                  <td>{eur(pos.finalValue)}</td>
                  <td className={cls(pos.return)}>{pct(pos.return, true)}</td>
                  <td className={cls(pos.alpha)}>{pct(pos.alpha, true)}</td>
                  <td>{pos.winRate == null ? "—" : pct(pos.winRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">Et après ?</h2>
        <p className="prose">
          Ce portefeuille est <strong>statique</strong> (rejoué sur la période backtest). Le vrai{" "}
          <em>paper trading forward</em> (suivi en temps réel sur des données live, sans argent) puis l&apos;
          exécution réelle (wallet burner, micro-montants) sont les étapes suivantes — gérées hors de ce site
          statique. On n&apos;alloue jamais de capital réel sans un track record papier positif.
        </p>
        <p className="meta-line">
          <Link href="/backtests">← retour au leaderboard backtests</Link>
        </p>
      </section>

      <footer className="footer">
        ⚠️ Paper trading simulé. Les performances passées simulées ne préjugent pas des résultats futurs.
      </footer>
    </main>
  )
}

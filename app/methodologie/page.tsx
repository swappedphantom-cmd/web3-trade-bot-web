import Link from "next/link"

export const metadata = { title: "Méthodologie — Web3 Trading Bot Index" }

export default function Page() {
  return (
    <main>
      <header className="hero">
        <Link className="backlink" href="/">
          ← retour à l&apos;index
        </Link>
        <h1>
          Méthodologie <span className="accent">🔬</span>
        </h1>
        <p className="subtitle">
          Comment les bots sont notés, et ce que les backtests simulés mesurent vraiment.
        </p>
      </header>

      <section className="panel">
        <h2 className="panel-title">1. Découverte & analyse statique</h2>
        <p className="prose">
          Les bots sont découverts sur GitHub via des recherches ciblées, puis analysés{" "}
          <strong>statiquement</strong> (jamais exécutés) : chaînes, DEX, stratégies, et surtout{" "}
          <strong>red flags de sécurité</strong> (clés en dur, drainers…). Le <em>score code</em> (0-100)
          pondère popularité, activité, qualité et sécurité (la sécurité compte pour 25 %).
        </p>
      </section>

      <section className="panel">
        <h2 className="panel-title">2. Backtests simulés (out-of-sample)</h2>
        <p className="prose">
          Pour les stratégies <strong>backtestables sur prix</strong> (grid, DCA, market-making), on rejoue
          la stratégie sur des données de marché réelles. Points clés :
        </p>
        <ul className="prose">
          <li>
            <strong>Multi-actifs</strong> : chaque bot est testé sur un panier d&apos;actifs liquides de ses
            chaînes, puis moyenné — moins « cherry-pické » qu&apos;un seul marché.
          </li>
          <li>
            <strong>Walk-forward</strong> : les paramètres sont calibrés sur une période, puis la performance
            n&apos;est mesurée que sur une période <strong>jamais vue</strong>. C&apos;est le chiffre honnête
            (anti-overfitting).
          </li>
          <li>
            <strong>Frais + slippage</strong> appliqués à chaque trade, P&amp;L réalisé en FIFO.
          </li>
        </ul>
        <p className="prose">
          Stratégies <strong>non backtestables</strong> (MEV, sandwich, frontrun, sniping…) : elles dépendent
          du mempool, de la latence et de la compétition — un backtest historique mentirait. Elles ne reçoivent
          donc pas de performance simulée.
        </p>
      </section>

      <section className="panel">
        <h2 className="panel-title">3. Lire les métriques</h2>
        <ul className="prose">
          <li>
            <strong>α vs hold</strong> — rendement du bot moins un simple buy &amp; hold. <em>Le</em> test :
            bat-il le fait de juste détenir l&apos;actif ?
          </li>
          <li>
            <strong>win rate</strong> — part de trades clôturés gagnants.
          </li>
          <li>
            <strong>profit factor</strong> — gains réalisés ÷ pertes réalisées (&gt; 1 = profitable sur les
            trades clôturés).
          </li>
          <li>
            <strong>Sharpe / Sortino</strong> — rendement risque-ajusté (Sortino ne pénalise que la
            volatilité <em>baissière</em>).
          </li>
          <li>
            <strong>drawdown</strong> — pire perte pic-à-creux.
          </li>
        </ul>
      </section>

      <section className="panel">
        <h2 className="panel-title">⚠️ Honnêteté</h2>
        <p className="prose">
          Les profits affichés sont <strong>simulés</strong>, pas réels. Sur la période testée, la plupart des
          bots sont <strong>négatifs en absolu</strong> — mais beaucoup <strong>battent le hold</strong>{" "}
          (α &gt; 0). C&apos;est exactement le signal que cet index apporte par-dessus le buzz : mesurer plutôt
          que croire. Les performances passées simulées ne préjugent pas des résultats futurs.
        </p>
        <p className="meta-line">
          <Link href="/backtests">→ voir le leaderboard backtests</Link>
        </p>
      </section>

      <footer className="footer">⚠️ Ne jamais exécuter un bot tiers avec une vraie clé privée.</footer>
    </main>
  )
}

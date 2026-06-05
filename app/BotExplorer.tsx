"use client"

import { useEffect, useMemo, useState } from "react"
import type { Bot, Dataset } from "../lib/types"
import { securityBadge, combinedRank } from "../lib/types"

const PROFIT_STRATEGIES = ["arbitrage", "mev", "sniping", "flashloan-arb", "sandwich"]
const fmtPct = (x: number) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(0)}%`
type Sort = "rank" | "score" | "buzz" | "backtest" | "alpha"

export default function BotExplorer({ data }: { data: Dataset }) {
  const [q, setQ] = useState("")
  const [chain, setChain] = useState("")
  const [dex, setDex] = useState("")
  const [strategy, setStrategy] = useState("")
  const [cleanOnly, setCleanOnly] = useState(false)
  const [formattedDate, setFormattedDate] = useState<string | null>(null)
  const hasSocial = !!data.social?.available
  const hasBacktest = !!data.backtest?.available
  const [sort, setSort] = useState<Sort>(hasSocial ? "rank" : "score")

  // Format date on client only to avoid hydration mismatch
  useEffect(() => {
    if (data.generatedAt) {
      setFormattedDate(new Date(data.generatedAt).toLocaleString("fr-FR"))
    }
  }, [data.generatedAt])

  const comparator = useMemo(() => {
    if (sort === "buzz") return (a: Bot, b: Bot) => (b.socialScore ?? 0) - (a.socialScore ?? 0)
    if (sort === "rank") return (a: Bot, b: Bot) => combinedRank(b) - combinedRank(a)
    if (sort === "backtest") {
      const bt = (x: Bot) => (x.backtestable ? x.backtestReturn ?? -Infinity : -Infinity)
      return (a: Bot, b: Bot) => bt(b) - bt(a)
    }
    if (sort === "alpha") {
      const al = (x: Bot) => (x.backtestable ? x.backtestAlpha ?? -Infinity : -Infinity)
      return (a: Bot, b: Bot) => al(b) - al(a)
    }
    return (a: Bot, b: Bot) => b.botScore - a.botScore
  }, [sort])

  const bots = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return data.bots
      .filter((b) => {
        if (cleanOnly && b.redFlagCount > 0) return false
        if (chain && !b.chains.includes(chain)) return false
        if (dex && !b.dexes.includes(dex)) return false
        if (strategy && !b.strategies.includes(strategy)) return false
        if (needle) {
          const hay = `${b.fullName} ${b.description} ${b.strategies.join(" ")} ${b.dexes.join(" ")}`.toLowerCase()
          if (!hay.includes(needle)) return false
        }
        return true
      })
      .sort(comparator)
  }, [data.bots, q, chain, dex, strategy, cleanOnly, comparator])

  return (
    <main>
      <header className="hero">
        <h1>
          Web3 Trading Bot Index <span className="accent">⚡</span>
        </h1>
        <p className="subtitle">
          Bots de trading DEX open-source découverts sur GitHub — classés par qualité, capacités et{" "}
          <strong>sécurité</strong>. Analyse statique, jamais d&apos;exécution.
        </p>
        {hasBacktest && (
          <a className="navlink" href="/backtests">
            📈 Leaderboard backtests — alpha, win rate, profit factor →
          </a>
        )}
        <div className="stats">
          <Stat label="bots analysés" value={data.stats.totalBots} />
          <Stat label="score moyen" value={data.stats.avgScore} />
          <Stat label="avec red flags" value={data.stats.flaggedBots} warn />
          <Stat label="chaînes" value={data.categories.chains.length} />
          <Stat label="stratégies" value={data.categories.strategies.length} />
          {hasBacktest && <Stat label="backtestés" value={data.backtest!.evaluated} />}
        </div>
        {formattedDate && (
          <p className="generated">Dernière analyse : {formattedDate}</p>
        )}
        {data.social?.simulated && (
          <p className="sim-banner">
            🔬 Le « buzz » X est actuellement <strong>simulé</strong> (mock) — branche un compte X pour des
            données réelles.
          </p>
        )}
        {data.backtest?.simulated && (
          <p className="sim-banner">
            📈 Les « profits » sont des <strong>backtests simulés</strong> out-of-sample (marché proxy par
            chaîne) — pas des gains réels. La plupart sont négatifs : le signal, pas la hype.
          </p>
        )}
      </header>

      <section className="controls">
        <input
          className="search"
          placeholder="Rechercher (nom, stratégie, DEX…)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Select label="Chaîne" value={chain} setValue={setChain} options={data.categories.chains} />
        <Select label="DEX" value={dex} setValue={setDex} options={data.categories.dexes} />
        <Select label="Stratégie" value={strategy} setValue={setStrategy} options={data.categories.strategies} />
        <select className="select" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          {hasSocial && <option value="rank">Trier : rang (qualité + buzz)</option>}
          <option value="score">Trier : score qualité</option>
          {hasSocial && <option value="buzz">Trier : profit / buzz 🔥</option>}
          {hasBacktest && <option value="backtest">Trier : profit backtest 📈</option>}
          {hasBacktest && <option value="alpha">Trier : bat le hold (α) 🎯</option>}
        </select>
        <label className="toggle">
          <input type="checkbox" checked={cleanOnly} onChange={(e) => setCleanOnly(e.target.checked)} />
          Sans red flag uniquement
        </label>
        <div className="quick">
          <button className="chip" onClick={() => setStrategy("arbitrage")}>
            arbitrage
          </button>
          <button className="chip" onClick={() => setStrategy("mev")}>
            MEV
          </button>
          <button className="chip" onClick={() => setStrategy("sniping")}>
            sniping
          </button>
          <button className="chip" onClick={() => setStrategy("copy-trading")}>
            copy-trading
          </button>
          {(chain || dex || strategy || q || cleanOnly) && (
            <button
              className="chip clear"
              onClick={() => {
                setQ("")
                setChain("")
                setDex("")
                setStrategy("")
                setCleanOnly(false)
              }}
            >
              ✕ réinitialiser
            </button>
          )}
        </div>
      </section>

      <p className="count">{bots.length} bot(s)</p>

      <section className="grid">
        {bots.map((b, i) => (
          <BotCard key={b.fullName} bot={b} rank={i + 1} />
        ))}
      </section>

      <footer className="footer">
        ⚠️ Outil d&apos;analyse. Ne jamais exécuter un bot tiers avec une vraie clé privée. Généré par{" "}
        <a href="https://github.com/swappedphantom-cmd/web3-trade-bot-analyzer">web3-trade-bot-analyzer</a>.
      </footer>
    </main>
  )
}

function BotCard({ bot, rank }: { bot: Bot; rank: number }) {
  const badge = securityBadge(bot.redFlagCount)
  const profit = bot.strategies.some((s) => PROFIT_STRATEGIES.includes(s))
  return (
    <a className="card" href={`https://github.com/${bot.fullName}`} target="_blank" rel="noreferrer">
      <div className="card-top">
        <span className="rank">#{rank}</span>
        <span className="card-top-right">
          {typeof bot.socialScore === "number" && bot.socialScore >= 60 && (
            <span className="badge badge-buzz" title="forte traction X / claims de profit">
              🔥 {bot.socialScore}
            </span>
          )}
          <span className={`badge ${badge.cls}`}>{badge.label}</span>
        </span>
      </div>
      <h3 className="name">
        {bot.fullName}
        {profit && <span className="profit" title="stratégie orientée profit">💰</span>}
      </h3>
      <p className="desc">{bot.description || "—"}</p>
      <div className="score-row">
        <div className="score-bar">
          <div className="score-fill" style={{ width: `${bot.botScore}%` }} />
        </div>
        <span className="score-num">{bot.botScore}</span>
      </div>
      <div className="tags">
        {bot.strategies.slice(0, 4).map((s) => (
          <span key={s} className="tag tag-strat">
            {s}
          </span>
        ))}
        {bot.chains.slice(0, 3).map((c) => (
          <span key={c} className="tag tag-chain">
            {c}
          </span>
        ))}
        {bot.dexes.slice(0, 3).map((d) => (
          <span key={d} className="tag tag-dex">
            {d}
          </span>
        ))}
      </div>
      {bot.backtestable && (
        <div className="bt-metrics" title="backtest simulé out-of-sample (moyenne multi-actifs)">
          <span
            className={(bot.backtestAlpha ?? 0) >= 0 ? "bt-pos" : "bt-neg"}
            title="alpha : rendement du bot moins un simple buy & hold sur la même période"
          >
            α {fmtPct(bot.backtestAlpha ?? 0)}
          </span>
          <span title="part de trades gagnants">
            win {bot.backtestWinRate == null ? "—" : `${Math.round(bot.backtestWinRate * 100)}%`}
          </span>
          <span title="nombre de trades simulés">{bot.backtestTrades ?? 0} tr</span>
          <span title="profit factor : gains réalisés / pertes réalisées">
            PF {bot.backtestProfitFactor == null ? "—" : bot.backtestProfitFactor.toFixed(1)}
          </span>
        </div>
      )}
      <div className="meta">
        <span>⭐ {bot.stars.toLocaleString("fr-FR")}</span>
        {bot.backtestable && typeof bot.backtestReturn === "number" && (
          <span
            className={`bt ${bot.backtestReturn >= 0 ? "bt-pos" : "bt-neg"}`}
            title={`backtest simulé ${bot.backtestStrategy}@${bot.backtestMarket} · sharpe ${bot.backtestSharpe} · drawdown ${Math.round((bot.backtestDrawdown ?? 0) * 100)}%`}
          >
            📈 {(bot.backtestReturn * 100).toFixed(1)}% sim
          </span>
        )}
        {typeof bot.socialScore === "number" && bot.mentions ? (
          <span title={`${bot.mentions} mentions X · ${Math.round((bot.profitRatio ?? 0) * 100)}% claims de profit`}>
            🔥 buzz {bot.socialScore}
          </span>
        ) : (
          <span>{bot.language || "—"}</span>
        )}
      </div>
    </a>
  )
}

function Stat({ label, value, warn }: { label: string; value: number | string; warn?: boolean }) {
  return (
    <div className="stat">
      <div className={`stat-value ${warn ? "stat-warn" : ""}`}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function Select({
  label,
  value,
  setValue,
  options,
}: {
  label: string
  value: string
  setValue: (v: string) => void
  options: string[]
}) {
  return (
    <select className="select" value={value} onChange={(e) => setValue(e.target.value)}>
      <option value="">{label} : tous</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

"use client"

import { Fragment, useMemo, useState } from "react"
import type { Bot } from "../../lib/types"

type Key =
  | "botScore"
  | "backtestReturn"
  | "backtestAlpha"
  | "backtestWinRate"
  | "backtestTrades"
  | "backtestProfitFactor"
  | "backtestSharpe"
  | "backtestSortino"
  | "backtestDrawdown"

const pct = (x: number | null | undefined, signed = false) =>
  x == null ? "—" : `${signed && x >= 0 ? "+" : ""}${(x * 100).toFixed(0)}%`
const num = (x: number | null | undefined, d = 1) => (x == null ? "—" : x.toFixed(d))
const sign = (x: number | null | undefined) => ((x ?? 0) >= 0 ? "pos" : "neg")

const COLS: {
  key: Key
  label: string
  title: string
  fmt: (b: Bot) => string
  cls?: (b: Bot) => string
}[] = [
  { key: "backtestAlpha", label: "α vs hold", title: "rendement du bot moins un simple buy & hold", fmt: (b) => pct(b.backtestAlpha, true), cls: (b) => sign(b.backtestAlpha) },
  { key: "backtestReturn", label: "rendement", title: "rendement out-of-sample simulé", fmt: (b) => pct(b.backtestReturn, true), cls: (b) => sign(b.backtestReturn) },
  { key: "backtestWinRate", label: "win", title: "part de trades gagnants", fmt: (b) => pct(b.backtestWinRate) },
  { key: "backtestTrades", label: "trades", title: "nombre de trades simulés", fmt: (b) => num(b.backtestTrades, 0) },
  { key: "backtestProfitFactor", label: "PF", title: "profit factor : gains/pertes réalisés", fmt: (b) => num(b.backtestProfitFactor, 1) },
  { key: "backtestSharpe", label: "Sharpe", title: "Sharpe annualisé (volatilité totale)", fmt: (b) => num(b.backtestSharpe, 2) },
  { key: "backtestSortino", label: "Sortino", title: "Sortino annualisé (risque baissier seul)", fmt: (b) => num(b.backtestSortino, 2) },
  { key: "backtestDrawdown", label: "drawdown", title: "pire perte pic-à-creux", fmt: (b) => pct(b.backtestDrawdown) },
  { key: "botScore", label: "score code", title: "qualité + sécurité du code", fmt: (b) => num(b.botScore, 0) },
]

function spark(data: number[], w: number, h: number, sw = 1.5) {
  const pad = 3
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const pts = data
    .map((v, i) => {
      const x = pad + (i * (w - 2 * pad)) / (data.length - 1)
      const y = h - pad - ((v - min) / span) * (h - 2 * pad)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")
  const up = data[data.length - 1]! >= data[0]!
  // baseline at value 1 (break-even)
  const yBase = 1 >= min && 1 <= max ? h - pad - ((1 - min) / span) * (h - 2 * pad) : null
  return (
    <svg width={w} height={h} className="spark" viewBox={`0 0 ${w} ${h}`}>
      {yBase != null && (
        <line x1={pad} x2={w - pad} y1={yBase} y2={yBase} stroke="#3a3f52" strokeWidth="1" strokeDasharray="3 3" />
      )}
      <polyline points={pts} fill="none" stroke={up ? "#00d4a0" : "#ff6b81"} strokeWidth={sw} />
    </svg>
  )
}

function Spark({ data, big = false }: { data?: number[]; big?: boolean }) {
  if (!data || data.length < 2) return <span className="muted">—</span>
  return big ? spark(data, 360, 90, 2) : spark(data, 88, 26, 1.5)
}

const uniq = (xs: string[]) => [...new Set(xs)].sort()

function Detail({ b }: { b: Bot }) {
  const items: [string, string, string?][] = [
    ["rendement", pct(b.backtestReturn, true), sign(b.backtestReturn)],
    ["α vs hold", pct(b.backtestAlpha, true), sign(b.backtestAlpha)],
    ["win rate", pct(b.backtestWinRate)],
    ["trades", num(b.backtestTrades, 0)],
    ["profit factor", num(b.backtestProfitFactor, 2)],
    ["Sharpe", num(b.backtestSharpe, 2)],
    ["Sortino", num(b.backtestSortino, 2)],
    ["drawdown", pct(b.backtestDrawdown)],
    ["exposition moy.", pct(b.backtestExposure)],
    ["marché", `${b.backtestStrategy} · ${b.backtestMarket}`],
  ]
  return (
    <div className="bt-detail">
      <div className="bt-detail-chart">
        <Spark data={b.backtestCurve} big />
        <span className="muted">courbe d&apos;équité out-of-sample (base 100, moyenne multi-actifs)</span>
      </div>
      <div className="bt-detail-grid">
        {items.map(([label, val, cls]) => (
          <div key={label} className="bt-kv">
            <span className="bt-kv-label">{label}</span>
            <span className={`bt-kv-val ${cls ?? ""}`}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function BacktestTable({ bots }: { bots: Bot[] }) {
  const [key, setKey] = useState<Key>("backtestAlpha")
  const [dir, setDir] = useState<1 | -1>(-1)
  const [chain, setChain] = useState("")
  const [strat, setStrat] = useState("")
  const [open, setOpen] = useState<string | null>(null)

  const chains = useMemo(() => uniq(bots.flatMap((b) => b.chains)), [bots])
  const strats = useMemo(() => uniq(bots.flatMap((b) => b.strategies)), [bots])

  const rows = useMemo(() => {
    const v = (b: Bot) => (b[key] ?? -Infinity) as number
    return bots
      .filter((b) => (!chain || b.chains.includes(chain)) && (!strat || b.strategies.includes(strat)))
      .sort((a, b) => (v(a) - v(b)) * dir)
  }, [bots, key, dir, chain, strat])

  const onSort = (k: Key) => {
    if (k === key) setDir((d) => (d === 1 ? -1 : 1))
    else {
      setKey(k)
      setDir(-1)
    }
  }
  const colSpan = 4 + COLS.length

  return (
    <>
      <div className="controls">
        <select className="select" value={chain} onChange={(e) => setChain(e.target.value)}>
          <option value="">Chaîne : toutes</option>
          {chains.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select className="select" value={strat} onChange={(e) => setStrat(e.target.value)}>
          <option value="">Stratégie : toutes</option>
          {strats.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {(chain || strat) && (
          <button
            className="chip clear"
            onClick={() => {
              setChain("")
              setStrat("")
            }}
          >
            ✕ réinitialiser
          </button>
        )}
        <span className="count">{rows.length} bot(s) · clique une ligne pour le détail</span>
      </div>

      <div className="table-wrap">
        <table className="bt-table">
          <thead>
            <tr>
              <th></th>
              <th className="left">bot</th>
              <th className="left">stratégie</th>
              <th>équité (oos)</th>
              {COLS.map((c) => (
                <th
                  key={c.key}
                  title={c.title}
                  onClick={() => onSort(c.key)}
                  className={key === c.key ? "sorted" : ""}
                >
                  {c.label}
                  {key === c.key ? (dir === -1 ? " ↓" : " ↑") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <Fragment key={b.fullName}>
                <tr
                  className="bt-row"
                  onClick={() => setOpen((o) => (o === b.fullName ? null : b.fullName))}
                >
                  <td className="muted">{open === b.fullName ? "▾" : "▸"}</td>
                  <td className="left">
                    <a href={`/bot/${b.owner}/${b.repo}`} onClick={(e) => e.stopPropagation()}>
                      {b.fullName}
                    </a>
                  </td>
                  <td className="left muted">
                    {b.backtestStrategy} · {b.backtestMarket}
                  </td>
                  <td>
                    <Spark data={b.backtestCurve} />
                  </td>
                  {COLS.map((c) => (
                    <td key={c.key} className={c.cls?.(b)}>
                      {c.fmt(b)}
                    </td>
                  ))}
                </tr>
                {open === b.fullName && (
                  <tr className="bt-detail-row">
                    <td colSpan={colSpan}>
                      <Detail b={b} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

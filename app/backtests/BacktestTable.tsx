"use client"

import { useMemo, useState } from "react"
import type { Bot } from "../../lib/types"

type Key =
  | "botScore"
  | "backtestReturn"
  | "backtestAlpha"
  | "backtestWinRate"
  | "backtestTrades"
  | "backtestProfitFactor"
  | "backtestSharpe"
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
  { key: "backtestSharpe", label: "Sharpe", title: "Sharpe annualisé (risque-ajusté)", fmt: (b) => num(b.backtestSharpe, 2) },
  { key: "backtestDrawdown", label: "drawdown", title: "pire perte pic-à-creux", fmt: (b) => pct(b.backtestDrawdown) },
  { key: "botScore", label: "score code", title: "qualité + sécurité du code", fmt: (b) => num(b.botScore, 0) },
]

function Spark({ data }: { data?: number[] }) {
  if (!data || data.length < 2) return <span className="muted">—</span>
  const w = 88
  const h = 26
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
  return (
    <svg width={w} height={h} className="spark" viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={up ? "#00d4a0" : "#ff6b81"} strokeWidth="1.5" />
    </svg>
  )
}

const uniq = (xs: string[]) => [...new Set(xs)].sort()

export default function BacktestTable({ bots }: { bots: Bot[] }) {
  const [key, setKey] = useState<Key>("backtestAlpha")
  const [dir, setDir] = useState<1 | -1>(-1)
  const [chain, setChain] = useState("")
  const [strat, setStrat] = useState("")

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
        <span className="count">{rows.length} bot(s)</span>
      </div>

      <div className="table-wrap">
        <table className="bt-table">
          <thead>
            <tr>
              <th>#</th>
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
            {rows.map((b, i) => (
              <tr key={b.fullName}>
                <td className="muted">{i + 1}</td>
                <td className="left">
                  <a href={`https://github.com/${b.fullName}`} target="_blank" rel="noreferrer">
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
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

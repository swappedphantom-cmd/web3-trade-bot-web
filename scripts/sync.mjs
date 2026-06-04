#!/usr/bin/env node
// Regenerate data/bots.json from a running web3-trade-bot-analyzer.
// Usage: ANALYZER_URL=http://localhost:3000 npm run sync
import { writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"

const BASE = (process.env.ANALYZER_URL || "http://localhost:3000").replace(/\/$/, "")
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "bots.json")

async function j(p) {
  const r = await fetch(`${BASE}${p}`)
  if (!r.ok) throw new Error(`${p} -> HTTP ${r.status}`)
  return r.json()
}

async function main() {
  const bots = []
  let offset = 0
  while (true) {
    const { bots: page } = await j(`/bots?limit=100&offset=${offset}`)
    if (!page?.length) break
    bots.push(...page)
    offset += page.length
    if (page.length < 100) break
  }
  const stats = await j("/stats")
  const categories = await j("/categories")
  const out = { generatedAt: stats.lastScan, stats, categories, bots }
  writeFileSync(OUT, JSON.stringify(out, null, 2))
  console.log(`synced ${bots.length} bots -> ${OUT}`)
}

main().catch((e) => {
  console.error("sync failed:", e.message)
  console.error("Is web3-trade-bot-analyzer running? (npm run dev in that project)")
  process.exit(1)
})

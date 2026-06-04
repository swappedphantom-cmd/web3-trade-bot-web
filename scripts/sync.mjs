#!/usr/bin/env node
// Regenerate data/bots.json from a running web3-trade-bot-analyzer, merging X social pulse.
// Usage: ANALYZER_URL=http://localhost:3000 npm run sync
import { writeFileSync, readFileSync, existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"

// 127.0.0.1 (not "localhost") so Node/undici doesn't resolve to IPv6 ::1 when the server is IPv4.
const BASE = (process.env.ANALYZER_URL || "http://127.0.0.1:3000").replace(/\/$/, "")
const HERE = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(HERE, "..", "data", "bots.json")
const SOCIAL_FILE =
  process.env.SOCIAL_FILE ||
  path.join(HERE, "..", "..", "web3-trade-bot-stack", "veille", "x-social-pulse", "social.json")

function loadSocial() {
  if (!existsSync(SOCIAL_FILE)) return null
  try {
    return JSON.parse(readFileSync(SOCIAL_FILE, "utf-8"))
  } catch {
    return null
  }
}

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

  // Merge X social pulse if the stack has produced it.
  const social = loadSocial()
  let socialMeta = { available: false, simulated: false, backend: null }
  if (social?.bots) {
    socialMeta = { available: true, simulated: !!social.simulated, backend: social.backend ?? null }
    for (const b of bots) {
      const s = social.bots[b.fullName]
      if (s) {
        b.socialScore = s.socialScore
        b.buzzVerdict = s.verdict
        b.profitRatio = s.profitRatio
        b.mentions = s.mentions
      }
    }
  }

  const out = { generatedAt: stats.lastScan, stats, categories, social: socialMeta, bots }
  writeFileSync(OUT, JSON.stringify(out, null, 2))
  console.log(`synced ${bots.length} bots${socialMeta.available ? ` + X buzz (${socialMeta.simulated ? "SIMULATED" : socialMeta.backend})` : ""} -> ${OUT}`)
}

main().catch((e) => {
  console.error("sync failed:", e.message)
  console.error("Is web3-trade-bot-analyzer running? (npm run dev in that project)")
  process.exit(1)
})

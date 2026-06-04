import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Web3 Trading Bot Index — best open-source DEX bots",
  description:
    "Ranked, security-audited open-source web3/DEX trading bots (arbitrage, MEV, sniping, copy-trading) discovered on GitHub.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

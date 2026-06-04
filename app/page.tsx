import dataset from "../data/bots.json"
import type { Dataset } from "../lib/types"
import BotExplorer from "./BotExplorer"

// Static-site generation: the JSON is bundled at build time, so the page is fully static
// and needs no backend at runtime — ideal for Vercel.
export default function Page() {
  const data = dataset as Dataset
  return <BotExplorer data={data} />
}

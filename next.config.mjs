/** @type {import('next').NextConfig} */
// Static export for GitHub Pages (project site served under /web3-trade-bot-web/).
const repo = "web3-trade-bot-web"
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath: `/${repo}`,
  trailingSlash: true,
  images: { unoptimized: true },
}

export default nextConfig

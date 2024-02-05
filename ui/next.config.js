/** @type {import("next").NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    maxBodyLength: 50 * 1024 * 1024,
    experimental: {
        proxyTimeout: 90000
    },
    output: "standalone"
}

module.exports = nextConfig

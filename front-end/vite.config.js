import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const cspReportOnlyPolicy = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https: http:",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'"
].join('; ')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    headers: {
      'Content-Security-Policy-Report-Only': cspReportOnlyPolicy
    }
  },
  preview: {
    headers: {
      'Content-Security-Policy-Report-Only': cspReportOnlyPolicy
    }
  }
})

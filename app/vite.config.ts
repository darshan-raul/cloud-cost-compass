import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api/mcp": {
        target: process.env.VITE_MCP_PROXY || "http://mcp-server:8000",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/mcp/, ""),
      },
      "/api/rag": {
        target: process.env.VITE_RAG_PROXY || "http://rag-service:8001",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/rag/, ""),
      },
      "/api/alerts": {
        target: process.env.VITE_ALERTS_PROXY || "http://alerts-service:8002",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/alerts/, ""),
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});

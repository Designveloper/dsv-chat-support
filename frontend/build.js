import { build } from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Get the API_URL from environment or use the default
const API_URL = process.env.VITE_API_URL || "http://localhost:3000";

build({
  entryPoints: ["./src/embed.tsx"],
  bundle: true,
  outfile: "dist/chat-widget.js",
  minify: false,
  sourcemap: false,
  target: ["es2015"],
  format: "iife",
  globalName: "ChatWidgetApp",
  external: [],
  plugins: [sassPlugin({
    type: "style",
  })],
  loader: {
    ".tsx": "tsx",
    ".ts": "ts",
    ".js": "jsx",
    ".svg": "dataurl",
  },
  define: {
    'global': 'window',
    // Replace import.meta.env with process.env values
    'import.meta.env.VITE_API_URL': JSON.stringify(API_URL),
    // Add any other environment variables you might be using
  },
}).catch((error) => {
  console.error("Build failed:", error);
  process.exit(1);
});
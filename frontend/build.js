import { build } from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";

build({
  entryPoints: ["./src/embed.tsx"],
  bundle: true,
  outfile: "public/chat-widget.js",
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
  },
}).catch((error) => {
  console.error("Build failed:", error);
  process.exit(1);
});
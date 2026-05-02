/**
 * Fetches NGX listed tickers + short names from afx.kwayisi.org (pages 1–2)
 * and writes src/data/ngx-listed-equities.json. Run when you need to refresh the universe.
 *
 * Usage: node scripts/seed-ngx-listed-equities.mjs
 */
import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "src", "data", "ngx-listed-equities.json");

function fetch(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "user-agent": "equiscan-seed/1.0" } }, (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => resolve(d));
      })
      .on("error", reject);
  });
}

function parsePage(html) {
  const out = [];
  const re =
    /href=https:\/\/afx\.kwayisi\.org\/ngx\/([a-z0-9-]+)\.html[^>]*title="([^"]*)"[^>]*>([A-Z0-9][A-Z0-9]*)<\/a><td><a/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const [, , title, symbol] = m;
    const companyName = title
      .replace(/&amp;/g, "&")
      .replace(/&#x27;/g, "'")
      .trim();
    out.push({ symbol, companyName });
  }
  return out;
}

(async () => {
  const h1 = await fetch("https://afx.kwayisi.org/ngx/");
  const h2 = await fetch("https://afx.kwayisi.org/ngx/?page=2");
  const bySymbol = new Map();
  for (const r of [...parsePage(h1), ...parsePage(h2)]) {
    if (!bySymbol.has(r.symbol)) bySymbol.set(r.symbol, r);
  }
  const equities = [...bySymbol.values()].sort((a, b) => a.symbol.localeCompare(b.symbol));
  const payload = {
    generatedAt: new Date().toISOString(),
    source: "https://afx.kwayisi.org/ngx/",
    count: equities.length,
    equities,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`Wrote ${equities.length} symbols to ${OUT}`);
})();

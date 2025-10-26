#!/usr/bin/env node
/**
 * fix-css.js
 * Recursively processes HTML files:
 *  - Removes ALL <link rel="stylesheet"...> tags except /air.css
 *  - Removes ALL <style>...</style> blocks
 *  - Ensures exactly one <link rel="stylesheet" href="/air.css"> before </head>
 *
 * Usage: node tools/fix-css.js <rootDir>
 * Example: node tools/fix-css.js ./public
 */
const fs = require("fs");
const path = require("path");

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const AIR_LINK = `<link rel="stylesheet" href="/air.css">`;

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (/\.(html?|xhtml)$/i.test(entry.name)) out.push(p);
  }
  return out;
}

function normalizeAirLinks(html) {
  // Remove any existing air.css link variants, then add one clean link
  html = html.replace(
    /<link[^>]+rel=["']stylesheet["'][^>]+href=["'][^"']*air\.css[^"']*["'][^>]*>\s*/gi,
    ""
  );
  // Insert before </head>. If no </head>, prepend to start.
  if (/<\/head>/i.test(html)) {
    html = html.replace(/<\/head>/i, `  ${AIR_LINK}\n</head>`);
  } else {
    html = `${AIR_LINK}\n${html}`;
  }
  return html;
}

function removeOtherStylesheets(html) {
  // Remove ALL stylesheet links (non-air.css). Run after normalizeAirLinks so we don't remove the one we just added.
  return html.replace(
    /<link[^>]+rel=["']stylesheet["'][^>]+>(?![^]*?<head>)/gi, // fallback
    (m) => (/air\.css/i.test(m) ? m : "")
  ).replace(
    /<link[^>]+rel=["']stylesheet["'][^>]+>(?!)/gi, // general
    (m) => (/air\.css/i.test(m) ? m : "")
  ).replace(
    /<link[^>]+rel=["']stylesheet["'][^>]+>(?=[\s\S]*<\/head>)/gi,
    (m) => (/air\.css/i.test(m) ? m : "")
  ).replace(
    /<link[^>]+rel=["']stylesheet["'][^>]+>/gi,
    (m) => (/air\.css/i.test(m) ? m : "")
  );
}

function removeStyleBlocks(html) {
  return html.replace(/<style[^>]*>[\s\S]*?<\/style>\s*/gi, "");
}

function processFile(file) {
  const src = fs.readFileSync(file, "utf8");

  // Work on a copy to be safe
  const bak = `${file}.bak`;
  if (!fs.existsSync(bak)) fs.writeFileSync(bak, src, "utf8");

  let html = src;

  // 1) Remove all <style> blocks
  html = removeStyleBlocks(html);

  // 2) Ensure exactly one clean air.css link
  html = normalizeAirLinks(html);

  // 3) Remove any other stylesheet links left
  html = removeOtherStylesheets(html);

  // 4) De-duplicate accidental multiple air.css inserts
  const airOnce = [];
  html = html.replace(
    /<link[^>]+rel=["']stylesheet["'][^>]+href=["'][^"']*air\.css[^"']*["'][^>]*>/gi,
    (m) => {
      if (airOnce.length) return ""; // keep only first
      airOnce.push(1);
      return AIR_LINK;
    }
  );

  fs.writeFileSync(file, html, "utf8");
  return true;
}

(function main() {
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    console.error("Provide a valid directory. Example: node tools/fix-css.js ./public");
    process.exit(1);
  }
  const files = walk(root);
  let changed = 0;
  for (const f of files) {
    try { if (processFile(f)) changed++; }
    catch (e) { console.error(`Failed ${f}:`, e.message); }
  }
  console.log(`Processed ${files.length} HTML file(s). Updated ${changed}. Backups saved as *.bak`);
})();

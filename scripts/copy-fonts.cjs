const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const out = path.join(root, "resources", "fonts");
fs.mkdirSync(out, { recursive: true });
const packages = [
  ["@fontsource-variable/dm-sans", "DM Sans"],
  ["@fontsource-variable/plus-jakarta-sans", "Plus Jakarta Sans"],
  ["@fontsource-variable/fraunces", "Fraunces"],
];
const faces = [];
for (const [pkg, family] of packages) {
  const pkgDir = path.dirname(require.resolve(pkg + "/package.json"));
  const css = fs.readFileSync(path.join(pkgDir, "index.css"), "utf8");
  const blocks = css.match(/\/\*[^]*?@font-face\s*\{[^}]+\}/g) || [];
  for (const block of blocks) {
    const file = block.match(/url\(\.\/files\/([^\)]+)\)/)?.[1];
    if (!file || !file.includes("latin") || !file.endsWith(".woff2")) continue;
    fs.copyFileSync(path.join(pkgDir, "files", file), path.join(out, file));
    faces.push(block.replace(/font-family:\s*'[^']+'/g, "font-family: '" + family + "'")
      .replace(/url\(\.\/files\/([^\)]+)\)/g, 'url("../resources/fonts/$1")'));
  }
}
const playfairDir = path.dirname(require.resolve("@fontsource/playfair-display/package.json"));
const playfairCss = fs.readFileSync(path.join(playfairDir, "index.css"), "utf8");
const playfairBlocks = playfairCss.match(/\/\*[^]*?@font-face\s*\{[^}]+\}/g) || [];
for (const block of playfairBlocks) {
  const file = block.match(/url\(\.\/files\/([^\)]+)\)/)?.[1];
  if (!file || !file.startsWith("playfair-display-latin-") || !file.endsWith(".woff2")) continue;
  if (!/400-italic|500-normal|600-normal|700-normal/.test(file)) continue;
  fs.copyFileSync(path.join(playfairDir, "files", file), path.join(out, file));
  faces.push(block.replace(/font-family:\s*'[^']+'/g, "font-family: 'Playfair Display'")
    .replace(/url\(\.\/files\/([^\)]+)\)/g, 'url("../resources/fonts/$1")'));
}
fs.writeFileSync(path.join(root, "css", "fonts.css"), "/* Locally hosted fonts with swap display. */\n" + faces.join("\n\n") + "\n");

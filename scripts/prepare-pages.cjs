const fs = require("node:fs/promises");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "dist");

const files = [
  "index.html",
  "notre-equipe.html",
  "articles.html",
  "questions_reponses.html",
  "favicon.ico",
  "favicon-16x16.png",
  "favicon-32x32.png",
  "apple-touch-icon.png",
  "android-chrome-192x192.png",
  "android-chrome-512x512.png",
  "site.webmanifest",
];

const directories = ["content", "partials", "resources"];
const stylesheets = [
  "articles.css",
  "fonts.css",
  "notre-equipe.css",
  "questions-reponses.css",
  "style.css",
  "tailwind.css",
];
const scripts = [
  "articles.js",
  "lucide.js",
  "main.js",
  "notre-equipe.js",
  "questions-reponses.js",
  "sanity.js",
  "services.js",
  "site-shell.js",
  "team-page-content.js",
];

async function copyFile(relativePath) {
  const source = path.join(root, relativePath);
  const target = path.join(output, relativePath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.copyFile(source, target);
}

async function copyDirectory(relativePath) {
  await fs.cp(
    path.join(root, relativePath),
    path.join(output, relativePath),
    { recursive: true },
  );
}

async function preparePages() {
  await fs.rm(output, { recursive: true, force: true });
  await fs.mkdir(output, { recursive: true });

  await Promise.all([
    ...files.map(copyFile),
    ...stylesheets.map((file) => copyFile(path.join("css", file))),
    ...scripts.map((file) => copyFile(path.join("js", file))),
    ...directories.map(copyDirectory),
  ]);

  await fs.writeFile(path.join(output, ".nojekyll"), "");
  console.log(`Prepared GitHub Pages site in ${path.relative(root, output)}/`);
}

preparePages().catch((error) => {
  console.error("Could not prepare the GitHub Pages site:", error);
  process.exitCode = 1;
});

#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const outDir = join(root, "assets/icons");
const workDir = join(tmpdir(), `shane-surge-icons-${process.pid}`);

const logos = "https://raw.githubusercontent.com/gilbarbara/logos/main/logos";
const flags = "https://raw.githubusercontent.com/lipis/flag-icons/main/flags/4x3";
const lucide = "https://raw.githubusercontent.com/lucide-icons/lucide/main/icons";

const iconSpecs = [
  ["hong-kong", "flag", `${flags}/hk.svg`],
  ["singapore", "flag", `${flags}/sg.svg`],
  ["japan", "flag", `${flags}/jp.svg`],
  ["united-states", "flag", `${flags}/us.svg`],
  ["china", "flag", `${flags}/cn.svg`],
  ["hong-kong-call", "flag-badge", `${flags}/hk.svg`, "phone"],
  ["singapore-call", "flag-badge", `${flags}/sg.svg`, "phone"],
  ["tiktok-japan", "flag-badge", `${flags}/jp.svg`, "tiktok"],
  ["tiktok-united-states", "flag-badge", `${flags}/us.svg`, "tiktok"],
  ["auto", "symbol", `${lucide}/gauge.svg`, "#366CFF"],
  ["route", "symbol", `${lucide}/route.svg`, "#5D5FEF"],
  ["openai", "logo", `${logos}/openai-icon.svg`, "#F4F6F5"],
  ["google", "logo", `${logos}/google-icon.svg`, "#F5F7FB"],
  ["telegram", "logo", `${logos}/telegram.svg`, "#EAF7FF"],
  ["media", "symbol", `${lucide}/play.svg`, "#FF3D68"],
  ["linkedin", "logo", `${logos}/linkedin-icon.svg`, "#EAF4FA"],
  ["tiktok", "logo", `${logos}/tiktok-icon.svg`, "#111216"],
  ["zoom", "logo", `${logos}/zoom-icon.svg`, "#EEF3FF"],
  ["github", "logo", `${logos}/github-icon.svg`, "#F2F3F5"],
  ["pikpak", "symbol", `${lucide}/cloud-download.svg`, "#6B4EFF"],
  ["apple", "logo", `${logos}/apple.svg`, "#F2F3F5"],
  ["microsoft", "logo", `${logos}/microsoft-icon.svg`, "#F5F7FB"],
  ["nas", "symbol", `${lucide}/server.svg`, "#1976D2"],
  ["crypto", "logo", `${logos}/bitcoin.svg`, "#FFF4DC"],
];

const escapeData = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

async function fetchSvg(url, color) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  let svg = await response.text();
  if (color) svg = svg.replaceAll("currentColor", color).replaceAll("#000000", color).replaceAll("#000", color);
  return svg;
}

function frame(inner, background = "#F4F5F7") {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#111827" flood-opacity=".15"/></filter></defs>
  <rect x="26" y="26" width="460" height="460" rx="112" fill="${background}" filter="url(#s)"/>
  <rect x="27" y="27" width="458" height="458" rx="111" fill="none" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="2"/>
  ${inner}
</svg>`;
}

function badge(kind) {
  if (kind === "phone") {
    return `<circle cx="398" cy="390" r="82" fill="#16A36A" stroke="#fff" stroke-width="12"/><path d="M360 350c7-7 22-2 31 13l8 15c4 7 2 15-4 20l-11 9c11 19 26 34 45 45l9-11c5-6 13-8 20-4l15 8c15 9 20 24 13 31l-13 13c-12 12-38 7-64-9-24-15-46-37-61-61-16-26-21-52-9-64z" fill="#fff" transform="translate(-18 -20) scale(.9)"/>`;
  }
  return `<circle cx="398" cy="390" r="82" fill="#111216" stroke="#fff" stroke-width="12"/><path d="M397 348v76c0 19-15 34-34 34s-34-15-34-34 15-34 34-34c4 0 8 1 12 2v22c-4-3-8-5-12-5-8 0-15 7-15 15s7 15 15 15 15-7 15-15v-96h21c4 14 14 25 28 30v22c-12-2-22-7-30-14z" fill="#fff"/>`;
}

async function render([name, type, url, option]) {
  const source = await fetchSvg(url, type === "symbol" ? "#FFFFFF" : undefined);
  const data = escapeData(source);
  let svg;
  if (type === "flag" || type === "flag-badge") {
    const inner = `<defs><clipPath id="flag"><rect x="56" y="56" width="400" height="400" rx="92"/></clipPath></defs><image href="${data}" x="56" y="56" width="400" height="400" preserveAspectRatio="xMidYMid slice" clip-path="url(#flag)"/>${type === "flag-badge" ? badge(option) : ""}`;
    svg = frame(inner, "#FFFFFF");
  } else {
    const size = type === "logo" ? 270 : 230;
    const pos = (512 - size) / 2;
    svg = frame(`<image href="${data}" x="${pos}" y="${pos}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`, option);
  }

  const svgPath = join(workDir, `${name}.svg`);
  const pngPath = join(outDir, `${name}.png`);
  await writeFile(svgPath, svg);
  execFileSync("sips", ["-s", "format", "png", svgPath, "--out", pngPath], { stdio: "ignore" });
  execFileSync("sips", ["-z", "256", "256", pngPath], { stdio: "ignore" });
}

await mkdir(outDir, { recursive: true });
await mkdir(workDir, { recursive: true });
await Promise.all(iconSpecs.map(render));
await rm(workDir, { recursive: true, force: true });

const generated = (await Promise.all(iconSpecs.map(async ([name]) => {
  const file = await readFile(join(outDir, `${name}.png`));
  return `${basename(name)}.png\t${file.byteLength} bytes`;
}))).join("\n");
console.log(generated);

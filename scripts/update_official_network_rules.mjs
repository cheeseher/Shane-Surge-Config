import { readFile, writeFile } from "node:fs/promises";
import { isIP } from "node:net";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configPath = path.join(repoRoot, "By-Shane.conf");

const sources = {
  openaiVoice: "https://openai.com/chatgpt-voice.json",
  zoomIPv4: "https://assets.zoom.us/docs/ipranges/ZoomMeetings.txt",
  zoomIPv6: "https://assets.zoom.us/docs/ipranges/ZoomMeetings-IPv6.txt",
};

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Shane-Surge-Config official-rule-updater" },
  });
  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`);
  }
  return response.text();
}

function validateCIDR(value, expectedVersion) {
  const [address, prefix, ...extra] = value.trim().split("/");
  const version = isIP(address);
  const prefixNumber = Number(prefix);
  const maxPrefix = expectedVersion === 4 ? 32 : 128;

  if (
    extra.length
    || version !== expectedVersion
    || !Number.isInteger(prefixNumber)
    || prefixNumber < 0
    || prefixNumber > maxPrefix
  ) {
    throw new Error(`Invalid IPv${expectedVersion} CIDR: ${value}`);
  }
  return `${address.toLowerCase()}/${prefixNumber}`;
}

function unique(values) {
  return [...new Set(values)];
}

function replaceBlock(source, label, lines) {
  const begin = `# BEGIN AUTO-UPDATE: ${label}`;
  const end = `# END AUTO-UPDATE: ${label}`;
  const start = source.indexOf(begin);
  const finish = source.indexOf(end);

  if (start < 0 || finish < 0 || finish <= start) {
    throw new Error(`Missing or invalid marker block: ${label}`);
  }

  const replacement = `${begin}\n${lines.join("\n")}\n${end}`;
  return `${source.slice(0, start)}${replacement}${source.slice(finish + end.length)}`;
}

const [openaiText, zoomIPv4Text, zoomIPv6Text] = await Promise.all([
  fetchText(sources.openaiVoice),
  fetchText(sources.zoomIPv4),
  fetchText(sources.zoomIPv6),
]);

const openaiPayload = JSON.parse(openaiText);
const openaiIPv4 = unique((openaiPayload.prefixes || [])
  .map((item) => item.ipv4Prefix)
  .filter(Boolean)
  .map((cidr) => validateCIDR(cidr, 4)));

const zoomIPv4 = unique(zoomIPv4Text.split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  .map((cidr) => validateCIDR(cidr, 4)));

const zoomIPv6 = unique(zoomIPv6Text.split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  .map((cidr) => validateCIDR(cidr, 6)));

if (!openaiIPv4.length || !zoomIPv4.length || !zoomIPv6.length) {
  throw new Error("An official source returned an empty IP list; config was not changed.");
}

const original = await readFile(configPath, "utf8");
let updated = replaceBlock(
  original,
  "ChatGPT Voice official IP",
  openaiIPv4.map((cidr) => `IP-CIDR,${cidr},人工智能,no-resolve`),
);
updated = replaceBlock(
  updated,
  "Zoom Meetings official IP",
  [
    ...zoomIPv4.map((cidr) => `IP-CIDR,${cidr},Zoom会议,no-resolve`),
    ...zoomIPv6.map((cidr) => `IP-CIDR6,${cidr},Zoom会议,no-resolve`),
  ],
);

if (updated !== original) {
  await writeFile(configPath, updated, "utf8");
  console.log(`Updated ${openaiIPv4.length} ChatGPT Voice and ${zoomIPv4.length + zoomIPv6.length} Zoom prefixes.`);
} else {
  console.log(`Official IP rules are current: ${openaiIPv4.length} ChatGPT Voice, ${zoomIPv4.length + zoomIPv6.length} Zoom.`);
}

const services = [
  { name: "Netflix", url: "https://www.netflix.com/title/81215567", policy: "国际媒体" },
  { name: "YouTube", url: "https://www.youtube.com/generate_204", policy: "国际媒体" },
  { name: "Disney+", url: "https://www.disneyplus.com/robots.txt", policy: "国际媒体" },
  { name: "Prime Video", url: "https://www.primevideo.com/robots.txt", policy: "国际媒体" },
  { name: "Max", url: "https://www.max.com/robots.txt", policy: "国际媒体" },
  { name: "TikTok", url: "https://www.tiktok.com/robots.txt", policy: "TikTok" },
];

const nameWidth = 12;
const latencyWidth = 8;

function formatLine(item) {
  const label = item.name.padEnd(nameWidth, " ");
  const status = item.reachable
    ? `${`${item.latency} ms`.padStart(latencyWidth, " ")}   ✓`
    : `${"".padStart(latencyWidth, " ")}   ✕`;
  return `${label}\t${status}`;
}

function check(service, callback) {
  const started = Date.now();
  $httpClient.get({
    url: service.url,
    policy: service.policy,
    timeout: 8,
    "auto-cookie": false,
    "auto-redirect": false,
    headers: {
      "User-Agent": "Mozilla/5.0 Shane-Surge Media Check",
      Range: "bytes=0-1023",
    },
  }, (error, response) => {
    const latency = Date.now() - started;
    const status = response && Number(response.status || response.statusCode);
    const reachable = !error && status >= 200 && status < 500;
    callback({ ...service, reachable, latency, status });
  });
}

const results = [];
services.forEach((service) => check(service, (result) => {
  results.push(result);
  if (results.length !== services.length) return;

  results.sort((a, b) => services.findIndex((item) => item.name === a.name) - services.findIndex((item) => item.name === b.name));
  const okCount = results.filter((item) => item.reachable).length;
  const lines = results.map(formatLine);

  $done({
    title: `媒体连通性 · ${okCount}/${services.length}`,
    content: `${lines.join("\n")}\n\n仅检测网络，不代表片库或会员权益。`,
    icon: okCount === services.length ? "play.tv.fill" : "exclamationmark.tv.fill",
    "icon-color": okCount === services.length ? "#788C5D" : "#D97757",
  });
}));

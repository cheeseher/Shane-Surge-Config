const services = [
  { name: "ChatGPT", url: "https://chatgpt.com/cdn-cgi/trace", policy: "人工智能" },
  { name: "Claude", url: "https://claude.ai/cdn-cgi/trace", policy: "人工智能" },
  { name: "Grok", url: "https://grok.com/cdn-cgi/trace", policy: "人工智能" },
  { name: "Gemini", url: "https://gemini.google.com/", policy: "谷歌服务" },
  { name: "GitHub", url: "https://api.github.com/zen", policy: "开发服务" },
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
    headers: { "User-Agent": "Mozilla/5.0 Shane-Surge Connectivity Check" },
  }, (error, response) => {
    const latency = Date.now() - started;
    const status = response && Number(response.status || response.statusCode);
    const reachable = !error && status >= 200 && status < 500;
    callback({ ...service, reachable, latency, status, error });
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
    title: `AI 连通性 · ${okCount}/${services.length}`,
    content: lines.join("\n"),
    icon: okCount === services.length ? "checkmark.icloud.fill" : "exclamationmark.icloud.fill",
    "icon-color": okCount === services.length ? "#788C5D" : "#D97757",
  });
}));

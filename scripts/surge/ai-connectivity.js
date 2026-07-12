const services = [
  { name: "ChatGPT", url: "https://chatgpt.com/cdn-cgi/trace", policy: "人工智能" },
  { name: "Claude", url: "https://claude.ai/cdn-cgi/trace", policy: "人工智能" },
  { name: "Grok", url: "https://grok.com/cdn-cgi/trace", policy: "人工智能" },
  { name: "Gemini", url: "https://gemini.google.com/", policy: "谷歌服务" },
];

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
  const lines = results.map((item) => item.reachable
    ? `${item.name}：可连接 · ${item.latency} ms`
    : `${item.name}：连接失败${item.status ? ` · HTTP ${item.status}` : ""}`);

  $done({
    title: `AI 连通性 · ${okCount}/${services.length}`,
    content: `${lines.join("\n")}\n\n出口：ChatGPT / Claude / Grok → 人工智能；Gemini → 谷歌服务`,
    icon: okCount === services.length ? "checkmark.icloud.fill" : "exclamationmark.icloud.fill",
    "icon-color": okCount === services.length ? "#788C5D" : "#D97757",
  });
}));

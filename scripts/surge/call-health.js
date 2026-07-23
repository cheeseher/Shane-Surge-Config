const services = [
  {
    name: "Telegram",
    group: "电报消息",
    probeUrl: "https://telegram.org/",
    domainPattern: /telegram|t\.me|149\.154\.|91\.108\./i,
  },
  {
    name: "Zoom",
    group: "Zoom会议",
    probeUrl: "https://zoom.us/",
    domainPattern: /zoom\.us|zoom\.com|zoom\.cn|zoomgov|\/zoom\.us/i,
  },
];

function api(method, path, body = null) {
  return new Promise((resolve) => {
    $httpAPI(method, path, body, (result) => resolve(result || {}));
  });
}

async function resolvePolicy(group) {
  let current = group;
  const path = [];
  const visited = new Set();

  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || visited.has(current)) break;
    visited.add(current);
    path.push(current);
    const payload = await api(
      "GET",
      `/v1/policy_groups/select?group_name=${encodeURIComponent(current)}`,
    );
    const next = payload.policy || payload.selected || payload.selection;
    if (!next || next === current) break;
    current = next;
  }
  return path.slice(1).join(" › ") || current || "未知";
}

function probe(service) {
  return new Promise((resolve) => {
    const started = Date.now();
    $httpClient.get({
      url: service.probeUrl,
      policy: service.group,
      timeout: 8,
      "auto-cookie": false,
      "auto-redirect": false,
      headers: { "User-Agent": "Mozilla/5.0 Shane-Surge Call Health" },
    }, (error, response) => {
      const status = response && Number(response.status || response.statusCode);
      resolve({
        reachable: !error && status >= 200 && status < 500,
        latency: Date.now() - started,
      });
    });
  });
}

function requestList(payload, preferredKey) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload[preferredKey])) return payload[preferredKey];
  if (payload && Array.isArray(payload.requests)) return payload.requests;
  return [];
}

function requestTime(request) {
  let value = Number(request.completedDate || request.startDate || 0);
  if (value > 1000000000000) value /= 1000;
  return value;
}

function requestText(request) {
  const notes = Array.isArray(request.notes) ? request.notes.join(" ") : String(request.notes || "");
  return [
    request.URL,
    request.url,
    request.remoteHost,
    request.processPath,
    request.remark,
    notes,
  ].filter(Boolean).join(" ");
}

function matchesService(request, service) {
  const text = requestText(request);
  return text.toLowerCase().includes(`use policy: ${service.group}`.toLowerCase())
    || service.domainPattern.test(text);
}

function isInternalProbe(request) {
  return String(request.processPath || "").toLowerCase() === "<internal>";
}

function protocolOf(request) {
  const method = String(request.method || request.protocol || request.type || "").toUpperCase();
  const url = String(request.URL || request.url || "").toUpperCase();
  if (/UDP|QUIC|STUN/.test(method) || url.startsWith("UDP:")) return "udp";
  if (method || url) return "tcp";
  return "unknown";
}

function isFailed(request) {
  const status = `${request.status || ""} ${request.remark || ""}`;
  return request.failed === true
    || request.rejected === true
    || /failed|reject|timeout|error/i.test(status);
}

function analyzeTraffic(requests, service) {
  const matched = requests.filter((request) => !isInternalProbe(request) && matchesService(request, service));
  const protocols = new Set(matched.map(protocolOf));
  const failures = matched.filter(isFailed).length;
  return {
    count: matched.length,
    udp: protocols.has("udp"),
    tcp: protocols.has("tcp"),
    failures,
  };
}

function classify(traffic, basicReachable) {
  if (traffic.failures > 0 && !traffic.udp) {
    return { label: "连接异常", symbol: "✕", level: 2, kind: "bad" };
  }
  if (traffic.udp && traffic.failures > 0) {
    return { label: "UDP · 有异常", symbol: "!", level: 1, kind: "warn" };
  }
  if (traffic.udp && traffic.tcp) {
    return { label: "UDP + TCP", symbol: "✓", level: 0, kind: "good" };
  }
  if (traffic.udp) {
    return { label: "UDP 活跃", symbol: "✓", level: 0, kind: "good" };
  }
  if (traffic.tcp) {
    return { label: "TCP 回退", symbol: "!", level: 1, kind: "warn" };
  }
  if (!basicReachable) {
    return { label: "基础连接失败", symbol: "✕", level: 2, kind: "bad" };
  }
  return { label: "等待通话数据", symbol: "—", level: 0, kind: "idle" };
}

function formatRow(name, state) {
  return `${name.padEnd(12, " ")}\t${state.label.padEnd(12, " ")}  ${state.symbol}`;
}

(async () => {
  // 先读取流量快照，再发起基础 HTTP 探测，避免探测请求被误判为应用 TCP 流量。
  const [activePayload, recentPayload] = await Promise.all([
    api("GET", "/v1/requests/active"),
    api("GET", "/v1/requests/recent"),
  ]);

  const now = Date.now() / 1000;
  const active = requestList(activePayload, "active-requests");
  const recent = requestList(recentPayload, "recent-requests")
    .filter((request) => !requestTime(request) || now - requestTime(request) <= 1200);
  const seen = new Set();
  const requests = [...active, ...recent].filter((request) => {
    const key = request.id || `${request.startDate || ""}-${request.URL || request.remoteHost || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const [telegramProbe, zoomProbe, telegramPolicy, zoomPolicy] = await Promise.all([
    probe(services[0]),
    probe(services[1]),
    resolvePolicy(services[0].group),
    resolvePolicy(services[1].group),
  ]);

  const probes = [telegramProbe, zoomProbe];
  const states = services.map((service, index) => {
    const traffic = analyzeTraffic(requests, service);
    return classify(traffic, probes[index].reachable);
  });
  const basicCount = probes.filter((item) => item.reachable).length;
  const highestLevel = Math.max(...states.map((state) => state.level));
  const goodCount = states.filter((state) => state.kind === "good").length;

  let titleState = "等待实测";
  let iconColor = "#6A9BCC";
  if (highestLevel >= 2 || basicCount < services.length) {
    titleState = "需检查";
    iconColor = "#B04A3F";
  } else if (highestLevel === 1) {
    titleState = "需确认";
    iconColor = "#D97757";
  } else if (goodCount === services.length) {
    titleState = "UDP 已检测";
    iconColor = "#788C5D";
  }

  const policies = [telegramPolicy, zoomPolicy];
  const basicSymbol = basicCount === services.length ? "✓" : (basicCount === 0 ? "✕" : "!");
  const lines = states.map((state, index) => formatRow(services[index].name, state));
  lines.push(`基础连接：${basicCount}/${services.length}  ${basicSymbol}`);
  lines.push(`出口：TG ${policies[0]} · Zoom ${policies[1]}`);
  lines.push("通话中保持 10–20 秒后刷新。");
  lines.push("TCP 回退不等于断线；请以双向语音实测为准。");

  $done({
    title: `通话路径 · ${titleState}`,
    content: lines.join("\n"),
    icon: "phone.fill",
    "icon-color": iconColor,
  });
})().catch((error) => {
  $done({
    title: "通话路径 · 检测失败",
    content: `无法读取 Surge 当前连接。\n${String(error && error.message ? error.message : error)}`,
    icon: "exclamationmark.triangle.fill",
    "icon-color": "#B04A3F",
  });
});

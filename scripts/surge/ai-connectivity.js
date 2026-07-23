const services = [
  {
    name: "ChatGPT",
    url: "https://chatgpt.com/cdn-cgi/trace",
    policy: "人工智能",
    regionFromBody: true,
    supportedRegions: ["US", "JP", "SG", "TW"],
  },
  {
    name: "Claude",
    url: "https://claude.ai/cdn-cgi/trace",
    policy: "人工智能",
    regionFromBody: true,
    supportedRegions: ["US", "JP", "SG", "TW"],
  },
  {
    name: "Grok",
    url: "https://grok.com/cdn-cgi/trace",
    policy: "人工智能",
    regionFromBody: true,
    supportedRegions: ["US", "JP", "SG", "TW"],
  },
  {
    name: "Gemini",
    url: "https://gemini.google.com/",
    regionUrl: "https://www.cloudflare.com/cdn-cgi/trace",
    policy: "谷歌服务",
    supportedRegions: ["US", "JP", "SG", "TW", "HK"],
  },
  {
    name: "GitHub",
    url: "https://api.github.com/zen",
    policy: "开发服务",
  },
];

const regionNames = {
  US: "美国",
  JP: "日本",
  SG: "新加坡",
  TW: "台湾",
  HK: "香港",
};

function api(method, path, body = null) {
  return new Promise((resolve) => {
    $httpAPI(method, path, body, (result) => resolve(result || {}));
  });
}

function request(url, policy) {
  return new Promise((resolve) => {
    const started = Date.now();
    $httpClient.get({
      url,
      policy,
      timeout: 8,
      "auto-cookie": false,
      "auto-redirect": false,
      headers: { "User-Agent": "Mozilla/5.0 Shane-Surge Connectivity Check" },
    }, (error, response, data) => {
      const status = response && Number(response.status || response.statusCode);
      const headers = response && (response.headers || response.header) || {};
      const dateHeader = headers.Date || headers.date;
      const serverTime = dateHeader ? Date.parse(dateHeader) : NaN;
      resolve({
        error,
        status,
        data: String(data || ""),
        latency: Date.now() - started,
        clockSkew: Number.isFinite(serverTime) ? Math.abs(Date.now() - serverTime) : null,
      });
    });
  });
}

function parseRegion(body) {
  const match = String(body || "").match(/(?:^|\n)loc=([A-Z]{2})(?:\n|$)/);
  return match ? match[1] : "";
}

function classify(result) {
  if (!result.error && result.status >= 200 && result.status < 400) {
    return { kind: "good", label: "正常", symbol: "✓" };
  }
  if (!result.error && (result.status === 403 || result.status === 451)) {
    return { kind: "warn", label: `受限 ${result.status}`, symbol: "!" };
  }
  if (!result.error && result.status >= 400 && result.status < 500) {
    return { kind: "warn", label: `HTTP ${result.status}`, symbol: "!" };
  }
  return { kind: "bad", label: "不可连接", symbol: "✕" };
}

async function resolvePolicy(group) {
  let current = group;
  const visited = new Set();

  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || visited.has(current)) break;
    visited.add(current);
    const payload = await api(
      "GET",
      `/v1/policy_groups/select?group_name=${encodeURIComponent(current)}`,
    );
    const next = payload.policy || payload.selected || payload.selection;
    if (!next || next === current) break;
    current = next;
  }
  return current || "未知";
}

function formatService(service, result) {
  const state = classify(result);
  const region = result.region
    ? `${regionNames[result.region] || result.region}${result.regionSupported ? "" : "?"} · `
    : "";
  const detail = state.kind === "bad"
    ? state.label
    : `${region}${result.latency} ms${state.kind === "warn" ? ` · ${state.label}` : ""}`;
  return `${service.name.padEnd(10, " ")}\t${detail}\t${state.symbol}`;
}

(async () => {
  const checks = await Promise.all(services.map(async (service) => {
    const primary = await request(service.url, service.policy);
    let region = service.regionFromBody ? parseRegion(primary.data) : "";

    if (!region && service.regionUrl) {
      const regionResult = await request(service.regionUrl, service.policy);
      region = parseRegion(regionResult.data);
      if (primary.clockSkew === null) primary.clockSkew = regionResult.clockSkew;
    }

    return {
      ...primary,
      region,
      regionSupported: !region
        || !service.supportedRegions
        || service.supportedRegions.includes(region),
    };
  }));

  const [aiExit, googleExit] = await Promise.all([
    resolvePolicy("人工智能"),
    resolvePolicy("谷歌服务"),
  ]);

  const states = checks.map(classify);
  const goodCount = states.filter((state) => state.kind === "good").length;
  const badCount = states.filter((state) => state.kind === "bad").length;
  const unsupportedCount = checks.filter((result) => result.region && !result.regionSupported).length;
  const clockSkews = checks.map((result) => result.clockSkew).filter((value) => value !== null);
  const maxClockSkew = clockSkews.length ? Math.max(...clockSkews) : null;

  const lines = services.map((service, index) => formatService(service, checks[index]));
  lines.push(`AI 出口\t${aiExit}`);
  lines.push(`Google 出口\t${googleExit}`);
  if (maxClockSkew === null) {
    lines.push("设备时钟\t未取得服务器时间");
  } else if (maxClockSkew < 60000) {
    lines.push("设备时钟\t正常 ✓");
  } else {
    lines.push(`设备时钟\t偏差约 ${Math.round(maxClockSkew / 1000)} 秒 !`);
  }
  lines.push("结果仅代表网络与出口，不代表账号权限。");

  let titleState = `${goodCount}/${services.length} 正常`;
  let iconColor = "#788C5D";
  if (badCount > 0) {
    titleState = "存在连接失败";
    iconColor = "#B04A3F";
  } else if (goodCount < services.length || unsupportedCount > 0) {
    titleState = "存在受限项";
    iconColor = "#D97757";
  }

  $done({
    title: `AI 连通性 · ${titleState}`,
    content: lines.join("\n"),
    icon: badCount > 0 ? "exclamationmark.icloud.fill" : "checkmark.icloud.fill",
    "icon-color": iconColor,
  });
})().catch((error) => {
  $done({
    title: "AI 连通性 · 检测失败",
    content: `无法完成检测。\n${String(error && error.message ? error.message : error)}`,
    icon: "exclamationmark.triangle.fill",
    "icon-color": "#B04A3F",
  });
});

const rawArgument = typeof $argument === "string" ? $argument.trim() : "";
const subscriptionUrl = rawArgument.startsWith("url=") ? rawArgument.slice(4).trim() : rawArgument;

function finishError(message) {
  $done({
    title: "订阅流量 · 需要处理",
    content: message,
    icon: "externaldrive.badge.exclamationmark",
    "icon-color": "#B04A3F",
  });
}

function readHeader(headers, target) {
  const key = Object.keys(headers || {}).find((name) => name.toLowerCase() === target.toLowerCase());
  return key ? headers[key] : "";
}

function bytes(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number < 0) return "未知";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = number;
  let index = 0;
  while (size >= 1023.5 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size >= 100 || index === 0 ? size.toFixed(0) : size.toFixed(2)} ${units[index]}`;
}

if (!/^https?:\/\//i.test(subscriptionUrl) || subscriptionUrl.includes("example.invalid")) {
  finishError("请打开模块详情 → 参数设置，在 SUBSCRIPTION_URL 后填入完整的 Amy 非托管订阅链接。\n\n不要把真实链接截图、分享或提交到 GitHub。");
} else {
  $httpClient.get({
    url: subscriptionUrl,
    policy: "DIRECT",
    timeout: 12,
    "auto-cookie": false,
    headers: { "User-Agent": "Surge iOS" },
  }, (error, response) => {
    if (error || !response) {
      finishError("订阅请求失败。请确认当前使用中国大陆本地网络、链接仍有效，并且没有通过代理拉取订阅。");
      return;
    }

    const info = readHeader(response.headers, "subscription-userinfo");
    if (!info) {
      finishError("服务器没有返回 subscription-userinfo 流量信息头。节点仍可能正常更新，但本模块无法计算余额；请向 Amy 确认是否支持该响应头。");
      return;
    }

    const values = {};
    info.split(";").forEach((part) => {
      const index = part.indexOf("=");
      if (index > 0) values[part.slice(0, index).trim().toLowerCase()] = part.slice(index + 1).trim();
    });

    const upload = Number(values.upload || 0);
    const download = Number(values.download || 0);
    const total = Number(values.total || 0);
    const used = upload + download;
    const remaining = Math.max(total - used, 0);
    const ratio = total > 0 ? used / total : 0;
    const expire = Number(values.expire || 0);
    const expireText = expire > 0
      ? new Date(expire * 1000).toLocaleString("zh-CN", { hour12: false })
      : "未提供";

    $done({
      title: `订阅流量 · 剩余 ${bytes(remaining)}`,
      content: `已用：${bytes(used)}\n剩余：${bytes(remaining)}\n总量：${bytes(total)}\n到期：${expireText}\n\n本次通过 DIRECT 从服务商读取`,
      icon: ratio >= 0.9 ? "externaldrive.badge.exclamationmark" : "externaldrive.fill.badge.checkmark",
      "icon-color": ratio >= 0.9 ? "#B04A3F" : ratio >= 0.75 ? "#D97757" : "#788C5D",
    });
  });
}

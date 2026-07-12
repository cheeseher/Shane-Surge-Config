const manualUrl = "https://cheeseher.github.io/Shane-Surge-Config/";

$notification.post(
  "Shane-Surge 操作手册",
  "点击此通知，用浏览器打开",
  "包含模块安装、策略组选择、Telegram、Zoom 和开关建议。",
  { action: "open-url", url: manualUrl, "auto-dismiss": false },
);

$done({
  title: "Shane-Surge 操作手册",
  content: "打开通知已发送。点击系统通知即可在浏览器查看最新中文说明。",
  icon: "book.pages.fill",
  "icon-color": "#D97757",
});

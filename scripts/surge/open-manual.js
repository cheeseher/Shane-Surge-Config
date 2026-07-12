const manualUrl = "https://cheeseher.github.io/Shane-Surge-Config/";
const permissionHint =
  "若没有通知：先在 iOS 设置中允许 Surge 通知，再到 Surge 设置 → 通知，开启“显示来自脚本的通知”。";

$notification.post(
  "Shane-Surge 操作手册",
  "点击此通知，用浏览器打开",
  "包含模块安装、策略组选择、Telegram、Zoom 和开关建议。",
  {
    action: "open-url",
    url: manualUrl,
    sound: true,
    "auto-dismiss": false,
  },
);

$done({
  title: "Shane-Surge 操作手册",
  content: `已尝试发送打开通知。\n\n手册地址：${manualUrl}\n\n${permissionHint}`,
  icon: "book.pages.fill",
  "icon-color": "#D97757",
});

# Shane Surge 三端托管配置

这是 Shane 的 iPhone、iPad 和 MacBook 共用 Surge 配置，主要面向中国大陆长期使用。

核心目标：

- 只输入一个公开 URL 安装主配置。
- GitHub 上的规则、策略组或系统设置更新后，Surge 可自动或手动更新。
- Amy 真实订阅链接只保存在各设备的 Linked Profile 本地覆写层，永不上传 GitHub。
- Telegram 通话和 Zoom 会议必须使用单一实际出口，不在一次通话中分路或频繁换节点。

## 官方机制选型

本项目采用 Surge 官方最新的 **Managed Profile + Linked Profile + External Policy Group** 架构。

官方依据：

- [Surge Profile / Linked Profile](https://manual.nssurge.com/overview/configuration.html)
- [Managed Profile](https://manual.nssurge.com/others/managed-profile.html)
- [使用来自代理服务商的线路](https://kb.nssurge.com/surge-knowledge-base/zh/guidelines/proxy-provider)
- [External Policy Group](https://manual.nssurge.com/policy-group/policy-including.html)
- [Smart Group](https://kb.nssurge.com/surge-knowledge-base/guidelines/smart-group)
- [UDP 不支持时的失败行为](https://manual.nssurge.com/others/misc-options.html)
- [Zoom 官方网络端口与 IP 范围](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0060548)
- [Telegram 通话的 P2P / reflector 协议](https://core.telegram.org/api/end-to-end/video-calls)

### Managed Profile

[`By-Shane.conf`](./By-Shane.conf) 顶部包含：

```text
#!MANAGED-CONFIG https://raw.githubusercontent.com/cheeseher/Shane-Surge-Config/main/By-Shane.conf interval=86400 strict=false
```

- `interval=86400`：每 24 小时允许检查更新；推送后也可在 Surge 内手动“立即更新”。
- `strict=false`：GitHub 在某个网络临时不可达时，仍可使用上一份缓存，避免断网。
- Managed Profile 是只读的，远程更新不会与本地手改内容相互覆盖。

### Linked Profile

Surge 安装 Managed Profile 后，创建 Linked Profile。Linked Profile 持续引用远程只读配置，只在本地保存覆写项。

本项目只覆写一行：

```text
全部节点 = select, policy-path=<AMY_NON_MANAGED_SUBSCRIPTION_URL>, ...
```

后续 GitHub 配置更新时，本地 Amy URL 不变。

### External Policy Group

Amy 非托管订阅仅作为外置节点池：

- 更新间隔 6 小时。
- 自动排除“流量、到期、重置、官网、套餐、剩余”等伪节点。
- 按香港、新加坡、日本、美国、台湾进行筛选。

## 公开分发

公开仓库：

```text
https://github.com/cheeseher/Shane-Surge-Config
```

唯一安装 URL：

```text
https://raw.githubusercontent.com/cheeseher/Shane-Surge-Config/main/By-Shane.conf
```

网页使用手册：

```text
https://cheeseher.github.io/Shane-Surge-Config/
```

公开仓库使用全新的干净历史，只发布配置和说明。原 `MyProxy` 私有仓库及其历史不会公开。

## 首次安装

### Mac

1. Surge Mac → Profiles → Download Profile from URL。
2. 输入上述唯一安装 URL。
3. Surge 识别为 Managed Profile 后，选择 **Create Linked Profile**。
4. 在 Linked Profile 中覆写 `全部节点`，将占位 URL 替换为 Amy 非托管订阅。
5. 选中 Linked Profile 作为当前配置。
6. 开启 `Set as System Proxy + Enhanced Mode`。
7. 外部资源执行“全部更新”，再对香港、新加坡候选节点执行 UDP Relay Test。

### iPhone / iPad

1. Surge → 配置列表 → 从 URL 下载。
2. 输入同一个安装 URL。
3. 从配置列表选择 **Create Linked Profile**，关联刚安装的 Managed Profile。
4. 只覆写 `全部节点` 的 `policy-path`。
5. 选中 Linked Profile 作为当前配置。

如 Linked Profile 通过 iCloud 已同步 Amy URL，第二台 iOS 设备不必重复粘贴；仍要检查真实 URL 没有出现在远程 Managed Profile 中。

### 安装后的共同检查

1. 五个地区组都有真实节点，没有“流量、到期、剩余”等伪节点。
2. 外部规则更新无红色错误。
3. 三台设备当前使用的都是 Linked Profile，而不是直接使用只读 Managed Profile。
4. 关闭其他 VPN 或代理，避免出现双重接管。

## 更新日常流程

1. 在公开分发仓库修改 `By-Shane.conf`。
2. 运行 Surge profile checker、远程 URL 检查和凭据扫描。
3. 提交并 push GitHub。
4. 等待 Surge 自动检查，或在三台设备上对 Managed Profile 执行“立即更新”。
5. Linked Profile 的 Amy URL 和本地策略选择保留。

## Telegram 语音稳定性

### 配置保证

- Telegram 默认使用 `新加坡通话`。
- `新加坡通话` 使用单一 `url-test` 结果，不使用会按目标站点切换子策略的 Smart Group。
- `interval=3600` + `tolerance=250`：一小时评估周期，小幅延迟变化不换节点。
- Mac 使用 `PROCESS-NAME,Telegram`，保证域名、Telegram 固定 IP 和 P2P 对端 IP 全部进入同一策略。
- 节点不支持 UDP 时使用 `REJECT`，不回退中国电信本地出口。

### Telegram App 必做设置

为了让 iPhone/iPad 上的通话媒体也经过 Telegram 中继服务器和可识别 IP，三台设备都设置：

```text
Telegram → Settings → Privacy and Security → Calls → Peer-to-Peer → Nobody
```

Telegram 官方协议同时支持 P2P UDP 和 reflector UDP。关闭 P2P 后会使用 Telegram 中继，避免 iOS 将任意对端 IP 落入 `FINAL` 而改走其他出口。

`Nobody` 会隐藏双方 IP，代价是通话可能多经过一跳、延迟略有增加。对本项目而言，出口可控和三端行为一致比理论上的最低 P2P 延迟更重要。

### 上线前门禁

Amy 订阅必须至少有一个新加坡或香港节点通过 Surge 的 **Proxy UDP Relay Test**。

如全部失败，不宣称 Telegram 通话已保证；应先联系 Amy 确认 UDP 能力或更换支持 UDP 的服务。

### Telegram 验收脚本

1. 在 Surge 选择 `电报消息 → 新加坡通话`，通话期间不要测速、更新订阅或切换策略。
2. 发送文字、图片和语音消息，确认请求命中 `电报消息`。
3. 进行 10–15 分钟双向语音；双方轮流静音、开麦，锁屏 2 分钟后恢复前台。
4. 分别用家庭 Wi-Fi 与中国电信蜂窝测试；切换网络后必须能恢复双向声音。
5. Mac 正常而 iPhone/iPad 不稳时，先检查当前配置、其他 VPN 和 Telegram P2P 设置，不先改规则。

### Telegram 故障定位

| 现象 | 优先检查 | 处理 |
| --- | --- | --- |
| 呼叫一直连接或很快断开 | UDP Relay Test | 换到另一个已经通过 UDP 的香港/新加坡通话组；都失败则联系 Amy |
| 偶发单向无声 | 三端 P2P 是否都为 Nobody | 检查通话期间是否换节点、更新订阅或切换网络 |
| Mac 正常，iOS 不稳 | 当前 Linked Profile 与 Surge 请求日志 | 确认 Telegram 没有落入 `FINAL`，并关闭其他 VPN |
| Wi-Fi 正常，蜂窝失败 | 中国电信到当前节点的 UDP 路径 | 用同一节点重做 UDP 测试，不用自动切组掩盖差异 |

## Zoom 语音与共享屏幕

### 旧问题

旧配置将 Zoom UDP 强制 DIRECT，TCP/登录/投屏另走代理；媒体连接又可能直接访问 IP，不命中域名规则后落入 `FINAL`。同一会议因此可能同时使用多个出口，存在单向无声、投屏卡顿和 NAT 会话变化风险。

### 新配置

- `Zoom会议` 默认 `DIRECT`，适合中国大陆的低延迟路径。
- Mac 使用 `PROCESS-NAME,zoom.us`，接管 Zoom 进程的全部连接。
- iOS/Mac 共用 Zoom 域名与官方 Meetings/Webinars IPv4/IPv6 范围。
- Zoom 的 TCP、UDP、语音、视频和屏幕共享全部指向同一个 `Zoom会议` 策略。
- 如 DIRECT 在某网络实测不稳，将整组切到 `香港通话` 或 `新加坡通话`，不只切音频或投屏。

Zoom 官方指定 Meetings/Webinars 主要使用 TCP 443/8801-8802 和 UDP 3478-3479/8801-8810，并明确 UDP 3478 用于 TURN。本配置已使用官方当前 IP 范围覆盖直接 IP 媒体连接。

### Zoom Mac 会前设置

1. Surge 同时开启 `Set as System Proxy` 和 `Enhanced Mode`。
2. `Zoom会议` 先保持 `DIRECT`，关闭其他 VPN、代理与可能接管网络的安全软件。
3. 先进入 Zoom 测试会议，检查扬声器、麦克风和摄像头。
4. 共享带声音的视频或网页时，在 Share Screen 面板勾选 `Share sound / 共享声音`。这个选项属于 Zoom，不是 Surge 分流。

### Zoom 20 分钟验收脚本

1. 双方连续对话 5 分钟，轮流静音和取消静音。
2. 开启摄像头 5 分钟，确认音视频与 Surge 路由仍稳定。
3. 共享整个桌面 5 分钟，再共享一段带声音的视频并勾选 Share sound。
4. 停止后重新共享两次，再保持语音 5 分钟，确认不会在投屏后出现单向无声。

会议中进入 `视频按钮旁的箭头 → Video Settings → Statistics`。Zoom 官方建议：

- Latency 不高于 150 ms。
- Jitter 不高于 40 ms。
- Packet Loss 不高于 2%。

如 DIRECT 超过门槛或出现稳定复现的单向无声，将整个 `Zoom会议` 切到 `香港通话`，重新加入会议并完整复测。不要只代理 UDP、只代理投屏，或在会议中频繁切换节点。

### Zoom 故障定位

| 现象 | 判断与处理 |
| --- | --- |
| 对方听不到共享视频的声音 | 重新共享并勾选 Share sound；这通常不是代理问题 |
| 麦克风单向无声 | 检查 Zoom 输入设备、macOS 麦克风权限，再看 Statistics |
| 投屏明显卡顿 | 检查上行、Wi-Fi 干扰和后台云同步；靠近路由器或使用有线网络 |
| DIRECT 数据差 | 整个组切到香港通话后重新入会并复测 |
| 代理数据更差 | 恢复 DIRECT；以同一验收脚本和 Statistics 数据决定 |

配置可以排除“错误分路”，但无法对蜂窝/Wi-Fi 丢包、路由器 NAT、Zoom 服务端或 iOS/macOS 测试版系统给出“永不断联”的绝对保证。

## 默认策略

| 策略组 | 初始选择 | 理由 |
| --- | --- | --- |
| 节点选择 | 香港节点 | 大陆日常延迟优先 |
| 人工智能 | 美国节点 | ChatGPT / Claude / Copilot 地区一致 |
| 谷歌服务 | 日本节点 | Google / Gemini 共用出口 |
| 电报消息 | 新加坡通话 | 单实际节点，小波动不换线 |
| 国际媒体 | 美国节点 | 优先美区内容 |
| 领英 | 香港真实节点 | 登录期间固定出口，避免账户 IP 频繁变化 |
| TikTok | TikTok日本固定 | 进入子组选择一条真实日本节点并长期保持 |
| Zoom会议 | DIRECT | 整个会议同一出口 |
| 开发服务 | 香港节点 | GitHub 与开发资源低延迟 |
| 苹果 / 微软 / 群晖 | DIRECT | 账户地区不等于全部流量必须代理 |
| 加密货币 | DIRECT | 不自动伪装地区或切换 IP |

## LinkedIn / 领英

- `领英` 直接列出香港、新加坡和美国的真实节点，不经过 Smart Group。
- 第一次使用时手动选择一条香港节点，后续保持不变；节点故障时再手动切换。
- `linkedin.com`、`licdn.com`、`lnkd.in` 等核心域名已内联，外部 LinkedIn 规则集只作为补充。
- 登录、消息、图片和职位页面统一使用同一个出口，减少账户安全验证和资源加载不完整。

## TikTok：大陆 iPhone 稳定方案

当前不启用 MITM：

- 不安装修改版 TikTok，不使用旧版换区脚本，不解密 TikTok HTTPS。
- 使用美国或日本 App Store 下载的官方最新版 TikTok。Apple 官方说明，直接修改主 Apple Account 地区可能受余额、订阅、家庭共享和支付方式影响；已有美区账号时直接使用该账号下载更稳妥。
- TikTok 官方说明，即使关闭定位权限，仍会根据 SIM 卡地区、IP 地址和设备系统设置推断位置。因此“只换代理 IP”无法保证大陆 SIM 环境长期稳定。

### 最稳定的实际组合

1. **首选设备：** 无大陆 SIM 的 Wi-Fi iPad，或关闭中国电信线路后的 iPhone。
2. **官方 App：** 使用美区账号从 App Store 安装并正常更新，不使用第三方安装包。
3. **固定出口：** Surge 选择 `TikTok → TikTok日本固定`，再在子组内手动选定一条真实日本节点；使用期间不测速、不切换节点。
4. **位置权限：** iOS 设置 → 隐私与安全性 → 定位服务 → TikTok → 永不。
5. **地区信号：** 专用设备可将“语言与地区”设为目标地区；主力手机不必为了 TikTok 频繁修改系统设置。
6. **失败处理：** 先关闭 TikTok，确认大陆蜂窝线路已停用且固定节点可用，再重新打开；美国固定节点只作为日本节点不可用时的备选。

[TikTok 官方位置说明](https://support.tiktok.com/en/account-and-privacy/account-privacy-settings/location-services-on-tiktok)明确列出 SIM 地区、IP 和设备系统设置均可用于推断位置；[Apple 官方地区说明](https://support.apple.com/zh-cn/118283)列出了更改商店地区前的余额、订阅和支付要求。

如果中国电信线路必须保持开启，配置仍可提供固定日本/美国 IP，但不能承诺 TikTok 始终把设备判定为目标地区。

## 安全约束

- Amy URL 等同节点密码，不进入托管配置、网页、截图、Git 历史或公开仓库。
- `AMY非托管订阅链接.md` 已被 `.gitignore` 排除，配置完成后应删除明文副本。
- 当前截图曾暴露完整订阅凭据，回国后必须先重置。
- `strict=false` 只允许使用旧的已验证配置，不会将 Amy URL 上传至托管层。

## 校验

```bash
/Applications/Surge.app/Contents/Applications/surge-cli --check By-Shane.conf
```

推送前必须同时通过：

1. Surge profile checker。
2. 策略引用完整性检查。
3. 所有公开外部规则 URL 的 HTTP 200 检查。
4. 凭据、token、证书和节点密码扫描。
5. Telegram UDP relay 与 Zoom 完整会议实测。

## 当前待回国验证

- Amy 官网没有找到公开的 UDP/协议说明。
- 泰国网络直连拉取订阅返回 403，无法读取节点协议和 `udp-relay` 声明。
- 回国后需分别在家庭 Wi-Fi 和中国电信蜂窝网络测试 Telegram 通话。
- Zoom 需完成至少一次 20 分钟的双向语音 + 摄像头 + 屏幕共享测试。
- iOS 27/macOS 27 为测试系统，系统网络回归需与配置问题分开判断。

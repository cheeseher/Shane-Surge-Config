# Shane-Surge 网站品牌图标

核心图形是一条形成字母 `S` 的网络路径：陶土色起点表示配置入口，象牙白路径表示可控流量，橄榄绿终点表示稳定连通。配色直接复用网站的 ink / ivory / clay / olive 视觉系统。

源文件：

- `favicon.svg`：标签页、收藏夹和页面内品牌标志，带圆角透明边缘。
- `app-icon.svg`：Apple Web Clip、PWA 与系统快捷方式，使用无透明的方形底图。
- `mask-icon.svg`：Safari 固定标签页要求的单层纯黑 16×16 SVG。
- `social-preview.svg`：社交平台链接预览图源文件。

重新生成 PNG、ICO 和分享图：

```bash
zsh scripts/generate_site_icons.sh
```

生成结果位于 `assets/site-icons/`，Apple Touch Icon 与 `favicon.ico` 位于网站根目录。

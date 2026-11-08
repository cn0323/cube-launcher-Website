# Cube Launcher 官网

Cube Launcher 的产品官网与 30 秒宣传片落地页。纯静态站点，无构建步骤，直接部署静态托管即可。

- 产品仓库：[cn0323/Cube-launcher](https://github.com/cn0323/Cube-launcher)
- 最新版本：1.2.0
- 站点地址：见仓库 About 或 Releases 说明

## 目录

```
.
├── index.html              单页站点（首屏 / 界面预览 / 功能 / 宣传片 / 下载 / 更新日志）
├── 404.html                错误页
├── assets
│   ├── style.css           全部样式
│   ├── main.js             交互：滚动揭示、截图切换、宣传片弹窗、更新日志
│   ├── icon.svg            站点图标
│   ├── og.jpg              社交分享图（1200×630）
│   ├── promo.mp4           宣传片 720p，30 秒
│   ├── promo-poster.jpg    宣传片封面
│   └── screens/*.webp      8 张真机截图
├── _headers                Cloudflare Pages 响应头（缓存与安全策略）
└── .nojekyll               避免 GitHub Pages 走 Jekyll 处理
```

## 本地预览

纯静态，双击 `index.html` 即可，但建议起个本地服务，视频与相对路径行为更接近线上：

```bash
python3 -m http.server 8000
# 打开 http://localhost:8000
```

## 部署

**Cloudflare Pages（推荐）**

- 构建命令：留空
- 构建输出目录：`/`
- 推送到 `main` 即自动构建发布

或用 Wrangler 直接上传：

```bash
npx wrangler pages deploy . --project-name=cube-launcher
```

**GitHub Pages**

仓库 Settings → Pages → 选择 `main` 分支根目录即可。

## 内容维护

| 想改什么 | 改哪里 |
|---|---|
| 版本号、下载体积、按钮文案 | `index.html` |
| 更新日志 | 优先读 GitHub Releases API；取不到时用 `assets/main.js` 里的 `FALLBACK` |
| 截图 | 替换 `assets/screens/*.webp`，文件名与 `index.html` 中 `data-src` 对应 |
| 宣传片 | 替换 `assets/promo.mp4` 与 `assets/promo-poster.jpg` |

## 说明

站点为纯静态，无后端、无 Cookie、无第三方统计脚本。更新日志通过 GitHub 公共 API 拉取，匿名请求有频率限制，命中限流时自动回退到内置数据，不会出现空白。

© 重念 · GPL-3.0

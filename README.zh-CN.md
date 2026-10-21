# 图片压缩到指定大小

[English](README.md) · **简体中文**

把 JPG、PNG 或 WebP 图片压缩到指定大小（20 KB、50 KB、100 KB，或自己输入任意数值），全程不上传。适合证件照上传、报名表和邮件附件这类有大小限制的场景。

**在线使用：** https://compress.bodhi.tools/

![图片压缩截图](docs/screenshot.png)

## 功能

- 预设 20、50、100、200、500 KB，也可以自定义 KB
- 逐步降低质量和分辨率，直到文件达到目标大小
- PNG 或 WebP 压不到目标时，自动改用 JPEG 重试
- 显示压缩前后大小，下载文件名形如 `photo-100kb.jpg`
- 压缩在 Web Worker 中进行，页面不卡顿
- 无水印、无需注册、不限次数
- 中英文界面

## 实现原理

[browser-image-compression](https://github.com/Donaldcwl/browser-image-compression) 在 canvas 上解码图片后重新编码，最多迭代 30 次，逐步降低质量和尺寸，直到结果符合目标。结果在目标的 5% 以内即视为达标；否则显示能压到的最接近大小。

## 隐私说明

- 图片只在你的浏览器里读取和处理，应用没有任何上传接口。
- 页面会从 jsDelivr 加载压缩用的 worker 脚本，从 Google Fonts 和 Fontshare 加载字体。
- compress.bodhi.tools 上的线上版本接入了 Cloudflare Web Analytics，只统计页面访问量，不使用 Cookie。自行部署时如不需要，删除 `index.html` 和 `en/index.html` 中的 `cloudflareinsights` 脚本标签即可。

## 本地运行

需要 Node.js 20.19+（或 22.12+）和 [pnpm](https://pnpm.io)。

```bash
git clone https://github.com/bodhi1425/image-compressor.git
cd image-compressor
pnpm install
pnpm dev     # http://localhost:5173
pnpm build   # 静态文件输出到 dist/
```

`dist/` 里只有静态文件，可以部署到 Cloudflare Pages、Netlify、GitHub Pages 或任何 Web 服务器。

## 目录结构

```
index.html       中文页 (/)
en/index.html    英文页 (/en/)
src/main.ts      界面与压缩逻辑
src/style.css    样式
public/          favicon、robots.txt、sitemap.xml
```

## 依赖

| 包 | 用途 | 许可证 |
|---|---|---|
| [browser-image-compression](https://github.com/Donaldcwl/browser-image-compression) | 图片压缩 | MIT |
| [Vite](https://vite.dev)、[TypeScript](https://www.typescriptlang.org) | 构建 | MIT、Apache-2.0 |

## 更多本地处理工具

以下工具都完全在浏览器中运行：

- [local-pdf-toolbox](https://github.com/bodhi1425/local-pdf-toolbox)：PDF 合并、拆分、压缩与格式转换
- [heic-converter](https://github.com/bodhi1425/heic-converter)：iPhone HEIC 照片转 JPG 或 PNG
- [qrcode](https://github.com/bodhi1425/qrcode)：带 logo、渐变、Wi-Fi 和名片的二维码生成器
- [ocr](https://github.com/bodhi1425/ocr)：图片转文字
- [cutout](https://github.com/bodhi1425/cutout)：用本地 AI 模型抠图去背景

## 参与贡献

欢迎提交问题反馈和 Pull Request。较大的改动请先开 issue 讨论。

## 许可证

[MIT](LICENSE) © 2026 bodhi1425

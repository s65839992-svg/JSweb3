# JSweb3

面向中国市场与全球用户的中英双语定制开发网站。中文由 `/`、`/services/`、`/contact/` 提供，英文位于 `/en/`。网页主体、链接和 SEO 元数据均随静态 HTML 提供。

## 本地构建

运行 `node build.mjs` 生成 `site/` 下的 HTML、sitemap、robots 和 llms.txt。用静态服务器打开 `site/` 进行预览。

## 部署

- 在 GitHub 仓库的 Settings → Pages 中选择 GitHub Actions。推送 `main` 后触发 Pages 工作流。自定义域填 `jsweb3.dev`。
- 在 Cloudflare 管理 `jsweb3.dev`。根域 DNS 指向 GitHub Pages，`www` 指向 `s65839992-svg.github.io`。使用 DNS only 完成 GitHub 域名检查与 HTTPS 签发。待签发完成后启用 Enforce HTTPS。
- 在 Google Drive 创建私有 Google Sheet。将 `backend/Code.gs` 添加到 Google Apps Script，在 Script Properties 配置 `SPREADSHEET_ID` 和随机生成的 `INTAKE_SECRET`。以脚本所有者身份部署为 Web app，允许服务器调用。不要公开分享表格。
- 在 Cloudflare Worker 为 `APPS_SCRIPT_URL` 和 `INTAKE_SECRET` 配置 Secrets，使用 `wrangler.jsonc` 部署。分别使用 Apps Script Web app 的 `/exec` 地址和相同的共享密钥。Worker 使用 `api.jsweb3.dev`，对允许的前端来源返回 CORS 响应，并在转存前检查输入与频率。
- 正式启用前用测试需求确认 Google Sheet 收到记录，且 `s65839993@gmail.com` 收到通知。邮件只含需求编号和表格链接。

每条需求使用请求编号去重。页面只在 Google Sheet 已保存且通知服务已接受邮件后显示成功。输入手机号校验的是号码格式。未列出的区号通过通用国际号码格式校验。

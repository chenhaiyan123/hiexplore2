# HiExplore 网站统一与集成指南

本文档将指导你如何将现有的 **hiexplore.com** 网站与新的 **AI 实践助手 App** 进行视觉和数据的统一。

## 第一步：视觉统一 (CSS)

为了让你的主网站看起来和 App 一样酷（黑色极客风），请执行以下操作：

1. 将本项目根目录下的 `hiexplore-global.css` 文件下载。
2. 上传到你 `hiexplore.com` 网站的服务器（例如 `/assets/css/` 目录）。
3. 在你网站所有页面的 `<head>` 标签中添加以下代码：

```html
<link rel="stylesheet" href="/assets/css/hiexplore-global.css">
```

4. **添加 App 入口按钮**：在你的网站首页底部（`<body>` 结束标签前）添加以下 HTML，这将添加一个浮动的“进入 AI 实验室”按钮：

```html
<a href="https://app.hiexplore.com" class="hi-lab-entry">
  <span>⚡</span> 进入 AI 实践实验室
</a>
```

## 第二步：数据统一 (API)

新的 App 已经配置好去请求你的后端数据。你需要确保你的网站提供以下 API 接口：

1. **获取项目列表**
   - **Endpoint**: `https://www.hiexplore.com/api/projects`
   - **Method**: `GET`
   - **Response**: 返回 JSON 格式的项目列表（结构参考 `types.ts` 中的 `Project` 接口）。
   - **跨域设置 (CORS)**: 请确保你的服务器允许来自 `app.hiexplore.com` 的跨域请求。

2. **用户登录 (可选)**
   - **Endpoint**: `https://www.hiexplore.com/api/auth/login`
   - **Method**: `POST`
   - **Body**: `{ "phone": "...", "code": "..." }`

## 第三步：部署 App

1. 将本项目部署到 Vercel。
2. 将域名设置为 `app.hiexplore.com`。

完成以上步骤后，你的两个产品将在视觉和数据上融为一体！
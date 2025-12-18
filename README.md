
# AI 实践助手 (AI Maker Copilot)

这是一个基于 React + TypeScript + Google Gemini API 构建的智能科创教育平台。

## 🚀 推荐部署方式：GitHub + Vercel

由于本地部署可能会受到操作系统版本限制，推荐使用 **GitHub** 进行云端部署。

### 第一步：上传代码到 GitHub

1. **初始化 Git 仓库** (在终端执行):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **创建 GitHub 仓库**:
   - 打开 [GitHub.com](https://github.com) 并登录。
   - 点击右上角的 **+** 号 -> **New repository**。
   - Repository name 填入 `hiexplore-app`。
   - 点击 **Create repository**。

3. **推送代码**:
   - 复制 GitHub 页面上显示的 **"…or push an existing repository from the command line"** 下面的那三行命令。
   - 在你的终端粘贴并运行。通常是：
     ```bash
     git remote add origin https://github.com/你的用户名/hiexplore-app.git
     git branch -M main
     git push -u origin main
     ```

### 第二步：连接 Vercel

1. 打开 [Vercel Dashboard](https://vercel.com/dashboard)。
2. 点击 **Add New...** -> **Project**。
3. 在左侧 "Import Git Repository" 中找到刚才创建的 `hiexplore-app`，点击 **Import**。
4. 在 **Environment Variables** (环境变量) 部分，添加你的 API Keys (如果有):
   - `API_KEY`: (你的 Google Gemini Key)
5. 点击 **Deploy**。

等待约 1 分钟，Vercel 会自动构建并生成一个在线网址 (例如 `https://hiexplore-app.vercel.app`)。以后你只需要 `git push`，网站就会自动更新。

---

## 📱 本地开发

```bash
npm run dev
```

打开浏览器访问 `http://localhost:5173`。

## 🛠️ 技术栈

- **前端框架**: React 19
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **AI**: Google Gemini / Aliyun Qwen


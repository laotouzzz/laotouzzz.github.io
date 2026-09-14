# LAOTOU 的个人博客

记录学习、折腾和日常发现的个人博客，使用 **Hugo + Blowfish** 构建，通过 **GitHub Actions** 自动发布到 **GitHub Pages**。

🌐 **博客地址：[laotouzzz.cc.cd](https://laotouzzz.cc.cd/)**

## 内容

- **ChatGPT**：ChatGPT、Codex 的使用经验与相关记录。
- **科学上网**：代理工具、网络测试与配置记录。
- **软件推荐**：软件、网站、浏览器插件和开源项目。
- **折腾记录**：个人博客搭建、Obsidian 和工具配置。
- **文章**：其他学习笔记与日常分享。

## 技术与布局

| 项目 | 说明 |
| --- | --- |
| 静态网站生成器 | Hugo Extended，部署版本 `0.165.0` |
| 主题 | Blowfish `3.7.0`，主题源码保存在 `themes/blowfish/` |
| 发布 | GitHub Actions 构建，GitHub Pages 托管 |
| 写作 | Markdown，文章保存在 `content/` |
| 外观 | 浮动导航、官方 SVG 图标、深浅色模式 |
| 自定义布局 | 清晰的全屏背景首屏，内容位于下一屏，滚动时背景逐渐模糊 |

布局调整放在项目的 `layouts/` 和 `assets/css/custom.css` 中，滚动效果复用 Blowfish 的背景脚本。升级主题时，注意检查这些覆盖模板与新版本的兼容性。

## 目录结构

```text
.
├── .github/workflows/hugo.yml    # 自动构建和发布
├── archetypes/                  # 新文章模板
├── assets/                      # 背景、头像和自定义样式
├── config/_default/             # 站点、菜单、主题和 Markdown 配置
├── content/
│   ├── chatgpt/                 # ChatGPT 专题
│   ├── science-networking/      # 科学上网专题
│   ├── software/                # 软件推荐专题
│   ├── record/                  # 折腾记录
│   └── article/                 # 其他文章
├── layouts/                     # 项目覆盖模板和自定义短代码
├── static/                      # 直接复制到网站的静态文件
└── themes/blowfish/             # 本地主题源码
```

## 本地运行

安装与部署版本一致的 **Hugo Extended 0.165.0**，在项目根目录执行：

```bash
hugo version
hugo server
```

打开终端显示的预览地址，通常为 `http://localhost:1313/`。需要预览草稿时使用 `hugo server -D`。

生成发布文件：

```bash
hugo --minify
```

构建结果保存在 `public/`。`public/`、`resources/` 和本地编辑器配置已加入 `.gitignore`。

仓库内包含主题源码，普通博客预览和构建无需在线下载主题，也无需先执行 `npm install`；修改主题自身的前端源码时另按主题构建流程操作。

## 写文章与新增专题

文章放在相应的 `content/` 子目录中，例如：

```text
content/chatgpt/我的使用记录.md
```

文章示例：

```markdown
---
title: "我的使用记录"
date: 2026-09-14
draft: false
tags: [ChatGPT]
---

这里开始写正文。
```

栏目首页使用 `_index.md`。新增专题时，创建 `content/专题路径/_index.md`，再在 `config/_default/menus.en.toml` 中添加对应菜单。文章图片可以保存在所在栏目下的 `00-assets/`，正文使用相对路径引用。

## 常用配置

| 文件 | 用途 |
| --- | --- |
| `config/_default/hugo.toml` | 网站域名、主题、分类与输出格式 |
| `config/_default/params.toml` | 背景、首屏、文章展示与主题参数 |
| `config/_default/languages.en.toml` | 网站名称、头像与作者信息 |
| `config/_default/menus.en.toml` | 顶部导航及专题下拉菜单 |
| `assets/css/custom.css` | 项目自定义外观 |

沉浸式背景参数位于 `params.toml` 顶层：

```toml
# 全站默认背景，路径相对于 assets。
defaultBackgroundImage = "img/background.jpg"
# 文章和栏目页使用清晰背景首屏。
immersiveBackground = true
# 滚动渐变距离，单位为像素；数值越大，渐变越缓慢。
immersiveBlurDistance = 900
```

首页在 `[homepage]` 中使用 `layout = "custom"`。恢复官方首页时改为 `layout = "background"`；文章和栏目页恢复官方布局时将 `immersiveBackground` 改为 `false`。

## GitHub 自动发布

推送到 `main` 分支后，`.github/workflows/hugo.yml` 会自动：

1. 获取代码并安装指定版本的 Hugo Extended。
2. 执行 `hugo --minify`。
3. 上传 `public/` 并部署到 GitHub Pages。

也可以在仓库 **Actions → Build Hugo Site → Run workflow** 手动运行。工作流采用 `pages` 并发组，后续发布排队，避免同时部署导致冲突。失败时查看具体步骤日志，区分构建错误与 Pages 部署错误。

## 致谢

- [Hugo](https://gohugo.io/)
- [Blowfish](https://github.com/nunocoracao/blowfish)
- [GitHub Pages](https://pages.github.com/)

主题及其第三方依赖的许可证见相应目录；本仓库的个人文章与图片没有另行声明统一开源许可。

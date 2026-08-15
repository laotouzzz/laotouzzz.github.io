---
title: 03-Hugo进阶配置
date: 2026-08-15
lastmod: 2026-08-15
---

## 前提
- 在`homepage`文件夹在创建`.gitignore`，此文件是部署到GitHub Page上要求文件，里面主要用来指定哪些文件可以上传，哪些文件可以被忽略

```
# Hugo 构建产物，绝对不要提交
public/
resources/
.hugo_build.lock

# Obsidian 本地配置、缓存、回收站
.obsidian/
.trash/

# 系统生成文件
.DS_Store
Thumbs.db

# vscode 工作区配置
.vscode/
*.tmp
```

- 在`homepage`文件夹创建`.github`文件夹，在`.github`文件夹创建`workflows`，然后这个文件夹下在创建`hugo.yml`文件。这个文件是流水线功能，只要推送到`main`分支就自动运行hugo流水线

填写如下内容
```
name: Build Hugo Site
on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: true

      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v3
        with:
          hugo-version: 'latest'

      - name: Build
        run: hugo --minify

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./public

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- 在GitHub Pages主页进行如下修改

将Build and deployment修改为GitHub Actions，此选项解释可以自行AI搜索

![](/00-assets/record/个人博客的搭建心路历程/03-Hugo进阶配置/20260815-201737.png)


参考文档：由豆包辅助完成

## 使用obsidian注意事项
```
方案 1：VS Code 批量替换（最简单，推荐，写完文章导出后跑一次）
把 obsidian 写好的 md 放到 hugo 的 content，用 VS Code 全局正则替换。
查找（正则模式打开）
plaintext
!\[(.*?)\]\((00-assets\/.*?)\)
替换为
plaintext
![$1](/$2)
效果：
![](00‑assets/record/a.png) → ![](/00‑assets/record/a.png)
只修改 md 文本，不会改动 obsidian 库里面源文件，只修改 hugo 这边副本。
```
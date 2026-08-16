---
title: 03-Hugo进阶配置
date: 2026-08-15
lastmod: 2026-08-16
weight: "3"
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

## 注意事项

所有的md文件及文件夹需要在根目录下的`content`下面创建

所有的文件夹下都必须创建`_index.md`文件，不然网页不会被显示

`_index.md`主要是添加笔记属性`title`
```
---
title: "文档"  # 用来展示你的文件夹的主题
description: "此页面是使用 Hugo 的 Blowfish 主题搭建的"
---
{{< lead >}}
了解如何使用简单而强大的 Blowfish。
{{< /lead >}}

本章节包含了你需要了解的有关 Blowfish 的所有信息。
```
示例图片

![](/00-assets/record/个人博客的搭建心路历程/03-Hugo进阶配置/20260815-205814.png)

## 使用obsidian注意事项
我使用`obsidian`来进行编写我的文章内容，选择根目录的`content`作为`obsidian`仓库

### `obsidian`软件简单配置

设置/文件与链接/内部链接类型：基于仓库根目录的绝对路径

我使用插件`Custom Attachment Location`来进行我的文章图片路径管理
>新附件位置：`00-assets/${noteFolderPath}/${noteFileName}`
>
>生成的附件文件名：`${date:{momentJsFormat:'YYYYMMDD-HHmmss'}}`
>
>是否重命名附件文件夹：打开
>
>Should handle renames：打开
>
>空附件文件夹处理：选择删除
>
>是否删除孤立附件：打开
>
>

问题：路径冲突
>obsidian生成的文件路径为
>
>`![](00-assets/record/个人博客的搭建心路历程/03-Hugo进阶配置/20260815-205814.png)`
>
>因为`Hugo`识别不了`obsidian`的路径，需要改为如下
>
>`![](/00-assets/record/个人博客的搭建心路历程/03-Hugo进阶配置/20260815-205814.png)`

快速改动方法-使用VS Code 全局正则替换

>查找（正则模式打开）
>
>`!\[(.*?)\]\((00-assets\/.*?)\)`
>
>替换为
>
>`![$1](/$2)`

只修改 md 文本，不会改动 obsidian 库里面源文件，只修改 hugo 这边副本。

---
title: 自制obsidian插件
date: 2026-07-15 20:51:40
lastmod: 2026-08-24 16:40:44
---

# 第一步
安装node.js
# 参考文件
[链接](https://forum-zh.obsidian.md/t/topic/37149)
[中文文档](https://luhaifeng666.github.io/obsidian-plugin-docs-zh/zh2.0/)
[obsidian官方文档](https://docs.obsidian.md/Home)

关于你的问题：**是的，对于开发逻辑来说，核心代码确实全都在 `src` 文件夹里。**
如果你下次想开发一款全新的 Obsidian 插件，**单纯清空并重写 `src` 文件夹是不够的**。你可以把当前的这个工程文件夹作为你的“祖传模板”，但在复制一份出新插件时，你还需要改动以下几个文件，否则 Obsidian 会把新插件和老插件混淆：
1. **`manifest.json` （最重要）**：
   这个文件是 Obsidian 认识插件的“身份证”。你必须修改里面的：
   * `id`: 插件的唯一标识符（决不能和别的插件重复，比如可以改为 `my-new-plugin`）
   * `name`: 显示在插件列表里的中文名字
   * `description`: 插件的一句话简介
   * `author`: 你的名字

2. **`package.json` （用来管依赖的）**：
   * 修改 `name` 为你的新插件英文名。
   * 如果新插件不需要用到网页转图片（`puppeteer-core`）、打包ZIP（`jszip`），或者用不到 Markdown转HTML（`marked`），你可以用 `npm uninstall jszip marked puppeteer-core` 将他们卸载，保持新项目的整洁。

3. **`src/` 文件夹**：
   * 清空现有的 main.ts 和 settings.ts。
   * 建立一个新的 `src/main.ts`，只保留最基础的 `Plugin` 骨架：
   ```typescript
   import { Plugin } from 'obsidian';
   export default class MyNewPlugin extends Plugin {
       async onload() {
           console.log('我的新插件加载了！');
       }
       onunload() {}
   }
   ```

简单来说总结就是：**拷贝一份这个文件夹 -> 改 `manifest.json` 里的 ID 和名字 -> 清空 `src` 写新代码 -> 运行 `npm run build`**

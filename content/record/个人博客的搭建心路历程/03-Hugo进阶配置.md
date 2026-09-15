---
title: 03-Hugo进阶配置
date: 2026-08-15
lastmod: 2026-09-15
weight: "3"
url: /record/01/03
---

博客能运行之后，还需要整理内容目录、配置自动部署，并处理写作工具与网页之间的路径差异。这篇文章记录我在 Hugo + Blowfish 项目中的实际配置，以及如何保留中文标题、使用简洁的网址。

## 项目目录与版本管理

下文的“项目根目录”指包含 `config/`、`content/` 和 `themes/` 的博客文件夹，不是 `content/` 本身。

### 忽略本地文件与构建产物

在项目根目录创建 `.gitignore`，告诉 Git 哪些文件不需要提交。

```gitignore
# Hugo 构建产物与缓存，由本地或 Actions 重新生成。
public/
resources/
.hugo_build.lock

# Obsidian 本地配置、回收站与同步标记。
.obsidian/
.trash/
.stfolder/

# 系统和编辑器生成的文件。
.DS_Store
Thumbs.db
.vscode/
*.tmp
```

`.gitignore` 不是 GitHub Pages 的强制要求，它的作用是减少无关文件进入仓库。源码、文章、图片、配置和本地主题仍需要正常提交。

已经被 Git 跟踪的文件，不会因为加入 `.gitignore` 就自动停止跟踪。例如要保留本地 `public/`、只取消其版本跟踪，可以在项目根目录运行：

```bash
git rm -r --cached public
```

只有该目录已经被跟踪时才需要执行这条命令。

## 使用 GitHub Actions 自动部署

本项目提交 Hugo 源码，由 Actions 构建网站，再发布到 GitHub Pages。

### 创建工作流

在项目根目录创建 `.github/workflows/hugo.yml`。下面是本项目使用的配置：

```yaml
name: Build Hugo Site
on:
  push:
    branches: [ main ]
  # 允许从 Actions 页面手动发布。
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

# 同一个 Pages 站点的发布任务排队，避免并发部署冲突。
concurrency:
  group: pages
  cancel-in-progress: false

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
          hugo-version: '0.165.0'
          extended: true

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

本项目固定使用 Hugo Extended `0.165.0`，与本机版本保持一致。升级 Hugo 时，先确认主题兼容，再同步修改工作流中的版本，避免使用 `latest` 导致构建环境突然变化。

主题源码已保存在 `themes/blowfish/`。普通 Hugo 构建无需额外下载主题；`submodules: true` 是检出子模块的选项，本项目当前的主题目录不是子模块。

### 配置 Pages 发布来源

打开 GitHub 仓库的 **Settings → Pages → Build and deployment**，将 **Source** 设置为 **GitHub Actions**。

![GitHub Pages 发布来源设置](/record/01/00-assets/20260815-201737.png)

推送到 `main` 后，到 **Actions → Build Hugo Site** 查看执行结果，也可以使用 **Run workflow** 手动触发。

### 区分构建失败与部署失败

- **Build 步骤失败**：检查 Markdown 顶部属性、配置语法、模板及图片资源路径，先在本地执行 `hugo --minify`。
- **Deploy to GitHub Pages 步骤失败**：检查 Pages 发布来源、权限和部署状态。
- 日志出现 `due to in progress deployment`：说明已有 Pages 部署正在进行，不代表文章或 Hugo 构建有问题。上面的并发组会让后续发布排队；若旧任务异常卡住，再检查并取消相应旧任务后重新运行。

## 内容目录与栏目首页

文章通常放在 `content/` 下，图片可以放在文章所在栏目内，或按用途放入 `assets/`、`static/`。

```text
content/
├── chatgpt/
│   ├── _index.md
│   └── 使用记录.md
└── record/
    └── 个人博客的搭建心路历程/
        ├── _index.md
        ├── 03-Hugo进阶配置.md
        └── 00-assets/
            └── 20260815-205814.png
```

### `_index.md` 的作用

`_index.md` 用于配置栏目首页，例如栏目标题、介绍和列表展示参数。嵌套目录需要作为独立栏目展示时，也可以添加这个文件。

```yaml
---
title: "个人博客的搭建心路历程"
description: "记录博客从搭建到日常维护的过程"
draft: false
---

这里记录我的博客搭建与配置经验。
```

不是每个文件夹都必须有 `_index.md`。顶层栏目可以由 Hugo 自动识别，纯图片目录也不需要这个文件。为了明确管理栏目名称和介绍，我会给需要展示的栏目添加 `_index.md`。参见 [Hugo 栏目文档](https://gohugo.io/content-management/sections/)。

![栏目首页属性示例](/record/01/00-assets/20260815-205814.png)

`_index.md` 与 `index.md` 的用途不同：前者是栏目首页，后者常用于单篇文章的页面包，不要为了让文章显示而随意互换。

## 中文网址为什么显示成 `%E6…`

### 百分号编码的原理

中文网址在复制或传输时，可能显示为 `%E6%B5%8B…`。这是百分号编码，不是正文乱码。

以“测”为例，它的 UTF-8 字节是 `E6 B5 8B`。编码时在每个字节前加上 `%`，就得到 `%E6%B5%8B`；浏览器解析网址时可以还原。不同浏览器和应用可能显示中文，也可能显示编码形式，两种表示可以指向同一地址。参见 [MDN 百分号编码说明](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding)。

本项目原来的文章地址是：

```text
https://laotouzzz.cc.cd/science-networking/02-测试ip地址/
```

复制后可能变成：

```text
https://laotouzzz.cc.cd/science-networking/02-%E6%B5%8B%E8%AF%95ip%E5%9C%B0%E5%9D%80/
```

中文网址本身可以正常使用。如果希望分享链接更短、更容易阅读，可以让文章保留中文标题和文件名，单独使用英文网址。

### 用 `slug` 指定文章网址

默认情况下，Hugo 通常按 `content/` 内的文件路径生成网址。普通文章的 `slug` 可以覆盖路径最后一段；`title` 负责显示标题，两者可以分别设置。参见 [Hugo URL 管理文档](https://gohugo.io/content-management/urls/)。

例如打开 `content/science-networking/02-测试IP地址.md`，在文件顶部两条 `---` 之间添加：

```yaml
---
title: 02-测试IP地址
slug: test-ip
date: 2026-07-20 21:18:17
lastmod: 2026-09-14
weight: "2"
---
```

修改后，文件名和中文标题保持不变，网址变成：

```text
https://laotouzzz.cc.cd/science-networking/test-ip/
```

我通常使用小写英文、数字和连字符，例如 `test-ip`、`chatgpt-guide`、`hugo-setup`。同一栏目内避免重复，发布后尽量保持稳定。

`slug` 只覆盖普通文章路径的最后一段。如果上级栏目路径也含中文，完整网址仍可能出现编码。栏目首页不能照搬普通文章的 `slug` 用法；需要调整栏目地址时，应另行规划目录、`url` 或永久链接配置。

### 用 `aliases` 保留旧链接

已经发布的文章修改网址后，旧书签、外部分享和正文里手写的链接不会自动更新。可以在同一份文章属性中添加旧路径别名：

```yaml
---
title: 02-测试IP地址
slug: test-ip
aliases:
  - /science-networking/02-测试ip地址/
date: 2026-07-20 21:18:17
lastmod: 2026-09-14
weight: "2"
---
```

Hugo 会在旧路径生成跳转页面，访问旧网址时转到新文章。在 GitHub Pages 这种静态托管中，这是 HTML 页面跳转，不是服务器返回的 HTTP 301。别名应填写真实旧路径，注意大小写；这里可以直接写中文，不需要手动转换成 `%E6…`。

添加别名后，仍应更新正文中手写的文章链接；主题根据文章对象生成的列表链接会随重新构建更新。

### 预览并发布

在项目根目录执行：

```bash
hugo server
```

打开终端给出的地址，检查新网址，例如 `http://localhost:1313/science-networking/test-ip/`。如果设置了别名，还要访问旧网址确认跳转。

再运行 `hugo --minify` 检查构建。提交并推送到 `main`，等待 Actions 发布成功后，分别验证线上新旧链接。本地预览成功不代表线上已完成更新。

## 自定义栏目网址

普通文章可以用 `slug` 修改网址最后一段，也可以用 `url` 指定完整地址；栏目首页 `_index.md` 使用 `url` 指定地址。需要根据想修改的范围选择。

### 保留中文文件夹，只修改栏目首页网址

例如在 `content/record/个人博客的搭建心路历程/_index.md` 中设置：

```yaml
---
title: 个人博客的搭建心路历程
description: 技术相关记录
url: /record/01/
weight: 1
orderByWeight: true
aliases:
  - /record/个人博客的搭建心路历程/
---
```

栏目首页会使用 `/record/01/`。`url` 可以自定义为 `/record/blog-setup/` 等路径，数字 `01` 只是网址的一部分，不负责排序。页面显示的名称由 `title` 决定，仍可保留中文。

这里的 `url` 只修改栏目首页，不会把子文章的网址一起改成 `/record/01/文章名/`。上级中文目录仍在时，子文章地址仍可能包含中文编码。

### 保留中文文件夹，为文章指定完整网址

如果既想保留中文文件夹方便写作，又想让文章地址完全使用英文或数字，可以直接在每篇文章的顶部属性中设置 `url`，不必改名文件夹。

例如，栏目首页已设置 `url: /record/01/`，但第一篇文章只设置了 `slug: "01"`。因为栏目首页的 `url` 不会传给子文章，第一篇的地址仍然是：

```text
/record/个人博客的搭建心路历程/01/
```

要使用 `/record/01/01/`，在第一篇文章的现有属性区中设置：

```yaml
---
title: 01-快速搭建第一个Github-Pages网站
date: 2026-08-13 12:52:53
lastmod: 2026-09-14
weight: 1
url: /record/01/01/
aliases:
  - /record/个人博客的搭建心路历程/01-快速搭建第一个github-pages网站/
  - /record/个人博客的搭建心路历程/01/
---
```

示例中的两个别名分别对应文件名生成的旧地址和设置 `slug: "01"` 后的地址。实际使用时，只保留需要兼容的真实旧路径，并检查它们是否被其他页面占用。

第二篇、第三篇分别设置 `url: /record/01/02/`、`url: /record/01/03/`，其他文章按自己的编号填写。栏目首页仍是 `/record/01/`，不能与某篇文章使用相同的完整地址。

| 属性 | 控制范围 | 本例效果 |
| --- | --- | --- |
| `title` | 页面显示名称 | 保留中文标题 |
| `slug: "01"` | 普通文章路径的最后一段 | `/record/个人博客的搭建心路历程/01/` |
| `url: /record/01/01/` | 当前页面的完整路径 | `/record/01/01/` |
| `weight: 1` | 所在列表中的排序 | 开启权重排序时靠前展示 |

`slug` 并不是没用：它适合保留目录结构、只简化文章名的情况。`url` 则适合完全指定当前页面地址。普通文章可以使用两者，但同时设置时 `url` 优先；已经指定完整 `url` 的文章可以删除原来的 `slug`，让配置更清楚。

这些设置只改变页面网址，不会移动 Markdown 文件或图片。采用本项目从网站根目录开始的图片路径时，保留原来的图片引用即可；使用相对链接的文章仍需预览检查。


### 让栏目和文章都使用英文目录

如果希望完整路径都使用英文，可以把实际文件夹改为：

```text
content/record/blog-setup/
├── _index.md
└── 03-Hugo进阶配置.md
```

栏目 `_index.md` 保留中文 `title`；文章中设置 `slug: hugo-config`。在没有其他网址覆盖配置的情况下，栏目地址为 `/record/blog-setup/`，文章地址为 `/record/blog-setup/hugo-config/`。

也可以自行选择 `content/notes/my-blog/` 这样的目录，网址会相应变化。重命名已发布的目录时，需要分别处理栏目和各篇文章的旧路径别名，并检查图片及正文链接。只给栏目首页添加 `aliases`，不会自动兼容所有旧文章地址。

### 多个页面使用相同网址会怎样

每个页面的完整输出路径应当唯一。如果两篇文章都设置 `url: /notes/my-blog/`，它们会争用同一个 `notes/my-blog/index.html`，可能覆盖内容或显示错误页面。

- `/chatgpt/guide/` 与 `/software/guide/` 的完整路径不同，可以使用相同的 `slug: guide`。
- 同一栏目内的文章应避免重复 `slug`。
- `aliases` 也不要占用其他页面正在使用的地址。
- 栏目首页与文章不要设置相同的完整 `url`。

在项目根目录运行下面的命令，检查重复输出路径警告：

```bash
hugo --minify --printPathWarnings
```

构建没有报错，不代表没有路径警告；还需要查看终端输出。

## record 栏目与系列文章的排序

列表排序需要区分两个层级：`record` 首页决定各条记录、子栏目的顺序；子栏目首页决定它内部文章的顺序。

### 开启权重排序

本项目已在 `config/_default/params.toml` 的 `[list]` 中设置全局默认值：

```toml
[list]
  orderByWeight = true
```

因此，未单独覆盖该参数的栏目已经按权重排序。也可以在 `content/record/_index.md` 中明确声明：

```yaml
---
title: 老头的折腾记录
description: 技术相关记录
orderByWeight: true
---
```

`orderByWeight` 是布尔值，应使用不加引号的 `true` 或 `false`。在 Obsidian 属性界面中，将它设为复选框类型，并勾选表示开启。不要使用文本属性写成 `"true"` 或 `"false"`，避免字符串与布尔值混淆。

### 控制子栏目在 record 中的顺序

在子栏目的 `_index.md` 中填写 `weight`，例如：

| record 中的内容 | 填写位置 | 示例权重 |
| --- | --- | --- |
| 个人博客的搭建心路历程 | 对应目录的 `_index.md` | `weight: 1` |
| Obsidian | `content/record/obsidian/_index.md` | `weight: 2` |
| Quicker 使用记录 | 该篇文章的顶部属性 | `weight: 3` |

权重数字越小越靠前。建议在 Obsidian 中把 `weight` 设置为数字属性，并给同级内容分配明确、不同的权重，避免依赖相同权重下的次级排序。

文件名或标题里的 `01-`、`02-` 不会自动转成权重；`url: /record/01/` 也不会让内容自动排第一。

### 控制系列内部的文章顺序

在“个人博客的搭建心路历程”的 `_index.md` 中添加：

```yaml
weight: 1
orderByWeight: true
```

这两项各有作用：

- `weight: 1`：决定这个栏目在上一级 `record` 列表中的位置。
- `orderByWeight: true`：决定这个栏目内部按文章权重排序。

然后在内部每篇文章的顶部属性中分别设置数字：

```yaml
# 第一篇文章
weight: 1
```

```yaml
# 第二篇文章
weight: 2
```

```yaml
# 第三篇文章
weight: 3
```

这些属性应放在各文件现有的两条 `---` 之间，不要新建第二组属性区。子栏目中的权重可以重新从 `1` 开始，因为不同列表独立排序。

### 改回按日期展示

如果某个栏目希望按日期展示，在该栏目的 `_index.md` 中设置：

```yaml
orderByWeight: false
```

当前 Blowfish 列表模板在关闭权重排序时，按文章的 `date` 分组并展示较新的内容；修改 `lastmod` 不等于修改发布日期。

设置完成后，分别打开 `/record/` 和系列栏目首页检查顺序。若不符合预期，先确认修改的是哪一级 `_index.md`，再检查该级直接子文章或子栏目的 `weight`。


## 使用 Obsidian 写作与管理图片

我使用项目中的 `content/` 作为 Obsidian 仓库。这样文章可以直接由 Hugo 读取，不需要手动复制另一份内容。

### 链接与附件设置

在 **设置 → 文件与链接** 中，将内部链接类型设为 **基于仓库根目录的绝对路径**。正文图片使用标准 Markdown `![](...)`，便于 Hugo 渲染。

我使用 `Custom Attachment Location` 插件，把图片集中存放在笔记所在栏目下的 `00-assets/`：

| 设置 | 本项目使用的值 |
| --- | --- |
| 新附件位置 | `/${noteFolderPath}/00-assets` |
| 生成的附件文件名 | `${date:{momentJsFormat:'YYYYMMDD-HHmmss'}}` |
| 是否重命名附件文件夹 | 开启 |
| Should handle renames | 开启 |
| 空附件文件夹处理 | 删除 |
| 是否删除孤立附件 | 开启 |

这些是我的插件配置记录，实际选项名称以安装的插件版本为准。多个笔记共享一个附件目录时，删除图片前先确认其他文章是否仍在引用；保留备份。

### Obsidian 路径与网站路径的区别

Obsidian 的仓库根目录是 `content/`；网站根路径 `/` 则对应发布后的网站。两者不能直接当成同一个路径。

例如图片实际存放在：

```text
content/record/个人博客的搭建心路历程/00-assets/20260815-205814.png
```

Obsidian 可能生成：

```markdown
![](/record/01/00-assets/20260815-205814.png)
```

在本项目网页中，需要使用从网站根目录开始的路径：

```markdown
![](/record/01/00-assets/20260815-205814.png)
```

开头的 `/` 表示网站根路径，不是 Windows 磁盘路径。省略它时，浏览器可能把图片地址拼接到当前文章网址下，导致找不到图片；更换 `slug` 后，错误的相对路径也可能随之变化。

本项目部署在域名根路径。若以后改为带子路径的项目站点，需要重新检查这些以 `/` 开头的链接。页面包资源和其他相对图片路径也可以使用，不必把所有图片链接统一改成根路径。

### 使用 VS Code 批量修正现有路径

下面的示例只针对缺少开头 `/` 的 `record/` 图片路径。在 VS Code 全局搜索中开启正则模式，把文件范围限制为相关 Markdown 文件，例如 `content/record/**/*.md`。

查找：

```regex
!\[(.*?)\]\((record\/.*?)\)
```

替换：

```text
![$1](/$2)
```

先查看匹配结果，再替换并预览文章。这个操作会修改你当前打开的项目文件；如果 Obsidian 正在使用同一个 `content/`，它看到的也是修改后的文件，不是独立副本。

## 每次修改后的检查

1. 检查文章属性是否位于同一组 `---` 内，日期和 `draft` 是否符合预期。
2. 执行 `hugo server`，确认栏目、文章、图片和链接正常。
3. 修改已发布的网址时，添加旧路径别名并验证跳转。
4. 执行 `hugo --minify`，检查构建是否成功。
5. 查看 Git 改动，确认文章迁移时图片也一起迁移，再提交发布。

早期配置由豆包辅助整理，本文按当前项目结构修订；主题美化相关配置另见本系列的《05-美化网站》。

---
date: 2026-08-08 18:40:30
lastmod: 2026-09-15
title: Custom Attachment Location
---

## 202604
描述：管理附件存储位置
附件保存相对文件路径：`./附件/${noteFileName}`
附件保存绝对路径：`附件/${noteFolderPath}/${noteFileName}`
示例：
- 若笔记路径是 `docs/study/Obsidian教程.md` → 附件路径会是 `attachments/docs/study/Obsidian教程/`；
- 若笔记路径是 `work/项目计划.md` → 附件路径会是 `attachments/work/项目计划/`；
- 若笔记直接在根目录（无嵌套子文件夹）→ 附件路径是 `attachments/根目录笔记名/`。
主要用这个管理附件位置与image converter的插件会冲突一点

新附件位置：`00-assets/${noteFolderPath}/${noteFileName}`

生成的附件文件名：`assets-${date:{momentJsFormat:'YYYYMMDD-HHmmss'}}`


## 20260828
发现这样以后有个弊端，所有文件夹都放在统一的assets里面，以后想迁移的话不好进行迁移，

新附件位置改为：`${noteFolderPath}/00-assets/`

>附件就自动保存在每个文件夹的下面的`00-assets`下面，
>
>在obsidian里面的路径修改为基于当前笔记的相对路径，这样md文件里面的路径就变为了`![](00-assets/assets-20260828-213026.png)`，
>
>无论上面嵌套多少层文件夹，也不妨碍文件迁移，直接将文件夹复制搬走即可

因为我用`Hugo`写博客，必须要将路径修改为基于当前笔记的绝对路径，具体见[使用obsidian注意事项](record/个人博客的搭建心路历程/03-Hugo进阶配置.md#使用obsidian注意事项)


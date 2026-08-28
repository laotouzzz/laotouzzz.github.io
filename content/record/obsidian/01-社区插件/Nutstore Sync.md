---
title: Nutstore Sync
date: 2026-07-20
lastmod: 2026-08-28
---

简介：坚果云官方的obsidian同步插件
我用syncthing进行同步
# Obsidian Nutstore Sync（坚果云官方插件）排除规则完整说明

#### 基础写法（屏蔽文件夹）
1. 仅库根目录 `output` 整个文件夹不同步
```
output/**
```
2. 任意深度所有名为 `cache` 的文件夹全部屏蔽
```
**/cache/**
```
3. 多层子目录精准屏蔽：`资料/草稿`
```
资料/草稿/**
```
4. 屏蔽所有视频、压缩包
```
*.mp4
*.mov
*.zip
*.rar
```

#### 取反规则（屏蔽文件夹，但保留里面某个文件）
```
temp/**
!temp/重要笔记.md
```

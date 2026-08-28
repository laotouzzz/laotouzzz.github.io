---
title: Obsidian Callout 标注框语法教程
date: 2026-08-08 18:40:30
lastmod: 2026-08-28
---

# Obsidian Callout 标注框语法教程

## 一、Callout 是什么

Callout 是 Obsidian 内置的一种内容标注格式，可以将重要信息显示为带有背景颜色、图标和标题的提示框。

常见用途包括：

- 知识点说明
    
- 注意事项
    
- 操作提示
    
- 问题与答案
    
- 警告信息
    
- 资料链接整理
    
- 示例代码展示
    

例如，下图所示的蓝色信息框，就是 Obsidian 的 Callout 标注框。

需要注意的是，标题中的“PrismJS 与编辑视图”只是用户自定义的标题，并不代表该效果由 PrismJS 实现。

---

## 二、Callout 的基本语法

Callout 的基本格式如下：

```markdown
> [!类型] 标题
> 内容
```

示例：
> [!info] PrismJS 与编辑视图
> GreenVideo 视频下载：https://greenvideo.cc/
> 飞鱼视频下载：https://www.feiyudo.com/

显示效果为一个蓝色的信息提示框，标题为“PrismJS 与编辑视图”。

---
## 三、语法组成说明
以以下代码为例：

```markdown
> [!info]+ PrismJS 与编辑视图
> GreenVideo 视频下载：https://greenvideo.cc/
> 飞鱼视频下载：https://www.feiyudo.com/
```

各部分含义如下。
### 1. 引用符号 `>`
```markdown
>
```
Callout 本质上建立在 Markdown 引用块语法之上，因此 Callout 中的每一行通常都需要以 `>` 开头。

正确写法：

```markdown
> [!info] 标题
> 第一行内容
> 第二行内容
```

错误写法：

```markdown
> [!info] 标题
> 第一行内容
第二行内容
```

在错误写法中，第二行内容可能会显示在 Callout 外部。

---
### 2. Callout 类型 `[!info]`

```markdown
[!info]
```

方括号中的内容决定 Callout 的类型、图标和默认颜色。

例如：

```markdown
> [!info] 信息
> 这里是普通说明内容。
```

其中，`info` 表示信息类型，通常显示为蓝色背景和信息图标。

---

### 3. 自定义标题

```markdown
PrismJS 与编辑视图
```

类型代码后面的文字就是 Callout 标题。

例如：

```markdown
> [!info] 常用视频下载网站
> 这里填写网站地址。
```

如果不填写自定义标题，Obsidian 会使用 Callout 类型名称作为默认标题。

例如：

> [!info]
> 这里是说明内容。

---

## 四、Callout 的折叠功能

Callout 可以设置为可折叠形式。

### 1. 默认展开

在类型后添加 `+`：

```markdown
> [!info]+ 常用网站
> GreenVideo：https://greenvideo.cc/
> 飞鱼视频：https://www.feiyudo.com/
```

效果：

- 显示折叠箭头
- Callout 默认处于展开状态
- 点击标题可以收起内容
### 2. 默认收起

在类型后添加 `-`：

```markdown
> [!info]- 常用网站
> GreenVideo：https://greenvideo.cc/
> 飞鱼视频：https://www.feiyudo.com/
```

效果：
- 显示折叠箭头
- Callout 默认处于收起状态
- 点击标题后显示内容
### 3. 不允许折叠

不添加 `+` 或 `-`：

```markdown
> [!info] 常用网站
> GreenVideo：https://greenvideo.cc/
> 飞鱼视频：https://www.feiyudo.com/
```

效果
- 内容始终展开
- 通常不显示折叠按钮
- 用户无法通过点击标题收起内容
---

## 五、完整语法结构

Callout 的完整语法可以概括为：

```markdown
> [!类型][折叠状态] 自定义标题
> 内容
```

其中：

|组成部分|作用|示例|
|---|---|---|
|`>`|创建引用块|`>`|
|`[!类型]`|设置样式和图标|`[!info]`|
|`+`|可折叠，默认展开|`[!info]+`|
|`-`|可折叠，默认收起|`[!info]-`|
|自定义标题|设置提示框标题|`常用网站`|
|内容|提示框中的正文|`网站地址`|

---

## 六、常用 Callout 类型

### 1. 信息说明

```markdown
> [!info] 信息
> 这里是一般说明内容。
```

适合用于补充信息和资料说明。

---

### 2. 提示

```markdown
> [!tip] 提示
> 这里是操作技巧或学习建议。
```

适合用于操作技巧和实用建议。

---

### 3. 注意事项

```markdown
> [!warning] 注意
> 执行此操作前，请先备份文件。
```

适合用于容易被忽略的重要事项。

---

### 4. 危险警告

```markdown
> [!danger] 危险
> 删除文件后可能无法恢复。
```

适合用于风险较高的操作提醒。

---

### 5. 问题

```markdown
> [!question] 问题
> Callout 是否可以折叠？
```

适合用于提出问题、课堂思考题或常见问题。

---

### 6. 成功或完成

```markdown
> [!success] 已完成
> 文档已经成功保存。
```

适合用于显示成功结果和完成状态。

---

### 7. 示例

```markdown
> [!example] 示例
> 下面展示一个完整的 Callout 写法。
```

适合用于教材案例、代码示例和操作演示。

---

### 8. 引用

```markdown
> [!quote] 引用
> 知识需要不断整理和复习。
```

适合用于名言、原文摘录和参考内容。

### 9. 备注

```markdown
> [!note] 备注
> 本节内容仅适用于 Obsidian。
```

> [!note] 备注
> 本节内容仅适用于 Obsidian。

适合用于补充说明和学习笔记。

---

## 七、在 Callout 中添加链接

### 1. 直接书写网址

```markdown
> [!info] 视频下载网站
> GreenVideo：https://greenvideo.cc/
> 飞鱼视频：https://www.feiyudo.com/
```

> [!info] 视频下载网站
> GreenVideo：https://greenvideo.cc/
> 飞鱼视频：https://www.feiyudo.com/

Obsidian 通常会自动识别完整网址并将其显示为可点击链接。

---

### 2. 使用 Markdown 链接

推荐在正式文档中使用 Markdown 链接语法：

```markdown
> [!info] 视频下载网站
> [GreenVideo 视频下载](https://greenvideo.cc/)
> [飞鱼视频下载](https://www.feiyudo.com/)
```

Markdown 链接的格式为：

```markdown
[显示文字](网址)
```

这种写法更加整洁，也方便读者理解链接的用途。

---

## 八、控制内容换行

### 方法一：每一行添加 `>`

```markdown
> [!info] 视频下载网站
> GreenVideo 视频下载：https://greenvideo.cc/
> 飞鱼视频下载：https://www.feiyudo.com/
```

这是最简单的写法。

---

### 方法二：使用两个空格强制换行

在第一行末尾添加两个空格：

```markdown
> [!info] 视频下载网站
> GreenVideo 视频下载：https://greenvideo.cc/  
> 飞鱼视频下载：https://www.feiyudo.com/
```

两个空格必须位于第一行的末尾。

---

### 方法三：使用 `<br>`

```markdown
> [!info] 视频下载网站
> GreenVideo 视频下载：https://greenvideo.cc/<br>
> 飞鱼视频下载：https://www.feiyudo.com/
```

`<br>` 是 HTML 换行标签，可以强制内容换行。

在普通笔记中，优先推荐使用 Markdown 本身的换行方式。

---

## 九、在 Callout 中创建多个段落

如果需要在一个 Callout 中显示多个段落，应在段落之间添加一行只有 `>` 的空行。

```markdown
> [!note] 学习说明
> Callout 是 Obsidian 内置的标注功能。
>
> 它可以用于整理重点、警告和补充信息。
>
> Callout 还支持标题和折叠功能。
```

> [!note] 学习说明
> Callout 是 Obsidian 内置的标注功能。
>
> 它可以用于整理重点、警告和补充信息。
>
> Callout 还支持标题和折叠功能。

其中：

```markdown
>
```

表示 Callout 内部的空白段落。

---

## 十、在 Callout 中使用列表

Callout 中可以使用无序列表：

```markdown
> [!info] 常用网站
> - [GreenVideo](https://greenvideo.cc/)
> - [飞鱼视频](https://www.feiyudo.com/)
```

也可以使用有序列表：

```markdown
> [!info] 操作步骤
> 1. 打开 Obsidian。
> 2. 创建一个新笔记。
> 3. 输入 Callout 语法。
> 4. 切换到阅读视图查看效果。
```

---

## 十一、在 Callout 中使用代码

可以在 Callout 中放置行内代码：

```markdown
> [!tip] 语法提示
> 使用 `[!info]` 可以创建信息类型的 Callout。
```

也可以放置代码块，但代码块中的每一行也需要保留引用符号：

```markdown
> [!example] Callout 示例代码
> ```markdown
> > [!info] 标题
> > 这里是正文。
> ```
```

---

## 十二、嵌套 Callout

Callout 内部还可以嵌套另一个 Callout。

```markdown
> [!info] 外层 Callout
> 这里是外层内容。
>
> > [!warning] 内层 Callout
> > 这里是内层警告内容。
```

嵌套层级越深，需要添加的 `>` 越多。

不过，正式文档中不建议嵌套过多，否则内容会显得复杂。

---

## 十三、截图内容对应的推荐写法

截图中的内容可以整理为：

```markdown
> [!info]+ PrismJS 与编辑视图
> [GreenVideo 视频下载](https://greenvideo.cc/)
> [飞鱼视频下载](https://www.feiyudo.com/)
```

其中：

- `info`：蓝色信息提示框
    
- `+`：允许折叠，并且默认展开
    
- `PrismJS 与编辑视图`：自定义标题
    
- 两个网站使用 Markdown 链接格式
    
- 每行都以 `>` 开头，因此内容位于同一个 Callout 中
    

---

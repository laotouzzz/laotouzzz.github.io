---
source: https://ncepuee.github.io/2026/05/24/Codex-Reconnecting-Fix-2026/
date: 2026-09-13
lastmod: 2026-09-15
title: 03-Codex每次都要Reconnecting 5次？三个方案彻底解决
weight: "3"
slug: "3"
---

## 前言

有个问题挺烦的——每次打开 Codex，让它回答之前，都会先来一套：

```
Reconnecting… 1/5
Reconnecting… 2/5
Reconnecting… 3/5
Reconnecting… 4/5
Reconnecting… 5/5
```

好家伙，不是一次两次，是每次都这样。而且最恶心的是，它最后又不是不能用——它会卡那么一会儿，然后突然正常开始回答。这就很迷惑。

---

## 一、根本原因：WebSocket 没走通

原因并不复杂。Codex 默认会优先使用 **WebSocket（WSS 协议）** 去和服务器建立实时连接。但很多代理环境下，WSS 不一定能正常走代理。

于是就会出现一个典型现象：

```
Codex 尝试 WebSocket 连接 → 失败
  → 再试 → 再失败
    → 继续试 → 连续失败 5 次
      → 每次超时约 20 秒
        → 5 次下来，一两分钟在罚站
          → 放弃 WebSocket，降级回退到普通 HTTP
            → HTTP 正常走代理 → 突然能用了
```

**不是模型慢、不是账号问题、不是 Codex 崩了** ——大概率就是 WebSocket 没走通。

---

## 二、方案一：直接禁用 WebSocket（最快最直接）

如果你不想折腾代理配置，最简单的办法就是让 Codex 别再优先走 WebSocket，直接强制它只用 HTTPS。

### 找到配置文件

| 系统 | 路径 |
| --- | --- |
| macOS / Linux | `~/.codex/config.toml` |
| Windows | `C:\Users\你的用户名\.codex\config.toml` |

### 修改配置

在配置文件 **顶部** 添加或修改：

```toml
model_provider = "openai_http"
```

在文件 **末尾** 添加：

```toml
[model_providers.openai_http]
name = "OpenAI HTTP only"
wire_api = "responses"
supports_websockets = false
```

### 保存后重启 Codex

这波操作的意思很简单：告诉 Codex 别连 WebSocket 了，直接走 HTTP。这样就不会再出现前面 5 次 Reconnecting 的罚站流程。

**副作用：** Codex 的历史会话可能会按 provider 分组。切到 `openai_http` 之后，原来 provider 下面的部分历史会话可能暂时看不到。不是没了，只是分组变了——如果想回去，把配置还原即可。

---

## 三、方案二：配置.env 让 WebSocket 也走代理（推荐）

如果你希望 Codex 保持默认能力，不想禁用 WebSocket，这个方案更推荐。

### 创建.env 文件

路径如下：

| 系统 | 路径 |
| --- | --- |
| macOS / Linux | `~/.codex/.env` |
| Windows | `C:\Users\你的用户名\.codex\.env` |

> **注意：** 文件名就是 `.env` ，不是 `.env.txt` 。Windows 用户尤其注意别让系统隐藏了后缀名。

### 文件内容

```
HTTP_PROXY="http://127.0.0.1:你的代理端口"
HTTPS_PROXY="http://127.0.0.1:你的代理端口"
NO_PROXY="localhost,127.0.0.1,::1"
```

端口号换成你代理软件实际使用的端口：

| 代理软件 | 常见端口 |
| --- | --- |
| Clash | `7890` |
| v2rayN | `10808` |

具体以你自己的代理软件里显示的端口为准。

这个方案的核心思路是 **不禁用 WebSocket，而是让 WebSocket 握手也能正确走代理** ，这样 Codex 就不用先失败 5 次再 fallback 到 HTTP 了。

---

## 四、方案三：TUN 兜底方案

还有一种办法——直接在代理软件里开启 **TUN 模式** 。

TUN 的逻辑更粗暴：它不是只代理某个软件，也不是只代理终端环境变量，而是 **从虚拟网卡层面接管系统流量** 。

所以理论上，Codex 的 WebSocket、HTTPS、各种请求都更容易被接住。

### 但我不建议一上来就开 TUN

原因很简单： **TUN 影响范围太大** 。它可能会影响：

### 建议顺序

TUN 更适合当 **兜底方案** ——前面两个方案都不行，再考虑它。

---

## 五、我的建议

| 方案 | 推荐度 | 场景 |
| --- | --- | --- |
| **方案一：禁用 WebSocket** | ⭐⭐⭐ | 想马上解决，不想理解网络细节 |
| **方案二：配置.env** | ⭐⭐⭐⭐⭐ | 想保留默认能力，更规范的长期方案 |
| **方案三：TUN 模式** | ⭐⭐ | 兜底，前面都不行再试 |

如果你已经在用 Clash、Surge、Shadowrocket、v2rayN 这类工具，并且熟悉 TUN 的话，方案三也可以用——但不要上来就开。

因为它不是只影响 Codex，而是可能影响 **整个系统网络** 。别 Codex 是好了，其他软件又开始抽风了。

---

*本文内容整理自微信公众号文章，整理日期：2026-05-24。*
# 相关资源
[https://ncepuee.github.io/2026/05/24/Codex-Reconnecting-Fix-2026/](https://ncepuee.github.io/2026/05/24/Codex-Reconnecting-Fix-2026/)
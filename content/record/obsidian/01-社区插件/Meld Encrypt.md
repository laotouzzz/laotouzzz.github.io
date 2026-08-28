---
title: Meld Encrypt
date: 2026-08-08 18:40:30
lastmod: 2026-08-28
---

[github源码](https://github.com/meld-cp/obsidian-encrypt)
[官方使用教程](https://meld-cp.github.io/obsidian-encrypt/)
[第三方使用教程](https://pkmer.cn/Pkmer-Docs/10-obsidian/obsidian%E7%A4%BE%E5%8C%BA%E6%8F%92%E4%BB%B6/readme/meld-encrypt_readme/)
项目简介：Meld Encrypt 是一个社区插件，它允许你在 Obsidian 中对笔记进行加密和解密。你可以选择对整篇笔记进行加密，或者仅加密笔记中的选定文本。

已翻译为中文
	![](../00-assets/obsidian插件/obsidian-encrypt-main.7z)
# Meld Encrypt 加密方案-20260630

> Obsidian 插件 [meld-cp/obsidian-encrypt](https://github.com/meld-cp/obsi) v2.0 完整加密流程。
> 文件后缀 `.mdenc`，实际是 JSON。

## 加密流程

```
明文 (UTF-8)
  → AES-256-GCM 加密
  → 拼接: IV(16) + Salt(16) + Ciphertext(n) + Tag(16)
  → Base64 编码
  → JSON 包装 { version, hint, encodedData }
  → .mdenc 文件
```
## 参数表

| 参数 | 值 |
|---|---|
| 对称加密 | AES-256-GCM |
| 密钥长度 | 256 bit (32 bytes) |
| IV 长度 | 16 bytes（随机生成） |
| KDF | PBKDF2 |
| 哈希算法 | SHA-512 |
| 迭代次数 | 210,000 |
| Salt 长度 | 16 bytes（随机生成） |
| GCM Tag | 16 bytes |
| 编码 | 标准 Base64 |
## 二进制布局

```
偏移      0               16              32             32+n
┌──────────────┬──────────────┬─────────────────┬──────────────┐
│   IV (16B)   │  Salt (16B)  │ Ciphertext (nB) │  Tag (16B)   │
└──────────────┴──────────────┴─────────────────┴──────────────┘
```
最小有效长度: 16 + 16 + 0 + 16 = 48 bytes（空密文 + tag 的结构下限）
## JSON 格式

```json
{
  "version": "2.0",
  "hint": "",
  "encodedData": "<IV+Salt+CipherText+Tag 的 Base64>"
}
```

## 每次加密结果不同的原因

Salt 和 IV 均为随机生成 → 每次 PBKDF2 派生不同密钥 → 密文不同 → Base64 不同。

这是正确行为，防止通过比较密文推断信息或构建彩虹表。

## 解密流程（逆向）

```
Base64 解码 → 拆分 IV(16) + Salt(16) + CT(n-16) + Tag(16)
  → PBKDF2(SHA-512, password, salt, 210000) 派生 AES-256 密钥
  → AES-256-GCM 解密（传入 IV、密钥、CT+Tag）
  → 认证标签校验 → 通过则输出明文，失败则密码错误
```

## 安全边界

| ✅ 有保护 | ❌ 无保护 |
|---|---|
| 明文机密性 (AES-GCM) | 元信息（版本号、hint 明文） |
| 内容完整性 (GCM Tag) | 文件名 |
| 抗暴力破解 (210K × SHA-512) | 弱密码（不阻止字典攻击） |

## 解密工具
纯前端 HTML 工具，密码不离开浏览器:
- **注意**: Firefox 在 `file://` 协议下禁止 `crypto.subtle`，需 Chrome 或用 HTTP 服务打开

已经放到热铁盒网页托管v1：[laotou.rth1.xyz](https://laotou.rth1.xyz/)
艾可秀网页托管v3：[https://www.axureshow.com/project/a0gFweCu/](https://www.axureshow.com/project/a0gFweCu/)

代码如下
v1使用方式：新建txt文件复制代码到里面，然后将txt修改为html，然后双击html文件用浏览器（edge/google浏览器）打开，将此插件加密后的mdenc文件拖拽输入密码即可

v3使用方式：
1. 复制如下内容
![](/record/obsidian/01-社区插件/00-assets/assets-20260701-125353.jpg)
2. 打开网页托管网址-粘贴上面的内容
![](/record/obsidian/01-社区插件/00-assets/assets-20260701-125455.jpg)
3. 输入解密密码即可
### v1 
```
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Meld Encrypt 解密工具</title>
<style>
  *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
  :root{
    --bg:#09090b;--surface:#131316;--surface2:#1a1a1f;--surface-hover:#1e1e24;
    --border:#27272e;--border-active:#c9a24d;
    --accent:#c9a24d;--accent-dim:#a08338;--accent-glow:rgba(201,162,77,0.12);
    --text:#e8e4dc;--text2:#9a968e;--text3:#5c584f;
    --ok:#56b886;--ok-bg:rgba(86,184,134,0.07);--err:#d05050;--err-bg:rgba(208,80,80,0.07);
    --warn:#e8b84a;--warn-bg:rgba(232,184,74,0.08);
    --r:9px;
  }
  html{font-size:16px}
  body{
    background:var(--bg);color:var(--text);font-family:'Cascadia Code','Fira Code','Consolas','等线',monospace;
    min-height:100vh;display:flex;flex-direction:column;align-items:center;
    justify-content:center;padding:2rem;position:relative;overflow-x:hidden;
  }
  body::before{
    content:'';position:fixed;inset:0;pointer-events:none;
    background:
      radial-gradient(ellipse 550px 380px at 20% 25%,rgba(201,162,77,0.025),transparent),
      radial-gradient(ellipse 450px 450px at 80% 75%,rgba(80,60,30,0.025),transparent);
  }
  body::after{
    content:'';position:fixed;inset:0;pointer-events:none;opacity:.45;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E");
  }
  .wrap{width:100%;max-width:560px;position:relative;z-index:1}

  /* Alert banner */
  .alert{display:none;padding:.7rem 1rem;border-radius:var(--r);font-size:.7rem;line-height:1.6;margin-bottom:1.2rem;animation:fadeUp .5s ease both}
  .alert.show{display:block}
  .alert.err{background:var(--err-bg);border:1px solid rgba(208,80,80,.25);color:var(--err)}
  .alert.warn{background:var(--warn-bg);border:1px solid rgba(232,184,74,.25);color:var(--warn)}
  .alert code{font-family:'Cascadia Code','Fira Code','Consolas','等线',monospace;background:rgba(255,255,255,.08);padding:.1rem .35rem;border-radius:3px}
  .alert .cmd{display:block;background:var(--surface);padding:.4rem .6rem;border-radius:5px;margin-top:.4rem;font-size:.72rem;border:1px solid var(--border);color:var(--accent);word-break:break-all;user-select:all}

  /* Header */
  .hdr{text-align:center;margin-bottom:2.2rem;animation:fadeUp .65s ease both}
  .hdr .ic{width:44px;height:44px;margin:0 auto 1rem}
  .hdr .ic svg{width:100%;height:100%;stroke:var(--accent);stroke-width:1.5;fill:none;filter:drop-shadow(0 0 10px rgba(201,162,77,.28))}
  .hdr h1{font-family:Georgia,'Noto Serif CJK SC','宋体',serif;font-weight:300;font-size:1.9rem;letter-spacing:.04em;margin-bottom:.25rem}
  .hdr p{font-size:.7rem;color:var(--text3);letter-spacing:.1em;text-transform:uppercase}

  /* Dropzone */
  .dz{
    border:1.5px dashed var(--border);border-radius:var(--r);background:var(--surface);
    padding:2.2rem 1.8rem;text-align:center;cursor:pointer;
    transition:all .28s ease;position:relative;overflow:hidden;
    animation:fadeUp .65s ease .08s both;
  }
  .dz::before{content:'';position:absolute;inset:0;background:var(--accent-glow);opacity:0;transition:opacity .28s ease}
  .dz:hover,.dz.over{border-color:var(--accent);border-style:solid;background:var(--surface-hover)}
  .dz:hover::before,.dz.over::before{opacity:1}
  .dz .dz-ic{width:36px;height:36px;margin:0 auto .9rem;position:relative;z-index:1}
  .dz .dz-ic svg{width:100%;height:100%;stroke:var(--text2);stroke-width:1.5;fill:none;transition:stroke .28s}
  .dz:hover .dz-ic svg{stroke:var(--accent)}
  .dz .dz-t{position:relative;z-index:1;font-size:.82rem;color:var(--text2);line-height:1.65}
  .dz .dz-t b{color:var(--accent);font-weight:500}
  .dz .dz-h{position:relative;z-index:1;font-size:.66rem;color:var(--text3);margin-top:.4rem}

  .dz.loaded{border-color:var(--ok);border-style:solid;padding:1.1rem 1.4rem}
  .dz.loaded .dz-ic,.dz.loaded .dz-t,.dz.loaded .dz-h{display:none}
  .fi{display:none;align-items:center;gap:.7rem;position:relative;z-index:1}
  .dz.loaded .fi{display:flex}
  .fi .fi-ic{width:28px;height:28px;flex-shrink:0}
  .fi .fi-ic svg{width:100%;height:100%;stroke:var(--ok);stroke-width:1.5;fill:none}
  .fi .fi-d{flex:1;text-align:left}
  .fi .fi-n{font-size:.78rem;color:var(--text);font-weight:500;word-break:break-all}
  .fi .fi-s{font-size:.66rem;color:var(--text3);margin-top:.1rem}
  .fi .fi-x{width:26px;height:26px;flex-shrink:0;border:none;background:0 0;cursor:pointer;border-radius:5px;display:flex;align-items:center;justify-content:center;transition:background .2s}
  .fi .fi-x:hover{background:var(--err-bg)}
  .fi .fi-x svg{width:14px;height:14px;stroke:var(--text3);stroke-width:2;fill:none;transition:stroke .2s}
  .fi .fi-x:hover svg{stroke:var(--err)}

  /* Diagnostic */
  .diag{
    margin-top:.8rem;background:var(--surface);border:1px solid var(--border);
    border-radius:var(--r);padding:.9rem 1rem;font-size:.7rem;line-height:1.7;
    color:var(--text2);display:none;animation:fadeUp .35s ease both;
  }
  .diag.show{display:block}
  .diag .dg-row{display:flex;justify-content:space-between}
  .diag .dg-row .dg-k{color:var(--text3)}
  .diag .dg-row .dg-v{color:var(--text);font-weight:500}
  .diag .dg-row .dg-v.ok{color:var(--ok)}
  .diag .dg-row .dg-v.err{color:var(--err)}
  .diag .dg-sep{border-top:1px solid var(--border);margin:.5rem 0}
  .diag .dg-hex{font-size:.65rem;color:var(--text3);word-break:break-all;margin-top:.3rem}

  /* Tabs */
  .tabs{display:flex;gap:0;margin-top:.8rem;animation:fadeUp .65s ease .14s both}
  .tab{
    flex:1;padding:.5rem;text-align:center;font-size:.7rem;letter-spacing:.08em;
    color:var(--text3);background:var(--surface);border:1px solid var(--border);
    cursor:pointer;transition:all .2s;text-transform:uppercase;
  }
  .tab:first-child{border-radius:var(--r) 0 0 var(--r)}
  .tab:last-child{border-radius:0 var(--r) var(--r) 0}
  .tab.act{color:var(--accent);border-color:var(--accent);background:var(--accent-glow)}
  .tab:hover:not(.act){color:var(--text2);background:var(--surface-hover)}

  .paste-area{
    display:none;margin-top:.6rem;animation:fadeUp .3s ease both;
  }
  .paste-area.show{display:block}
  .paste-area textarea{
    width:100%;min-height:120px;background:var(--surface);border:1px solid var(--border);
    border-radius:var(--r);padding:.85rem;font-family:'Cascadia Code','Fira Code','Consolas','等线',monospace;font-size:.78rem;
    color:var(--text);resize:vertical;outline:none;transition:border-color .25s;
  }
  .paste-area textarea::placeholder{color:var(--text3)}
  .paste-area textarea:focus{border-color:var(--accent)}

  /* Password */
  .pw-sec{margin-top:1rem;animation:fadeUp .65s ease .2s both}
  .pw-sec label{display:block;font-size:.68rem;color:var(--text3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:.45rem}
  .pw-w{position:relative;display:flex;align-items:center}
  .pw-w input{
    width:100%;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r);
    padding:.8rem 2.8rem .8rem .9rem;font-family:'Cascadia Code','Fira Code','Consolas','等线',monospace;font-size:.85rem;
    color:var(--text);outline:none;transition:border-color .25s,box-shadow .25s;
  }
  .pw-w input::placeholder{color:var(--text3);font-size:.78rem}
  .pw-w input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-glow)}
  .pw-tog{
    position:absolute;right:.5rem;width:30px;height:30px;background:0 0;border:none;
    cursor:pointer;border-radius:5px;display:flex;align-items:center;justify-content:center;
    transition:background .2s;
  }
  .pw-tog:hover{background:var(--accent-glow)}
  .pw-tog svg{width:17px;height:17px;stroke:var(--text3);stroke-width:1.8;fill:none;transition:stroke .2s}
  .pw-tog:hover svg{stroke:var(--accent)}
  .hint-bar{margin-top:.5rem;font-size:.68rem;color:var(--accent-dim);display:none}
  .hint-bar.show{display:block}
  .hint-bar::before{content:'提示: '}

  /* Advanced */
  .adv{
    margin-top:.7rem;animation:fadeUp .65s ease .25s both;
  }
  .adv-toggle{
    font-family:'Cascadia Code','Fira Code','Consolas','等线',monospace;font-size:.68rem;color:var(--text3);
    background:0 0;border:none;cursor:pointer;letter-spacing:.06em;
    display:flex;align-items:center;gap:.35rem;transition:color .2s;
  }
  .adv-toggle:hover{color:var(--accent)}
  .adv-toggle .arr{display:inline-block;transition:transform .2s;font-size:.6rem}
  .adv-toggle .arr.open{transform:rotate(90deg)}
  .adv-body{
    display:none;margin-top:.5rem;background:var(--surface);border:1px solid var(--border);
    border-radius:var(--r);padding:.8rem 1rem;
  }
  .adv-body.show{display:block}
  .adv-body .opt-row{display:flex;align-items:center;gap:.6rem;margin-bottom:.5rem}
  .adv-body .opt-row:last-child{margin-bottom:0}
  .adv-body .opt-row label{font-size:.68rem;color:var(--text3);min-width:70px;letter-spacing:.05em}
  .adv-body .opt-row select{
    flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:5px;
    padding:.4rem .6rem;font-family:'Cascadia Code','Fira Code','Consolas','等线',monospace;font-size:.72rem;color:var(--text);
    outline:none;cursor:pointer;
  }
  .adv-body .opt-row select:focus{border-color:var(--accent)}

  /* Button */
  .btn-sec{margin-top:1.5rem;animation:fadeUp .65s ease .3s both}
  .btn{
    width:100%;padding:.88rem;background:var(--accent);color:var(--bg);
    font-family:'Cascadia Code','Fira Code','Consolas','等线',monospace;font-size:.82rem;font-weight:500;
    letter-spacing:.12em;text-transform:uppercase;border:none;border-radius:var(--r);
    cursor:pointer;transition:all .25s;position:relative;overflow:hidden;
  }
  .btn:hover:not(:disabled){background:#d4ad55;letter-spacing:.16em;box-shadow:0 4px 20px rgba(201,162,77,.22)}
  .btn:active:not(:disabled){transform:scale(.985)}
  .btn:disabled{opacity:.35;cursor:not-allowed}
  .btn .sp{display:none;width:17px;height:17px;border:2px solid var(--bg);border-top-color:transparent;border-radius:50%;animation:spin .65s linear infinite;margin:0 auto}
  .btn.ldg .bl{display:none}.btn.ldg .sp{display:inline-block;vertical-align:middle}

  /* Log */
  .log{
    margin-top:1rem;display:none;animation:fadeUp .35s ease both;
    background:var(--surface);border:1px solid var(--border);border-radius:var(--r);
    padding:.7rem 1rem;max-height:150px;overflow-y:auto;
  }
  .log.show{display:block}
  .log .lg{font-size:.68rem;line-height:1.6;color:var(--text3)}
  .log .lg .try{color:var(--text2)}
  .log .lg .fail{color:var(--err)}
  .log .lg .pass{color:var(--ok)}
  .log::-webkit-scrollbar{width:4px}
  .log::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}

  /* Result */
  .res{margin-top:1.2rem;display:none;animation:fadeUp .4s ease both}
  .res.show{display:block}
  .res .rh{display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem}
  .res .rh .rl{font-size:.68rem;text-transform:uppercase;letter-spacing:.1em}
  .res .rh .rl.ok{color:var(--ok)}.res .rh .rl.err{color:var(--err)}
  .cp{
    font-family:'Cascadia Code','Fira Code','Consolas','等线',monospace;font-size:.64rem;color:var(--text3);
    background:var(--surface);border:1px solid var(--border);border-radius:5px;
    padding:.3rem .6rem;cursor:pointer;letter-spacing:.05em;transition:all .2s;
  }
  .cp:hover{border-color:var(--accent);color:var(--accent)}
  .cp.done{border-color:var(--ok);color:var(--ok)}
  .rb{
    background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r);
    padding:1rem;max-height:380px;overflow-y:auto;
  }
  .rb.ok{border-color:rgba(86,184,134,.25)}.rb.err{border-color:rgba(208,80,80,.25);background:var(--err-bg)}
  .rb pre{font-family:'Cascadia Code','Fira Code','Consolas','等线',monospace;font-size:.77rem;line-height:1.65;color:var(--text);white-space:pre-wrap;word-break:break-all}
  .rb.err pre{color:var(--err)}
  .rb::-webkit-scrollbar{width:4px}.rb::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}

  /* Footer */
  .ft{
    margin-top:2rem;text-align:center;font-size:.65rem;color:var(--text3);
    letter-spacing:.05em;animation:fadeUp .65s ease .35s both;line-height:1.8;
  }
  .ft .sn{display:inline-flex;align-items:center;gap:.3rem;margin-top:.2rem;opacity:.55}
  .ft .sn svg{width:11px;height:11px;stroke:currentColor;stroke-width:2;fill:none}

  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @media(max-width:600px){body{padding:1.1rem}.hdr h1{font-size:1.5rem}.dz{padding:1.8rem 1.1rem}}
</style>
</head>
<body>

<div class="wrap">
  <!-- Alert -->
  <div class="alert" id="alert"></div>

  <div class="hdr">
    <div class="ic">
      <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><circle cx="12" cy="16" r="1"/>
      </svg>
    </div>
    <h1>Meld Encrypt 解密</h1>
    <p>支持 .mdenc / .json 文件 · 纯本地解密</p>
  </div>

  <!-- Dropzone -->
  <div class="dz" id="dz">
    <div class="dz-ic">
      <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    </div>
    <div class="dz-t">拖拽 <b>.mdenc</b> 或 <b>.json</b> 文件到此处<br>或点击选择</div>
    <div class="dz-h">也可粘贴 JSON 内容 ↓</div>
    <div class="fi">
      <div class="fi-ic">
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 15 11 17 15 13"/>
        </svg>
      </div>
      <div class="fi-d">
        <div class="fi-n" id="fName">—</div>
        <div class="fi-s" id="fSize">—</div>
      </div>
      <button class="fi-x" id="fRem" title="移除" type="button">
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <input type="file" id="fIn" accept=".mdenc,.json,.txt,.md" hidden>
  </div>

  <!-- Paste toggle -->
  <div class="tabs">
    <div class="tab act" data-m="file">选择文件</div>
    <div class="tab" data-m="paste">粘贴内容</div>
  </div>
  <div class="paste-area" id="pa">
    <textarea id="paTxt" placeholder='粘贴 {"version":"2.0","hint":"","encodedData":"..."} JSON 内容' spellcheck="false"></textarea>
  </div>

  <!-- Diagnostic -->
  <div class="diag" id="diag"></div>

  <!-- Password -->
  <div class="pw-sec">
    <label for="pw">解密密码</label>
    <div class="pw-w">
      <input type="password" id="pw" placeholder="输入加密时设置的密码" autocomplete="off" spellcheck="false">
      <button class="pw-tog" id="pwTog" title="显示密码" type="button">
        <svg id="eye" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
        </svg>
      </button>
    </div>
    <div class="hint-bar" id="hintBar"></div>
  </div>

  <!-- Advanced -->
  <div class="adv">
    <button class="adv-toggle" id="advTog" type="button">
      <span class="arr" id="advArr">▶</span> 高级参数
    </button>
    <div class="adv-body" id="advBody">
      <div class="opt-row">
        <label>哈希算法</label>
        <select id="optHash">
          <option value="SHA-512" selected>SHA-512 (v2.0 默认)</option>
          <option value="SHA-256">SHA-256</option>
          <option value="SHA-384">SHA-384</option>
          <option value="SHA-1">SHA-1</option>
        </select>
      </div>
      <div class="opt-row">
        <label>迭代次数</label>
        <select id="optIter">
          <option value="210000" selected>210,000 (v2.0 默认)</option>
          <option value="600000">600,000</option>
          <option value="100000">100,000</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Button -->
  <div class="btn-sec">
    <button class="btn" id="btnDec" disabled>
      <span class="bl">解密</span><span class="sp"></span>
    </button>
  </div>

  <!-- Log -->
  <div class="log" id="log"></div>

  <!-- Result -->
  <div class="res" id="res">
    <div class="rh">
      <span class="rl" id="rLbl">解密内容</span>
      <button class="cp" id="cpBtn">复制</button>
    </div>
    <div class="rb" id="rBox"><pre id="rTxt"></pre></div>
  </div>

  <div class="ft">
    <div>所有解密均在浏览器本地完成</div>
    <div class="sn">
      <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      数据不会上传至任何服务器
    </div>
  </div>
</div>

<script>
(function(){
  const $=id=>document.getElementById(id);
  const alert=$('alert');
  const dz=$('dz'),fIn=$('fIn'),fName=$('fName'),fSize=$('fSize'),fRem=$('fRem');
  const pa=$('pa'),paTxt=$('paTxt');
  const diag=$('diag'),hintBar=$('hintBar');
  const pw=$('pw'),pwTog=$('pwTog');
  const advTog=$('advTog'),advArr=$('advArr'),advBody=$('advBody');
  const optHash=$('optHash'),optIter=$('optIter');
  const btnDec=$('btnDec'),logDiv=$('log');
  const res=$('res'),rLbl=$('rLbl'),rBox=$('rBox'),rTxt=$('rTxt'),cpBtn=$('cpBtn');
  const tabs=document.querySelectorAll('.tab');

  let rawData=null,mode='file';

  // ============================
  // Startup: check crypto availability by actually testing it
  // ============================
  function showAlert(cls, msg){
    alert.className='alert '+cls+' show';
    alert.innerHTML=msg;
  }
  function hideAlert(){alert.classList.remove('show')}

  let cryptoAvailable=false;
  (async function checkCrypto(){
    // Step 1: does crypto.subtle even exist?
    if(!window.crypto||!window.crypto.subtle){
      showAlert('err',
        '<b>✕ Web Crypto API 不可用</b><br>'+
        '当前浏览器不支持 crypto.subtle，请换用 Chrome/Edge/Firefox 最新版。'
      );
      return;
    }

    // Step 2: actually try a trivial encrypt/decrypt to verify it works
    // Some browsers (Firefox on file://) have the API but block operations
    try{
      const testKey=await crypto.subtle.generateKey(
        {name:'AES-GCM',length:128},true,['encrypt','decrypt']
      );
      const iv=crypto.getRandomValues(new Uint8Array(12));
      const ct=await crypto.subtle.encrypt(
        {name:'AES-GCM',iv},testKey,new TextEncoder().encode('test')
      );
      await crypto.subtle.decrypt(
        {name:'AES-GCM',iv},testKey,ct
      );
      // Works fine — nothing to warn about
      cryptoAvailable=true;
    }catch(e){
      // Crypto API exists but is blocked (e.g. Firefox on file://)
      showAlert('warn',
        '<b>⚠ Crypto API 被浏览器阻止</b><br>'+
        '当前环境下 crypto.subtle 不可用（如 Firefox 在 file:// 协议下的安全限制）。<br><br>'+
        '解决方法：<br>'+
        '<b>1.</b> 换用 Chrome 或 Edge 浏览器直接打开<br>'+
        '<b>2.</b> 或在本文件所在目录运行 HTTP 服务：<br>'+
        '<span class="cmd" onclick="navigator.clipboard.writeText(this.textContent)">python -m http.server 8080</span>'+
        '<span style="font-size:.64rem;color:var(--text3)"> 然后访问 http://localhost:8080/meld_decrypt.html</span>'
      );
    }
  })();

  // ============================
  // Tabs
  // ============================
  tabs.forEach(t=>t.addEventListener('click',()=>{
    tabs.forEach(x=>x.classList.remove('act'));
    t.classList.add('act');
    mode=t.dataset.m;
    if(mode==='file'){pa.classList.remove('show');dz.style.display=''}
    else{pa.classList.add('show');dz.style.display='none';clearFile()}
    hideRes();updBtn();
  }));

  // ============================
  // File handling
  // ============================
  dz.addEventListener('click',()=>{if(!dz.classList.contains('loaded'))fIn.click()});
  fIn.addEventListener('change',()=>handleFile(fIn.files[0]));
  fRem.addEventListener('click',e=>{e.stopPropagation();clearFile()});
  dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('over')});
  dz.addEventListener('dragleave',()=>dz.classList.remove('over'));
  dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('over');if(e.dataTransfer.files[0])handleFile(e.dataTransfer.files[0])});

  function handleFile(f){
    if(!f)return;
    const r=new FileReader();
    r.onload=e=>{rawData=e.target.result;fName.textContent=f.name;fSize.textContent=fmtSize(f.size);dz.classList.add('loaded');hideRes();parseAndDiag();updBtn()};
    r.readAsText(f);
  }
  function clearFile(){
    rawData=null;fIn.value='';dz.classList.remove('loaded');
    diag.classList.remove('show');hintBar.classList.remove('show');hideRes();updBtn();
  }
  function fmtSize(b){return b<1024?b+' B':b<1048576?(b/1024).toFixed(1)+' KB':(b/1048576).toFixed(1)+' MB'}

  // ============================
  // Paste
  // ============================
  paTxt.addEventListener('input',()=>{
    rawData=paTxt.value.trim()||null;
    hideRes();parseAndDiag();updBtn();
  });

  // ============================
  // Parse & Diagnose
  // ============================
  let parsedData=null;
  function parseAndDiag(){
    diag.innerHTML='';parsedData=null;hintBar.classList.remove('show');
    if(!rawData){diag.classList.remove('show');return}
    try{
      const d=JSON.parse(rawData);
      parsedData=d;
      const enc=d.encodedData||'';
      const clean=enc.replace(/\s/g,'');
      const raw=b64decode(clean);
      const sz=raw.length;
      // Meld Encrypt v2.0 format: IV(16) + Salt(16) + Ciphertext + Tag(16)
      const iv=sz>=16?raw.slice(0,16):null;
      const salt=sz>=32?raw.slice(16,32):null;
      const ctLen=sz>=48?sz-48:0;  // minus IV(16) + Salt(16) + Tag(16)
      const tag=sz>=16?raw.slice(-16):null;
      const valid=sz>=48;

      let h=`<div class="dg-row"><span class="dg-k">版本</span><span class="dg-v">${esc(d.version||'未知')}</span></div>`;
      h+=`<div class="dg-row"><span class="dg-k">编码长度</span><span class="dg-v">${enc.length} 字符</span></div>`;
      h+=`<div class="dg-row"><span class="dg-k">解码字节</span><span class="dg-v">${sz} 字节</span></div>`;
      h+=`<div class="dg-sep"></div>`;
      h+=`<div class="dg-row"><span class="dg-k">IV (16B)</span><span class="dg-v ${iv?'ok':'err'}">${iv?'✓':'✗ 长度不足'}</span></div>`;
      if(iv)h+=`<div class="dg-hex">Hex: ${hex(iv)}</div>`;
      h+=`<div class="dg-row"><span class="dg-k">Salt (16B)</span><span class="dg-v ${salt?'ok':'err'}">${salt?'✓':'✗ 长度不足'}</span></div>`;
      if(salt)h+=`<div class="dg-hex">Hex: ${hex(salt)}</div>`;
      h+=`<div class="dg-row"><span class="dg-k">密文长度</span><span class="dg-v">${ctLen} 字节</span></div>`;
      h+=`<div class="dg-row"><span class="dg-k">预估明文</span><span class="dg-v">${ctLen>0?'~'+ctLen+' 字节':'—'}</span></div>`;
      if(tag)h+=`<div class="dg-hex">Tag (末16B): ${hex(tag)}</div>`;
      h+=`<div class="dg-sep"></div>`;
      h+=`<div class="dg-row"><span class="dg-k">结构完整</span><span class="dg-v ${valid?'ok':'err'}">${valid?'✓ 格式正确':'✗ 数据不完整'}</span></div>`;

      diag.innerHTML=h;diag.classList.add('show');

      if(d.hint&&d.hint.trim()){hintBar.textContent=d.hint;hintBar.classList.add('show')}
    }catch(e){
      diag.innerHTML=`<div class="dg-row"><span class="dg-k">解析</span><span class="dg-v err">✗ JSON 解析失败: ${esc(e.message)}</span></div>`;
      diag.classList.add('show');
    }
  }

  function b64decode(s){
    try{
      const pad=(4-s.length%4)%4;
      s+='='.repeat(pad);
      const bin=atob(s);
      const u=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
      return u;
    }catch(e){return new Uint8Array(0)}
  }
  function hex(u){return Array.from(u).map(b=>b.toString(16).padStart(2,'0')).join(' ').toUpperCase()}
  function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}

  // ============================
  // Password toggle
  // ============================
  pwTog.addEventListener('click',()=>{
    const isP=pw.type==='password';
    pw.type=isP?'text':'password';
    $('eye').innerHTML=isP
      ?'<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>'
      :'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  });

  // ============================
  // Advanced toggle
  // ============================
  advTog.addEventListener('click',()=>{
    advBody.classList.toggle('show');
    advArr.classList.toggle('open');
  });

  // ============================
  // Button state
  // ============================
  pw.addEventListener('input',updBtn);
  function updBtn(){
    btnDec.disabled=!(rawData&&pw.value.length>0);
  }

  // ============================
  // Decrypt
  // ============================
  btnDec.addEventListener('click',decrypt);
  pw.addEventListener('keydown',e=>{if(e.key==='Enter'&&!btnDec.disabled)decrypt()});

  async function decrypt(){
    if(!rawData||!pw.value)return;

    // Crypto check
    if(!cryptoAvailable){
      showRes('Web Crypto API 不可用，无法解密。\n请换用 Chrome/Edge 浏览器或通过 HTTP 服务打开此页面。',false);
      return;
    }

    const password=pw.value;

    btnDec.classList.add('ldg');btnDec.disabled=true;
    hideRes();logDiv.innerHTML='';logDiv.classList.add('show');

    const userHash=optHash.value;
    const userIter=parseInt(optIter.value);

    // Build param sets
    const allSets=[];
    // User choice first
    allSets.push({hash:userHash,iter:userIter,
      label:`${userHash} / ${userIter.toLocaleString()}`});
    // Fallbacks — Meld Encrypt v2.0 uses SHA-512 / 210,000
    const fallbacks=[
      {hash:'SHA-512',iter:210000,label:'SHA-512 / 210,000 (v2.0 默认)'},
      {hash:'SHA-512',iter:600000,label:'SHA-512 / 600,000'},
      {hash:'SHA-512',iter:100000,label:'SHA-512 / 100,000'},
      {hash:'SHA-256',iter:210000,label:'SHA-256 / 210,000'},
      {hash:'SHA-256',iter:600000,label:'SHA-256 / 600,000'},
      {hash:'SHA-256',iter:100000,label:'SHA-256 / 100,000'},
      {hash:'SHA-384',iter:210000,label:'SHA-384 / 210,000'},
      {hash:'SHA-1',iter:210000,label:'SHA-1 / 210,000'},
    ];
    fallbacks.forEach(f=>{
      if(!allSets.some(s=>s.hash===f.hash&&s.iter===f.iter))allSets.push(f);
    });

    let enc;
    try{
      const d=JSON.parse(rawData);
      enc=(d.encodedData||'').replace(/\s/g,'');
      if(!enc)throw new Error('JSON 中未找到 encodedData 字段');
    }catch(e){
      addLog('','fail','JSON 解析: '+e.message);
      showRes('JSON 解析失败: '+e.message,false);
      btnDec.classList.remove('ldg');btnDec.disabled=false;return;
    }

    const raw=b64decode(enc);
    // Meld Encrypt v2.0 format: IV(16) + Salt(16) + Ciphertext + Tag(16)
    // Minimum = 16+16+0+16 = 48 bytes
    if(raw.length<48){
      const msg=`数据长度不足 (${raw.length} 字节, 需要 ≥ 48 — IV+Salt+Tag 的最小结构)`;
      addLog('','fail',msg);
      showRes(msg,false);
      btnDec.classList.remove('ldg');btnDec.disabled=false;return;
    }

    const iv=raw.slice(0,16);         // Initialization Vector
    const salt=raw.slice(16,32);      // PBKDF2 Salt
    const ctOnly=raw.slice(32,-16);   // Ciphertext without Tag
    const tag=raw.slice(-16);         // GCM Tag
    // Web Crypto API expects ciphertext||tag appended
    const ciphertext=new Uint8Array(ctOnly.length+16);
    ciphertext.set(ctOnly);
    ciphertext.set(tag,ctOnly.length);

    let success=false;
    for(let i=0;i<allSets.length;i++){
      const s=allSets[i];
      addLog(`尝试 #${i+1}`,'try',s.label);
      try{
        const t0=performance.now();

        const result=await tryDecrypt(password,salt,iv,ciphertext,s.hash,s.iter);
        const ms=Math.round(performance.now()-t0);
        addLog(`成功`,'pass',`用时 ${ms}ms · ${s.label}`);
        showRes(result,true);
        success=true;break;
      }catch(e){
        const ms=e._ms?Math.round(e._ms):'?';
        const msg=e.message||String(e);
        // Check for common crypto errors
        if(msg.includes('insecure')||msg.includes('secure context')){
          addLog(`失败`,'fail',`${msg} — 请通过 HTTP 服务打开此页面`);
        }else{
          addLog(`失败`,'fail',`用时 ${ms}ms · ${msg}`);
        }
      }
    }

    if(!success){
      addLog('','fail','所有参数组合均失败');
      showRes(
        '解密失败 — 密码错误或数据格式不兼容\n\n'+
        '已尝试 '+allSets.length+' 种参数组合，全部认证失败。\n\n'+
        '可能原因:\n'+
        '  1. 密码错误（最常见）\n'+
        '  2. 当前页面运行在 file:// 协议下，部分浏览器禁止 Web Crypto（看上方提示）\n'+
        '  3. 加密文件的参数不在 fallback 列表中',
      false);
    }

    btnDec.classList.remove('ldg');btnDec.disabled=false;
  }

  async function tryDecrypt(password,salt,nonce,ciphertext,hash,iterations){
    const t0=performance.now();
    try{
      const km=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
      const key=await crypto.subtle.deriveKey(
        {name:'PBKDF2',salt,iterations,hash},km,
        {name:'AES-GCM',length:256},false,['decrypt']
      );
      const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:nonce},key,ciphertext);
      return new TextDecoder('utf-8').decode(pt);
    }catch(e){
      e._ms=performance.now()-t0;
      throw e;
    }
  }

  // ============================
  // Log
  // ============================
  function addLog(tag,cls,msg){
    const d=document.createElement('div');d.className='lg';
    d.innerHTML=(tag?`<span class="${cls}">[${tag}]</span> `:'')+esc(msg);
    logDiv.appendChild(d);
    logDiv.scrollTop=logDiv.scrollHeight;
  }

  // ============================
  // Result
  // ============================
  function showRes(text,ok){
    res.classList.add('show');
    rLbl.textContent=ok?'✓ 解密成功':'✕ 解密失败';
    rLbl.className='rl '+(ok?'ok':'err');
    rBox.className='rb '+(ok?'ok':'err');
    rTxt.textContent=text;
    cpBtn.style.display=ok?'inline-block':'none';
  }
  function hideRes(){res.classList.remove('show')}

  cpBtn.addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(rTxt.textContent)}catch(e){
      const ta=document.createElement('textarea');ta.value=rTxt.textContent;
      document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);
    }
    cpBtn.textContent='已复制 ✓';cpBtn.classList.add('done');
    setTimeout(()=>{cpBtn.textContent='复制';cpBtn.classList.remove('done')},2000);
  });

})();
</script>
</body>
</html>

```

### v3
```
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Meld Decrypt v3</title>
<style>
  *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
  :root{
    --bg:#0a0a0f;--surface:#12121a;--surface2:#1a1a24;--surface-hover:#1f1f2b;
    --border:#252530;--border-active:#c9a24d;
    --accent:#c9a24d;--accent-dim:#9a7b38;--accent-glow:rgba(201,162,77,0.10);
    --text:#e4e0d8;--text2:#a09b90;--text3:#5e5a50;
    --ok:#3cb371;--ok-bg:rgba(60,179,113,0.06);--err:#e05555;--err-bg:rgba(224,85,85,0.06);
    --warn:#e0b044;--warn-bg:rgba(224,176,68,0.07);
    --info:#5b9bd5;--info-bg:rgba(91,155,213,0.07);
    --r:8px;
  }
  html{font-size:16px}
  body{
    background:var(--bg);color:var(--text);
    font-family:'Cascadia Code','Fira Code','Consolas','Microsoft YaHei','等线',monospace;
    min-height:100vh;display:flex;flex-direction:column;align-items:center;
    justify-content:center;padding:2rem;
    background-image:
      radial-gradient(ellipse 600px 400px at 25% 20%,rgba(201,162,77,0.018),transparent),
      radial-gradient(ellipse 500px 500px at 75% 80%,rgba(80,50,20,0.018),transparent);
  }
  .wrap{width:100%;max-width:600px;position:relative;z-index:1}

  /* Alert */
  .alert{display:none;padding:.65rem .9rem;border-radius:var(--r);font-size:.68rem;line-height:1.55;margin-bottom:1rem;animation:fadeUp .4s ease both}
  .alert.show{display:block}
  .alert.err{background:var(--err-bg);border:1px solid rgba(224,85,85,.2);color:var(--err)}
  .alert.warn{background:var(--warn-bg);border:1px solid rgba(224,176,68,.2);color:var(--warn)}
  .alert code{background:rgba(255,255,255,.06);padding:.1rem .3rem;border-radius:3px;font-size:.66rem}

  /* Header */
  .hdr{text-align:center;margin-bottom:1.8rem;animation:fadeUp .5s ease both}
  .hdr .ic{width:40px;height:40px;margin:0 auto .8rem}
  .hdr .ic svg{width:100%;height:100%;stroke:var(--accent);stroke-width:1.4;fill:none;filter:drop-shadow(0 0 8px rgba(201,162,77,.2))}
  .hdr h1{font-family:Georgia,'Noto Serif CJK SC','宋体',serif;font-weight:300;font-size:1.7rem;letter-spacing:.03em;margin-bottom:.2rem}
  .hdr .ver{font-size:.62rem;color:var(--accent-dim);letter-spacing:.12em;margin-bottom:.3rem}
  .hdr p{font-size:.66rem;color:var(--text3);letter-spacing:.06em}

  /* Input area */
  .inp-sec{animation:fadeUp .5s ease .06s both}
  .inp-sec label{display:block;font-size:.64rem;color:var(--text3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:.4rem}
  .inp-w{position:relative}
  .inp-w textarea{
    width:100%;min-height:130px;max-height:300px;
    background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r);
    padding:.85rem;font-family:'Cascadia Code','Fira Code','Consolas','Microsoft YaHei','等线',monospace;
    font-size:.78rem;color:var(--text);resize:vertical;outline:none;
    transition:border-color .25s,box-shadow .25s;line-height:1.55;
  }
  .inp-w textarea::placeholder{color:var(--text3);font-size:.72rem}
  .inp-w textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-glow)}

  /* Format badge */
  .fmt-badge{
    position:absolute;top:.5rem;right:.5rem;padding:.2rem .5rem;
    border-radius:4px;font-size:.6rem;letter-spacing:.05em;display:none;animation:fadeIn .2s ease;
  }
  .fmt-badge.show{display:block}
  .fmt-badge.inline{background:var(--info-bg);color:var(--info);border:1px solid rgba(91,155,213,.2)}
  .fmt-badge.json{background:var(--ok-bg);color:var(--ok);border:1px solid rgba(60,179,113,.2)}
  .fmt-badge.err{background:var(--err-bg);color:var(--err);border:1px solid rgba(224,85,85,.2)}

  /* Detected info strip */
  .det-strip{
    display:none;margin-top:.4rem;padding:.35rem .55rem;
    background:var(--surface);border:1px solid var(--border);border-radius:5px;
    font-size:.62rem;color:var(--text3);animation:fadeUp .25s ease;
    letter-spacing:.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  }
  .det-strip.show{display:block}
  .det-strip .sep{color:var(--border);margin:0 .35rem}
  .det-strip em{color:var(--info);font-style:normal}
  .det-strip b{color:var(--accent);font-weight:500}
  .det-strip .hint-chip{color:var(--accent-dim);background:var(--accent-glow);padding:0 .25rem;border-radius:2px;margin-left:2px}

  /* Password */
  .pw-sec{margin-top:1rem;animation:fadeUp .5s ease .12s both}
  .pw-sec label{display:block;font-size:.64rem;color:var(--text3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:.4rem}
  .pw-w{position:relative;display:flex;align-items:center}
  .pw-w input{
    width:100%;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r);
    padding:.75rem 4.6rem .75rem .85rem;
    font-family:'Cascadia Code','Fira Code','Consolas','Microsoft YaHei','等线',monospace;
    font-size:.82rem;color:var(--text);outline:none;transition:border-color .25s,box-shadow .25s;
  }
  .pw-w input::placeholder{color:var(--text3);font-size:.72rem}
  .pw-w input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-glow)}
  .pw-actions{
    position:absolute;right:.3rem;display:flex;align-items:center;gap:2px;
  }
  .pw-act{
    width:28px;height:28px;background:0 0;border:none;
    cursor:pointer;border-radius:5px;display:flex;align-items:center;justify-content:center;
    transition:background .2s;padding:0;
  }
  .pw-act:hover{background:var(--accent-glow)}
  .pw-act svg{width:15px;height:15px;stroke:var(--text3);stroke-width:1.6;fill:none;transition:stroke .2s}
  .pw-act:hover svg{stroke:var(--accent)}
  .pw-act.pw-clr:hover{background:var(--err-bg)}
  .pw-act.pw-clr:hover svg{stroke:var(--err)}

  /* Advanced */
  .adv{margin-top:.6rem;animation:fadeUp .5s ease .16s both}
  .adv-toggle{
    font-size:.62rem;color:var(--text3);background:0 0;border:none;
    cursor:pointer;letter-spacing:.06em;display:flex;align-items:center;gap:.3rem;
    transition:color .2s;padding:.2rem 0;
  }
  .adv-toggle:hover{color:var(--accent)}
  .adv-toggle .arr{display:inline-block;transition:transform .2s;font-size:.55rem}
  .adv-toggle .arr.open{transform:rotate(90deg)}
  .adv-body{
    display:none;margin-top:.4rem;background:var(--surface);border:1px solid var(--border);
    border-radius:var(--r);padding:.7rem .85rem;font-size:.64rem;
  }
  .adv-body.show{display:block}
  .adv-body .opt-row{display:flex;align-items:center;gap:.5rem;margin-bottom:.4rem}
  .adv-body .opt-row:last-child{margin-bottom:0}
  .adv-body .opt-row label{color:var(--text3);min-width:65px;letter-spacing:.04em;font-size:.62rem}
  .adv-body .opt-row select{
    flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:4px;
    padding:.35rem .5rem;font-family:inherit;font-size:.64rem;color:var(--text);
    outline:none;cursor:pointer;
  }
  .adv-body .opt-row select:focus{border-color:var(--accent)}
  .adv-body .auto-note{font-size:.58rem;color:var(--text3);margin-top:.3rem;font-style:italic}

  /* Button row */
  .btn-row{margin-top:1.2rem;animation:fadeUp .5s ease .2s both;display:flex;gap:.5rem}
  .btn{
    flex:1;padding:.82rem .6rem;background:var(--accent);color:var(--bg);
    font-family:inherit;font-size:.78rem;font-weight:500;letter-spacing:.1em;
    text-transform:uppercase;border:none;border-radius:var(--r);
    cursor:pointer;transition:all .25s;position:relative;overflow:hidden;
  }
  .btn:hover:not(:disabled){background:#d4ad55;letter-spacing:.14em;box-shadow:0 4px 18px rgba(201,162,77,.2)}
  .btn:active:not(:disabled){transform:scale(.985)}
  .btn:disabled{opacity:.3;cursor:not-allowed}

  /* Working state — progress feedback */
  .btn.working{opacity:1 !important;cursor:wait}
  .btn.working .bl{display:none}
  .btn.working .wk{display:block}
  .btn .wk{display:none;font-size:.68rem;letter-spacing:.05em}
  .btn .wk .dot-pulse::after{
    content:'';animation:dots 1.2s steps(4,end) infinite;
  }
  @keyframes dots{
    0%{content:''}
    25%{content:'.'}
    50%{content:'..'}
    75%{content:'...'}
    100%{content:'...'}
  }
  .btn .wk .phase{opacity:.7;font-size:.58rem;display:block;margin-top:2px;letter-spacing:.03em;text-transform:none}

  /* Clear & Lock button */
  .btn-lock{
    flex:0 0 auto;width:44px;padding:0;background:var(--surface);border:1.5px solid var(--border);
    border-radius:var(--r);cursor:pointer;display:flex;align-items:center;justify-content:center;
    transition:all .25s;color:var(--text3);
  }
  .btn-lock:hover{border-color:var(--err);color:var(--err);background:var(--err-bg)}
  .btn-lock svg{width:18px;height:18px;stroke:currentColor;stroke-width:1.5;fill:none}

  /* Log */
  .log{
    margin-top:.8rem;display:none;animation:fadeUp .3s ease both;
    background:var(--surface);border:1px solid var(--border);border-radius:var(--r);
    padding:.6rem .8rem;max-height:160px;overflow-y:auto;
  }
  .log.show{display:block}
  .log .lg{font-size:.64rem;line-height:1.55;color:var(--text3)}
  .log .lg .try{color:var(--text2)}
  .log .lg .fail{color:var(--err)}
  .log .lg .pass{color:var(--ok)}
  .log .lg .phase{color:var(--accent-dim)}
  .log::-webkit-scrollbar{width:4px}
  .log::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}

  /* Result */
  .res{margin-top:1rem;display:none;animation:fadeUp .35s ease both}
  .res.show{display:block}
  .res .rh{display:flex;align-items:center;justify-content:space-between;margin-bottom:.45rem}
  .res .rh .rl{font-size:.64rem;text-transform:uppercase;letter-spacing:.08em}
  .res .rh .rl.ok{color:var(--ok)}.res .rh .rl.err{color:var(--err)}
  .cp{
    font-size:.6rem;color:var(--text3);background:var(--surface);border:1px solid var(--border);
    border-radius:4px;padding:.25rem .5rem;cursor:pointer;letter-spacing:.04em;transition:all .2s;
  }
  .cp:hover{border-color:var(--accent);color:var(--accent)}
  .cp.done{border-color:var(--ok);color:var(--ok)}
  .rb{
    background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r);
    padding:.85rem;max-height:350px;overflow-y:auto;
  }
  .rb.ok{border-color:rgba(60,179,113,.2)}.rb.err{border-color:rgba(224,85,85,.2);background:var(--err-bg)}
  .rb pre{font-family:inherit;font-size:.74rem;line-height:1.6;color:var(--text);white-space:pre-wrap;word-break:break-all}
  .rb.err pre{color:var(--err)}
  .rb::-webkit-scrollbar{width:4px}.rb::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}

  /* Vault status */
  .vault-status{
    display:none;font-size:.58rem;color:var(--ok);letter-spacing:.04em;
    padding:.15rem .4rem;background:var(--ok-bg);border-radius:3px;
  }
  .vault-status.show{display:inline-block}
  .vault-status.dead{color:var(--err);background:var(--err-bg)}

  /* Auto-destruct timer */
  .timer{
    display:none;font-size:.58rem;color:var(--warn);letter-spacing:.04em;
    padding:.15rem .4rem;background:var(--warn-bg);border-radius:3px;
    animation:fadeIn .3s ease;
  }
  .timer.show{display:inline-block}
  .timer.urgent{color:var(--err);background:var(--err-bg);animation:pulse .6s ease infinite}

  /* Clipboard warning toast */
  .cb-toast{
    display:none;margin-bottom:.6rem;padding:.45rem .65rem;
    background:var(--warn-bg);border:1px solid rgba(224,176,68,.2);
    border-radius:5px;font-size:.58rem;color:var(--warn);
    animation:fadeUp .3s ease both;line-height:1.5;
  }
  .cb-toast.show{display:block}

  /* Security footer note */
  .sec-note{
    margin-top:.8rem;padding:.4rem .5rem;font-size:.56rem;color:var(--text3);
    text-align:center;line-height:1.6;opacity:.6;
  }

  /* Shake animation for failed decrypt */
  .shake{animation:shake .4s ease}
  @keyframes shake{
    0%,100%{transform:translateX(0)}
    20%{transform:translateX(-6px)}
    40%{transform:translateX(6px)}
    60%{transform:translateX(-4px)}
    80%{transform:translateX(4px)}
  }

  /* Footer */
  .ft{
    margin-top:1.8rem;text-align:center;font-size:.6rem;color:var(--text3);
    letter-spacing:.04em;animation:fadeUp .5s ease .28s both;line-height:1.7;
  }
  .ft .sn{display:inline-flex;align-items:center;gap:.25rem;margin-top:.15rem;opacity:.5}
  .ft .sn svg{width:10px;height:10px;stroke:currentColor;stroke-width:1.8;fill:none}

  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @media(max-width:600px){body{padding:1rem}.hdr h1{font-size:1.4rem}.inp-w textarea{min-height:100px}}
</style>
</head>
<body>

<div class="wrap">
  <!-- Alert -->
  <div class="alert" id="alert"></div>

  <div class="hdr">
    <div class="ic">
      <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><circle cx="12" cy="16" r="1"/>
      </svg>
    </div>
    <h1>Meld Decrypt</h1>
    <div class="ver">v3 — 内存加密 · 💡提示 · 🔐内联</div>
    <p>🔐β 内联格式 · .mdenc 文件 · 纯本地解密</p>
  </div>

  <!-- Input -->
  <div class="inp-sec">
    <label for="inpTxt">粘贴加密内容</label>
    <div class="inp-w">
      <textarea id="inpTxt" placeholder="粘贴 &#x1F510;&#x3B2; ... &#x1F510; 内联加密文本&#10;或拖放 .mdenc / .json 文件&#10;或粘贴 JSON 内容" spellcheck="false"></textarea>
      <div class="fmt-badge" id="fmtBadge"></div>
    </div>
    <div class="det-strip" id="detStrip"></div>
  </div>

  <!-- Password -->
  <div class="pw-sec">
    <label for="pw">解密密码</label>
    <div class="pw-w">
      <input type="password" id="pw" placeholder="输入加密时设置的密码" autocomplete="off" spellcheck="false">
      <div class="pw-actions">
        <button class="pw-act pw-clr" id="pwClr" title="清除密码" type="button">
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <button class="pw-act" id="pwTog" title="显示/隐藏密码" type="button">
          <svg id="eye" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </div>
    </div>
  </div>

  <!-- Advanced -->
  <div class="adv">
    <button class="adv-toggle" id="advTog" type="button">
      <span class="arr" id="advArr">▶</span> 高级参数
    </button>
    <div class="adv-body" id="advBody">
      <div class="opt-row">
        <label>哈希算法</label>
        <select id="optHash">
          <option value="SHA-512">SHA-512</option>
          <option value="SHA-256">SHA-256</option>
          <option value="SHA-384">SHA-384</option>
          <option value="SHA-1">SHA-1</option>
        </select>
      </div>
      <div class="opt-row">
        <label>迭代次数</label>
        <select id="optIter">
          <option value="210000">210,000</option>
          <option value="600000">600,000</option>
          <option value="100000">100,000</option>
          <option value="50000">50,000</option>
        </select>
      </div>
      <div class="auto-note" id="autoNote"></div>
    </div>
  </div>

  <!-- Button row: Decrypt + Lock -->
  <div class="btn-row">
    <button class="btn" id="btnDec" disabled>
      <span class="bl">解密</span>
      <span class="wk">
        <span id="wkLabel">正在解密</span><span class="dot-pulse"></span>
        <span class="phase" id="wkPhase"></span>
      </span>
    </button>
    <button class="btn-lock" id="btnLock" title="清除并锁定" type="button">
      <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
      </svg>
    </button>
  </div>

  <!-- Log -->
  <div class="log" id="log"></div>

  <!-- Clipboard toast -->
  <div class="cb-toast" id="cbToast">📋 明文已复制到剪切板 · 建议清空剪切板历史 · 60秒后页面自动锁定</div>

  <!-- Result -->
  <div class="res" id="res">
    <div class="rh">
      <span class="rl" id="rLbl">解密结果</span>
      <span class="vault-status show" id="vaultStatus" title="数据在内存中加密存储">🔒 内存加密</span>
      <span class="timer" id="timer" title="自动清除倒计时"></span>
      <button class="cp" id="cpBtn">复制</button>
      <button class="cp" id="dlBtn">下载</button>
    </div>
    <div class="rb" id="rBox"><pre id="rTxt"></pre></div>
  </div>

  <div class="ft">
    <div>所有解密均在浏览器本地完成</div>
    <div class="sn">
      <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      数据不会上传至任何服务器
    </div>
  </div>
</div>

<script>
(function(){
  const $=id=>document.getElementById(id);
  const alert=$('alert'),inpTxt=$('inpTxt'),fmtBadge=$('fmtBadge'),detStrip=$('detStrip');
  const pw=$('pw'),pwTog=$('pwTog'),pwClr=$('pwClr'),eye=$('eye');
  const advTog=$('advTog'),advArr=$('advArr'),advBody=$('advBody');
  const optHash=$('optHash'),optIter=$('optIter'),autoNote=$('autoNote');
  const btnDec=$('btnDec'),btnLock=$('btnLock'),wkLabel=$('wkLabel'),wkPhase=$('wkPhase');
  const logDiv=$('log');
  const res=$('res'),rLbl=$('rLbl'),rBox=$('rBox'),rTxt=$('rTxt'),cpBtn=$('cpBtn'),dlBtn=$('dlBtn');
  const timer=$('timer'),cbToast=$('cbToast'),vaultStatus=$('vaultStatus');

  // ============================
  // Marker → default params lookup
  // ============================
  const MARKER_MAP={
    'β': {hash:'SHA-512', iter:210000, label:'SHA-512 / 210K'},
    'α': {hash:'SHA-256', iter:100000, label:'SHA-256 / 100K'},
    'γ': {hash:'SHA-256', iter:600000, label:'SHA-256 / 600K'},
    'δ': {hash:'SHA-384', iter:210000, label:'SHA-384 / 210K'},
    'ε': {hash:'SHA-1',   iter:210000, label:'SHA-1 / 210K'},
  };

  // Known marker characters (Greek & Coptic)
  const MARKER_CHARS = 'αβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ';

  // Parse state
  let parsedData=null;
  let detectedMarker=null;
  let cryptoAvailable=false;
  const DECRYPTING_PHASES = ['派生密钥', '解密数据'];
  let destructTimerId=null, hasSensitiveData=false;

  // ============================
  // Session Vault — all sensitive data encrypted at rest
  // ============================
  let sessionKey=null;        // CryptoKey (AES-GCM, non-extractable)
  let sealedPw=null;          // { ct: ArrayBuffer, iv: Uint8Array }
  let sealedResult=null;      // { ct: ArrayBuffer, iv: Uint8Array }

  async function initVault(){
    sessionKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false, // non-extractable
      ['encrypt', 'decrypt']
    );
  }

  async function seal(plaintext){
    if (!sessionKey) return null;
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, sessionKey, encoded);
    return { ct, iv };
  }

  async function sealBytes(bytes){
    if (!sessionKey) return null;
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, sessionKey, bytes);
    return { ct, iv };
  }

  async function unseal(sealed){
    if (!sessionKey || !sealed) return null;
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: sealed.iv }, sessionKey, sealed.ct);
    const text = new TextDecoder().decode(pt);
    // Zero the decrypted buffer
    crypto.getRandomValues(new Uint8Array(pt));
    return text;
  }

  async function unsealBytes(sealed){
    if (!sessionKey || !sealed) return null;
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: sealed.iv }, sessionKey, sealed.ct);
    return new Uint8Array(pt);
  }

  function destroySessionKey(){
    sessionKey = null;
    sealedPw = null;
    sealedResult = null;
    vaultStatus.textContent = '🔓 密钥已销毁';
    vaultStatus.className = 'vault-status show dead';
  }
  // ============================
  (async function checkCrypto(){
    if(!window.crypto||!window.crypto.subtle){
      showAlert('err','<b>✕</b> Web Crypto API 不可用 — 请换用 Chrome / Edge / Firefox 最新版');
      return;
    }
    try{
      const tk=await crypto.subtle.generateKey({name:'AES-GCM',length:128},true,['encrypt','decrypt']);
      const iv=crypto.getRandomValues(new Uint8Array(12));
      const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},tk,new TextEncoder().encode('test'));
      await crypto.subtle.decrypt({name:'AES-GCM',iv},tk,ct);
      cryptoAvailable=true;
      await initVault();
    }catch(e){
      showAlert('warn',
        '<b>⚠ Crypto API 被阻止</b><br>当前环境不支持 crypto.subtle（如 Firefox file:// 限制）。<br>'+
        '请换用 Chrome/Edge 直接打开，或启动本地 HTTP 服务。'
      );
    }
  })();

  // ============================
  // Alert helpers
  // ============================
  function showAlert(cls,msg){alert.className='alert '+cls+' show';alert.innerHTML=msg}
  function hideAlert(){alert.classList.remove('show')}

  // ============================
  // Password toggle + clear
  // ============================
  pwTog.addEventListener('click',()=>{
    const isP=pw.type==='password';pw.type=isP?'text':'password';
    eye.innerHTML=isP
      ?'<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>'
      :'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  });
  pwClr.addEventListener('click',()=>{pw.value='';updBtn();pw.focus()});

  // ============================
  // Advanced toggle
  // ============================
  advTog.addEventListener('click',()=>{
    advBody.classList.toggle('show');advArr.classList.toggle('open');
  });

  // ============================
  // Clear & Lock
  // ============================
  btnLock.addEventListener('click',lockAll);
  function lockAll(){
    stopDestructTimer();
    // Securely overwrite DOM before clearing
    scrubDOM();
    // Scrub parsed data
    scrubParsedData();
    // Destroy session key — all sealed data becomes unreadable
    destroySessionKey();
    // Clear inputs with random overwrite
    secureOverwriteInput(inpTxt);
    secureOverwriteInput(pw);
    // Null references
    parsedData=null;
    detectedMarker=null;
    hasSensitiveData=false;
    // Hide UI
    fmtBadge.classList.remove('show');
    detStrip.classList.remove('show');
    hideAlert();
    hideRes();
    logDiv.classList.remove('show');
    logDiv.innerHTML='';
    cbToast.classList.remove('show');
    resetDetected();
    updBtn();
    // Re-init vault for next use
    initVault();
    vaultStatus.textContent = '🔒 内存加密';
    vaultStatus.className = 'vault-status show';
  }

  // ============================
  // Input parsing — robust two-step 🔐 delimiter extraction
  // ============================
  inpTxt.addEventListener('input',onInput);
  inpTxt.addEventListener('paste',()=>setTimeout(onInput,10));

  // File drag & drop
  inpTxt.addEventListener('dragover',e=>{e.preventDefault()});
  inpTxt.addEventListener('drop',e=>{
    e.preventDefault();
    const f=e.dataTransfer.files[0];
    if(!f)return;
    const r=new FileReader();
    r.onload=ev=>{inpTxt.value=ev.target.result;onInput()};
    r.readAsText(f);
  });

  /**
   * Extract inline 🔐...🔐 content.
   * Handles: with/without marker, whitespace in base64, multiple blocks (takes first).
   * Returns {marker, base64} or null.
   */
  function extractInline(raw){
    // Step 1: find first 🔐 and last 🔐
    const first = raw.indexOf('🔐');
    if (first === -1) return null;
    const last = raw.lastIndexOf('🔐');
    if (last === first) return null; // only one lock emoji

    // Step 2: extract content between them
    const inner = raw.slice(first + 2, last).trim();
    if (!inner) return null;

    // Step 3: check for a marker character right after 🔐
    // Marker is a single Unicode char in the Greek/Coptic range
    let marker = '';
    let b64Part = inner;

    const ch0 = inner.codePointAt(0);
    if (ch0 !== undefined) {
      const firstChar = String.fromCodePoint(ch0);
      // Check if it's a known marker character (Greek/Coptic)
      if (MARKER_CHARS.includes(firstChar) || MARKER_MAP[firstChar]) {
        marker = firstChar;
        b64Part = inner.slice(firstChar.length).trim();
      } else if (/^[\u0370-\u03FF\u1F00-\u1FFF]$/u.test(firstChar)) {
        // Extended Greek range
        marker = firstChar;
        b64Part = inner.slice(firstChar.length).trim();
      }
    }

    // Step 4: strip optional 💡hint💡 block after marker
    // Format: 🔐β 💡一级密码💡 <base64> 🔐
    let hint = '';
    const HINT_DELIM = '💡';
    const hintStart = b64Part.indexOf(HINT_DELIM);
    if (hintStart === 0) {
      const hintEnd = b64Part.indexOf(HINT_DELIM, hintStart + 2);
      if (hintEnd > hintStart) {
        hint = b64Part.slice(hintStart + 2, hintEnd).trim();
        b64Part = b64Part.slice(hintEnd + 2).trim();
      }
    }

    // Step 5: clean base64 (strip all whitespace)
    const b64 = b64Part.replace(/\s/g, '');
    if (!b64 || b64.length < 40) return null; // too short for 48 raw bytes worth of base64

    return { marker, b64, hint };
  }

  function onInput(){
    hideAlert();hideRes();resetDetected();
    const raw = inpTxt.value || '';
    parsedData = null;

    if (!raw.trim()) {
      fmtBadge.classList.remove('show');
      detStrip.classList.remove('show');
      updBtn();
      return;
    }

    // ── Try inline 🔐...🔐 format ──
    const inlineResult = extractInline(raw);
    if (inlineResult) {
      const rawBytes = b64decode(inlineResult.b64);
      if (rawBytes.length >= 48) {
        parsedData = { mode: 'inline', marker: inlineResult.marker, rawBytes, hint: inlineResult.hint };
        detectedMarker = inlineResult.marker || 'β';
        showDetected('inline', detectedMarker, rawBytes);
        applyMarkerParams(detectedMarker);
        updBtn();
        return;
      } else if (rawBytes.length > 0) {
        // Decoded but too short
        fmtBadge.classList.add('show');
        fmtBadge.className = 'fmt-badge err show';
        fmtBadge.textContent = '⚠ 数据过短';
        detStrip.innerHTML = `⚠ 解码后仅 ${rawBytes.length}B（需 ≥ 48B）`;
        detStrip.classList.add('show');
        updBtn();
        return;
      }
    }

    // ── Try JSON format ──
    try {
      const d = JSON.parse(raw.trim());
      const enc = (d.encodedData || '').replace(/\s/g, '');
      if (enc) {
        const rawBytes = b64decode(enc);
        if (rawBytes.length >= 48) {
          parsedData = { mode: 'json', version: d.version, hint: d.hint, rawBytes };
          detectedMarker = null;
          showDetected('json', d.version || '?', rawBytes.length);
          autoNote.textContent = 'JSON 模式 — 使用下方选择的高级参数';
          updBtn();
          return;
        }
      }
    } catch (e) { /* not JSON */ }

    // ── Fallback: raw Base64 ──
    const clean = raw.replace(/\s/g, '');
    if (/^[A-Za-z0-9+/=]+$/.test(clean) && clean.length >= 40) {
      const rawBytes = b64decode(clean);
      if (rawBytes.length >= 48) {
        parsedData = { mode: 'inline', marker: '', rawBytes };
        detectedMarker = 'β';
        showDetected('inline', '?', rawBytes.length);
        applyMarkerParams('β');
        updBtn();
        return;
      }
    }

    // ── Nothing matched ──
    fmtBadge.classList.add('show');
    fmtBadge.className = 'fmt-badge err show';
    fmtBadge.textContent = '⚠ 未识别';
    detStrip.classList.remove('show');
    updBtn();
  }

  function resetDetected(){
    detectedMarker = null;
    optHash.value = 'SHA-512';
    optIter.value = '210000';
    autoNote.textContent = '';
  }

  function showDetected(mode, label, byteLen){
    fmtBadge.classList.add('show');
    if (mode === 'inline') {
      fmtBadge.className = 'fmt-badge inline show';
      fmtBadge.textContent = '🔐 内联';
      const mk = detectedMarker || '?';
      const mp = MARKER_MAP[mk];
      let html = `🔐<em>${escHtml(mk)}</em>`;
      if (mp) html += `<span class="sep">·</span> <b>${escHtml(mp.label)}</b>`;
      html += `<span class="sep">·</span> ${byteLen}B`;
      if (parsedData && parsedData.rawBytes) {
        const ctLen = parsedData.rawBytes.length - 48;
        html += ` <span class="sep">·</span> ~${ctLen}B 明文`;
      }
      // Hint
      if (parsedData && parsedData.hint) {
        html += ` &nbsp;<span class="hint-chip">💡 ${escHtml(parsedData.hint)}</span>`;
      }
      detStrip.innerHTML = html;
      detStrip.classList.add('show');
    } else {
      fmtBadge.className = 'fmt-badge json show';
      fmtBadge.textContent = '{ } JSON';
      let html = `<em>v${escHtml(label)}</em>`;
      html += `<span class="sep">·</span> ${byteLen}B`;
      if (parsedData && parsedData.rawBytes) {
        const ctLen = parsedData.rawBytes.length - 48;
        html += ` <span class="sep">·</span> ~${ctLen}B 明文`;
      }
      // Hint from JSON
      if (parsedData && parsedData.hint) {
        html += ` &nbsp;<span class="hint-chip">💡 ${escHtml(parsedData.hint)}</span>`;
      }
      detStrip.innerHTML = html;
      detStrip.classList.add('show');
    }
  }

  function applyMarkerParams(marker){
    const mp = MARKER_MAP[marker];
    if (mp) {
      optHash.value = mp.hash;
      optIter.value = String(mp.iter);
      autoNote.textContent = `已从标记 "${marker}" 自动选择: ${mp.label}`;
    } else {
      optHash.value = 'SHA-512';
      optIter.value = '210000';
      autoNote.textContent = `未知标记 "${marker}"，使用默认参数 SHA-512 / 210K`;
    }
  }

  // ============================
  // Button state
  // ============================
  pw.addEventListener('input', updBtn);
  function updBtn(){ btnDec.disabled = !(parsedData && pw.value.length > 0); }

  // ============================
  // Utility
  // ============================
  function b64decode(s){
    try{
      const pad = (4 - s.length % 4) % 4;
      s += '='.repeat(pad);
      const bin = atob(s);
      const u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      return u;
    } catch (e) { return new Uint8Array(0); }
  }
  function hex(u){
    return Array.from(u).map(b => b.toString(16).padStart(2, '0')).join(' ').toUpperCase();
  }
  function escHtml(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // ============================
  // Progress helpers
  // ============================
  function setWorking(phase){
    btnDec.classList.add('working');
    btnDec.disabled = true;
    wkLabel.textContent = '正在解密';
    wkPhase.textContent = phase;
  }
  function clearWorking(){
    btnDec.classList.remove('working');
    btnDec.disabled = false;
    wkLabel.textContent = '正在解密';
    wkPhase.textContent = '';
  }

  // ============================
  // Decrypt
  // ============================
  btnDec.addEventListener('click', decrypt);
  pw.addEventListener('keydown', e => { if (e.key === 'Enter' && !btnDec.disabled && !btnDec.classList.contains('working')) decrypt(); });

  // Scoped decryption: password only lives inside this function
  async function tryDecryptOne(sealedPw, salt, iv, ciphertext, hashAlgo, iterations){
    const password = await unseal(sealedPw);
    if (!password) throw new Error('unseal failed');
    const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations, hash: hashAlgo },
      km,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return new TextDecoder('utf-8').decode(pt);
  }

  async function decrypt(){
    if (!parsedData || !pw.value) return;
    if (!cryptoAvailable) {
      showRes('Web Crypto API 不可用。请换用 Chrome/Edge 或通过 HTTP 服务打开。', false);
      return;
    }

    // Seal password immediately, clear from DOM
    sealedPw = await seal(pw.value);
    secureOverwriteInput(pw);

    const rawBytes = parsedData.rawBytes;

    setWorking(DECRYPTING_PHASES[0]);
    hideRes();
    logDiv.innerHTML = '';
    logDiv.classList.add('show');

    // Meld Encrypt format: IV(16) + Salt(16) + Ciphertext + Tag(16)
    if (rawBytes.length < 48) {
      addLog('', 'fail', `数据长度不足 (${rawBytes.length} 字节, 需要 ≥ 48)`);
      showRes(`数据长度不足 — ${rawBytes.length} 字节（最小 48 字节: IV+Salt+Tag）`, false);
      clearWorking();
      updBtn();
      return;
    }

    const iv = rawBytes.slice(0, 16);
    const salt = rawBytes.slice(16, 32);
    const ctOnly = rawBytes.slice(32, -16);
    const tag = rawBytes.slice(-16);
    const ciphertext = new Uint8Array(ctOnly.length + 16);
    ciphertext.set(ctOnly);
    ciphertext.set(tag, ctOnly.length);

    // Build parameter sets
    const userHash = optHash.value;
    const userIter = parseInt(optIter.value);
    const allSets = [];
    allSets.push({ hash: userHash, iter: userIter, label: `${userHash} / ${userIter.toLocaleString()} (选择)` });

    const fallbacks = [
      { hash: 'SHA-512', iter: 210000, label: 'SHA-512 / 210,000' },
      { hash: 'SHA-512', iter: 600000, label: 'SHA-512 / 600,000' },
      { hash: 'SHA-512', iter: 100000, label: 'SHA-512 / 100,000' },
      { hash: 'SHA-256', iter: 210000, label: 'SHA-256 / 210,000' },
      { hash: 'SHA-256', iter: 600000, label: 'SHA-256 / 600,000' },
      { hash: 'SHA-256', iter: 100000, label: 'SHA-256 / 100,000' },
      { hash: 'SHA-384', iter: 210000, label: 'SHA-384 / 210,000' },
      { hash: 'SHA-1',   iter: 210000, label: 'SHA-1 / 210,000' },
    ];
    fallbacks.forEach(f => {
      if (!allSets.some(s => s.hash === f.hash && s.iter === f.iter)) allSets.push(f);
    });

    let success = false;
    for (let i = 0; i < allSets.length; i++) {
      const s = allSets[i];
      addLog(`尝试 #${i + 1}`, 'try', s.label);

      // ── Phase 1: Key derivation (PBKDF2) ──
      setWorking(DECRYPTING_PHASES[0]);
      addLogPhase(`  ↳ ${DECRYPTING_PHASES[0]}…`);
      // Force UI paint before blocking crypto call
      await sleep(30);

      try {
        const t0 = performance.now();
        const result = await tryDecryptOne(sealedPw, salt, iv, ciphertext, s.hash, s.iter);
        const totalMs = Math.round(performance.now() - t0);
                addLog(`成功`, 'pass', `${totalMs}ms · ${s.label}`);
        // Seal result immediately, show via unseal
        sealedResult = await seal(result);
        showRes(result, true);
        success = true;

        // Overwrite result plaintext immediately
        result = randomChars(result.length);

        // ── Scrub intermediates (password already cleared) ──
        scrubParsedData();
        // Zero intermediate arrays
        if (iv) crypto.getRandomValues(iv);
        if (salt) crypto.getRandomValues(salt);
        if (ctOnly) crypto.getRandomValues(ctOnly);
        if (tag) crypto.getRandomValues(tag);
        if (ciphertext) crypto.getRandomValues(ciphertext);
        // Key material is handled by GC — Web Crypto keys are opaque

        break;
      } catch (e) {
        const msg = e.message || String(e);
        if (msg.includes('insecure') || msg.includes('secure context')) {
          addLog(`失败`, 'fail', `${msg} — 请通过 HTTP 服务打开此页面`);
        } else {
          addLog(`失败`, 'fail', msg);
        }
      }
    }

    if (!success) {
      addLog('', 'fail', '所有参数组合均失败');
      showRes(
        '解密失败 — 密码错误或数据格式不兼容\n\n' +
        `已尝试 ${allSets.length} 种参数组合，全部认证失败。\n\n` +
        '可能原因:\n' +
        '  1. 密码错误（最常见）\n' +
        '  2. 浏览器阻止了 Web Crypto API\n' +
        '  3. 加密参数不在 fallback 列表中',
        false
      );
      // Shake animation on failure
      rBox.classList.add('shake');
      setTimeout(() => rBox.classList.remove('shake'), 450);
    }

    clearWorking();
    updBtn();
  }

  // ============================
  // tiny async delay to let browser paint
  // ============================
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ============================
  // Log
  // ============================
  function addLog(tag, cls, msg){
    const d = document.createElement('div');
    d.className = 'lg';
    d.innerHTML = (tag ? `<span class="${cls}">[${tag}]</span> ` : '') + escHtml(msg);
    logDiv.appendChild(d);
    logDiv.scrollTop = logDiv.scrollHeight;
  }
  function addLogPhase(msg){
    const d = document.createElement('div');
    d.className = 'lg';
    d.innerHTML = `<span class="phase">${escHtml(msg)}</span>`;
    logDiv.appendChild(d);
    logDiv.scrollTop = logDiv.scrollHeight;
  }

  // ============================
  // Result
  // ============================
  function showRes(text, ok){
    stopDestructTimer();
    res.classList.add('show');
    rLbl.textContent = ok ? '✓ 解密成功' : '✕ 解密失败';
    rLbl.className = 'rl ' + (ok ? 'ok' : 'err');
    rBox.className = 'rb ' + (ok ? 'ok' : 'err');
    rTxt.textContent = text;
    cpBtn.style.display = ok ? 'inline-block' : 'none';
    dlBtn.style.display = ok ? 'inline-block' : 'none';
    if (ok) {
      hasSensitiveData = true;
      startDestructTimer();
    }
  }
  function hideRes(){
    stopDestructTimer();
    scrubDOM();
    hasSensitiveData = false;
    res.classList.remove('show');
  }

  cpBtn.addEventListener('click', async () => {
    // Unseal from encrypted storage, never read from DOM
    const text = await unseal(sealedResult);
    if (!text) return;
    try { await navigator.clipboard.writeText(text); } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    // Zero the unsealed plaintext
    if (text) { const dummy = '0'.repeat(text.length); /* placeholder */ }
    cpBtn.textContent = '已复制 ✓';
    cpBtn.classList.add('done');
    setTimeout(() => { cpBtn.textContent = '复制'; cpBtn.classList.remove('done'); }, 2000);
    // Show clipboard warning
    cbToast.classList.add('show');
    setTimeout(() => cbToast.classList.remove('show'), 8000);
  });

  // Download .txt
  dlBtn.addEventListener('click', async () => {
    const text = await unseal(sealedResult);
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meld_decrypt_' + new Date().toISOString().slice(0,10) + '.txt';
    a.click();
    URL.revokeObjectURL(url);
    if (text) { const dummy = '0'.repeat(text.length); }
    dlBtn.textContent = '已下载 ✓';
    dlBtn.classList.add('done');
    setTimeout(() => { dlBtn.textContent = '下载'; dlBtn.classList.remove('done'); }, 2000);
  });

  // ============================
  // Security: memory scrubbing & auto-destruct
  // ============================
  function scrubDOM(){
    // Overwrite result text with random data before nulling
    if (rTxt.textContent) {
      const len = rTxt.textContent.length;
      rTxt.textContent = randomChars(len);
    }
    rTxt.textContent = '';
  }
  function scrubParsedData(){
    if (parsedData && parsedData.rawBytes) {
      crypto.getRandomValues(parsedData.rawBytes);
    }
  }
  function secureOverwriteInput(el){
    if (!el.value) { el.value = ''; return; }
    const len = el.value.length;
    el.value = randomChars(len);
    el.value = '';
  }
  function randomChars(len){
    const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let s = '';
    const rand = new Uint32Array(len);
    crypto.getRandomValues(rand);
    for (let i = 0; i < len; i++) s += pool[rand[i] % pool.length];
    return s;
  }
  function startDestructTimer(){
    stopDestructTimer();
    let remaining = 60;
    timer.textContent = `⏱ ${remaining}s`;
    timer.className = 'timer show';
    destructTimerId = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        lockAll();
        return;
      }
      timer.textContent = `⏱ ${remaining}s`;
      if (remaining <= 10) timer.classList.add('urgent');
    }, 1000);
  }
  function stopDestructTimer(){
    if (destructTimerId) { clearInterval(destructTimerId); destructTimerId = null; }
    timer.classList.remove('show', 'urgent');
    timer.textContent = '';
  }

  // Auto-scrub when page actually closes
  window.addEventListener('pagehide', () => {
    if (hasSensitiveData) { destroySessionKey(); scrubDOM(); }
  });
  window.addEventListener('beforeunload', e => {
    if (hasSensitiveData) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

})();
</script>
</body>
</html>

```

(() => {
  'use strict';

  if (window.__meldBlogUnlockLoaded) return;
  window.__meldBlogUnlockLoaded = true;

  const CONFIG = {
    // Prefer the article container. Falls back to <main>, then <body>.
    articleSelectors: [
      '.post-content',
      '.article-content',
      '.post-single .post-content',
      'article .content',
      'article',
      'main'
    ],
    unlockAllWithSamePassword: false, // 设置同密码自动解锁本页所有内容
    supportedMarkers: {
      'β': { hash: 'SHA-512', iterations: 210000, label: 'Meld β' },
      'α': { hash: 'SHA-256', iterations: 100000, label: 'Meld α' }
    },
    defaultMarker: 'β'
  };

  const encoder = new TextEncoder();
  const decoder = new TextDecoder('utf-8', { fatal: false });

  function getArticleRoot() {
    for (const selector of CONFIG.articleSelectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    return document.body;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isBase64Like(value) {
    const clean = value.replace(/\s/g, '');
    return clean.length >= 40 && /^[A-Za-z0-9+/=]+$/.test(clean);
  }

  // Matches both:
  //   %%🔐β <base64> 🔐%%
  //   %%🔐β 💡hint💡 <base64> 🔐%%
  //   🔐β <base64> 🔐
  // We intentionally only transform blocks that contain plausible Base64.
  const INLINE_RE = /(?:%%)?🔐\s*([αβ]?)\s*(?:💡([^💡]*)💡\s*)?([A-Za-z0-9+/=\s]+?)\s*🔐(?:%%)?/gu;

  function parseTextNode(text) {
    const matches = [];
    INLINE_RE.lastIndex = 0;
    let match;

    while ((match = INLINE_RE.exec(text)) !== null) {
      const marker = match[1] || CONFIG.defaultMarker;
      const hint = (match[2] || '').trim();
      const base64 = (match[3] || '').replace(/\s/g, '');

      if (!CONFIG.supportedMarkers[marker]) continue;
      if (!isBase64Like(base64)) continue;

      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        marker,
        hint,
        base64
      });
    }

    return matches;
  }

  function shouldSkipTextNode(node) {
    const p = node.parentElement;
    if (!p) return true;
    return Boolean(
      p.closest('script, style, noscript, textarea, input, pre, code, .meld-encrypted-card')
    );
  }

  function createCard({ marker, hint, base64 }) {
    const card = document.createElement('section');
    card.className = 'meld-encrypted-card';
    card.dataset.marker = marker;
    card.dataset.payload = base64;
    card.dataset.state = 'locked';

    const hintHtml = hint
      ? `<div class="meld-encrypted-hint"><span aria-hidden="true">💡</span><span>${escapeHtml(hint)}</span></div>`
      : '';

    card.innerHTML = `
      <div class="meld-encrypted-locked">
        <div class="meld-encrypted-heading">
          <span class="meld-encrypted-lock" aria-hidden="true">🔒</span>
          <div>
            <div class="meld-encrypted-title">此部分内容已加密</div>
            <div class="meld-encrypted-meta">${escapeHtml(CONFIG.supportedMarkers[marker].label)} · 浏览器本地解密</div>
          </div>
        </div>
        ${hintHtml}
        <div class="meld-encrypted-controls">
          <div class="meld-encrypted-password-wrap">
            <input
              class="meld-encrypted-password"
              type="password"
              placeholder="请输入密码"
              autocomplete="off"
              spellcheck="false"
              aria-label="加密内容密码"
            >
            <button class="meld-encrypted-eye" type="button" aria-label="显示密码" title="显示/隐藏密码">显示</button>
          </div>
          <button class="meld-encrypted-unlock" type="button">解锁内容</button>
        </div>
        <div class="meld-encrypted-status" role="status" aria-live="polite"></div>
      </div>
      <div class="meld-encrypted-open" hidden>
        <div class="meld-encrypted-openbar">
          <span>🔓 已解锁</span>
          <button class="meld-encrypted-relock" type="button">重新锁定</button>
        </div>
        <div class="meld-encrypted-content"></div>
      </div>
    `;

    bindCard(card);
    return card;
  }

  function replaceEncryptedTextNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;

    while ((node = walker.nextNode())) {
      if (!shouldSkipTextNode(node)) nodes.push(node);
    }

    let count = 0;

    for (const textNode of nodes) {
      const text = textNode.nodeValue || '';
      const matches = parseTextNode(text);
      if (!matches.length) continue;

      const fragment = document.createDocumentFragment();
      let cursor = 0;

      for (const match of matches) {
        if (match.start > cursor) {
          fragment.appendChild(document.createTextNode(text.slice(cursor, match.start)));
        }
        fragment.appendChild(createCard(match));
        cursor = match.end;
        count += 1;
      }

      if (cursor < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(cursor)));
      }

      textNode.replaceWith(fragment);
    }

    cleanupEmptyParagraphs(root);
    return count;
  }

  // If the Meld marker occupied its own Markdown paragraph, Hugo may leave a <p>
  // containing only our card. Unwrap it so the card is valid block-level markup.
  function cleanupEmptyParagraphs(root) {
    root.querySelectorAll('p').forEach((p) => {
      const cards = Array.from(p.children).filter((el) => el.classList.contains('meld-encrypted-card'));
      if (cards.length !== 1) return;

      const remaining = Array.from(p.childNodes).filter((n) => {
        if (n.nodeType === Node.ELEMENT_NODE && n.classList?.contains('meld-encrypted-card')) return false;
        return n.nodeType !== Node.TEXT_NODE || (n.nodeValue || '').trim() !== '';
      });

      if (remaining.length === 0) {
        p.replaceWith(cards[0]);
      }
    });
  }

  function b64decode(input) {
    const clean = input.replace(/\s/g, '');
    const padded = clean + '='.repeat((4 - (clean.length % 4)) % 4);
    const binary = atob(padded);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
    return out;
  }

  async function decryptMeld(base64, password, marker) {
    const params = CONFIG.supportedMarkers[marker];
    if (!params) throw new Error(`Unsupported Meld marker: ${marker}`);

    const raw = b64decode(base64);

    // Meld format used by the supplied decryptor:
    // IV(16) + Salt(16) + Ciphertext + GCM Tag(16)
    if (raw.length < 48) throw new Error('Encrypted payload is too short.');

    const iv = raw.slice(0, 16);
    const salt = raw.slice(16, 32);
    const ciphertextAndTag = raw.slice(32);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: params.iterations,
        hash: params.hash
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      key,
      ciphertextAndTag
    );

    return decoder.decode(plaintext);
  }

  function renderMarkdown(markdown) {
    if (window.markdownit) {
      const md = window.markdownit({
        html: false,
        linkify: true,
        typographer: true,
        breaks: false
      });
      return sanitizeRenderedHtml(md.render(markdown));
    }

    // Safe fallback: still reveals the plaintext, but does not interpret Markdown.
    return `<pre class="meld-encrypted-plaintext-fallback">${escapeHtml(markdown)}</pre>`;
  }

  function sanitizeRenderedHtml(html) {
    const template = document.createElement('template');
    template.innerHTML = html;

    const allowedTags = new Set([
      'P', 'BR', 'HR', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
      'UL', 'OL', 'LI', 'BLOCKQUOTE', 'PRE', 'CODE',
      'EM', 'STRONG', 'DEL', 'S', 'A', 'IMG',
      'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD'
    ]);

    const allowedAttrs = {
      A: new Set(['href', 'title']),
      IMG: new Set(['src', 'alt', 'title']),
      TH: new Set(['align']),
      TD: new Set(['align'])
    };

    const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT);
    const toRemove = [];
    let node;

    while ((node = walker.nextNode())) {
      if (!allowedTags.has(node.tagName)) {
        toRemove.push(node);
        continue;
      }

      for (const attr of Array.from(node.attributes)) {
        if (!allowedAttrs[node.tagName]?.has(attr.name)) node.removeAttribute(attr.name);
      }

      if (node.tagName === 'A') {
        const href = node.getAttribute('href') || '';
        if (!isSafeUrl(href, false)) node.removeAttribute('href');
        if (node.hasAttribute('href')) {
          node.setAttribute('rel', 'noopener noreferrer');
        }
      }

      if (node.tagName === 'IMG') {
        const src = node.getAttribute('src') || '';
        if (!isSafeUrl(src, true)) node.removeAttribute('src');
        node.setAttribute('loading', 'lazy');
      }
    }

    // Replace disallowed elements with their text, instead of keeping their markup.
    for (const el of toRemove.reverse()) {
      el.replaceWith(document.createTextNode(el.textContent || ''));
    }

    return template.innerHTML;
  }

  function isSafeUrl(value, allowDataImage) {
    const v = value.trim();
    if (!v) return false;
    if (v.startsWith('#') || v.startsWith('/') || v.startsWith('./') || v.startsWith('../')) return true;

    try {
      const u = new URL(v, window.location.href);
      if (['http:', 'https:', 'mailto:'].includes(u.protocol)) return true;
      if (allowDataImage && u.protocol === 'data:' && /^data:image\/(png|gif|jpe?g|webp);/i.test(v)) return true;
      return false;
    } catch {
      return false;
    }
  }

  function setCardBusy(card, busy, message = '') {
    const button = card.querySelector('.meld-encrypted-unlock');
    const input = card.querySelector('.meld-encrypted-password');
    const status = card.querySelector('.meld-encrypted-status');

    button.disabled = busy;
    input.disabled = busy;
    button.textContent = busy ? '正在解密…' : '解锁内容';
    if (message) status.textContent = message;
  }

  function showError(card, message) {
    const status = card.querySelector('.meld-encrypted-status');
    status.textContent = message;
    status.classList.add('is-error');
    card.classList.remove('is-unlocking');
    card.classList.add('is-error');
  }

  function clearError(card) {
    const status = card.querySelector('.meld-encrypted-status');
    status.textContent = '';
    status.classList.remove('is-error');
    card.classList.remove('is-error');
  }

  async function unlockCard(card, password, { quiet = false } = {}) {
    if (card.dataset.state === 'open') return true;

    const marker = card.dataset.marker || CONFIG.defaultMarker;
    const payload = card.dataset.payload || '';

    if (!payload) return false;

    clearError(card);
    card.classList.add('is-unlocking');
    if (!quiet) setCardBusy(card, true);

    try {
      const markdown = await decryptMeld(payload, password, marker);
      const content = card.querySelector('.meld-encrypted-content');
      content.innerHTML = renderMarkdown(markdown);

      card.querySelector('.meld-encrypted-locked').hidden = true;
      card.querySelector('.meld-encrypted-open').hidden = false;
      card.dataset.state = 'open';
      card.classList.remove('is-unlocking', 'is-error');
      return true;
    } catch (error) {
      if (!quiet) showError(card, '密码错误，或该密文与当前 Meld 格式不兼容。');
      return false;
    } finally {
      if (!quiet) setCardBusy(card, false);
    }
  }

  async function unlockFromCard(card) {
    const input = card.querySelector('.meld-encrypted-password');
    const password = input.value;

    if (!password) {
      showError(card, '请输入密码。');
      input.focus();
      return;
    }

    const ok = await unlockCard(card, password);
    input.value = '';

    if (!ok || !CONFIG.unlockAllWithSamePassword) return;

    // Use the same password only for this call. It is not stored in localStorage,
    // sessionStorage, cookies, or a global variable.
    const otherCards = Array.from(document.querySelectorAll('.meld-encrypted-card[data-state="locked"]'))
      .filter((other) => other !== card);

    for (const other of otherCards) {
      await unlockCard(other, password, { quiet: true });
    }
  }

  function relockCard(card) {
    const content = card.querySelector('.meld-encrypted-content');
    content.replaceChildren();
    card.querySelector('.meld-encrypted-open').hidden = true;
    card.querySelector('.meld-encrypted-locked').hidden = false;
    card.dataset.state = 'locked';
    clearError(card);

    const input = card.querySelector('.meld-encrypted-password');
    input.value = '';
    input.type = 'password';
    card.querySelector('.meld-encrypted-eye').textContent = '显示';
  }

  function bindCard(card) {
    const input = card.querySelector('.meld-encrypted-password');
    const unlock = card.querySelector('.meld-encrypted-unlock');
    const eye = card.querySelector('.meld-encrypted-eye');
    const relock = card.querySelector('.meld-encrypted-relock');

    unlock.addEventListener('click', () => unlockFromCard(card));
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        unlockFromCard(card);
      }
    });

    eye.addEventListener('click', () => {
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      eye.textContent = show ? '隐藏' : '显示';
      eye.setAttribute('aria-label', show ? '隐藏密码' : '显示密码');
    });

    relock.addEventListener('click', () => relockCard(card));
  }

  function checkEnvironment() {
    if (!window.crypto?.subtle) {
      document.querySelectorAll('.meld-encrypted-card').forEach((card) => {
        showError(card, '当前浏览器环境不支持 Web Crypto API，请使用 HTTPS 页面和现代浏览器。');
        card.querySelector('.meld-encrypted-unlock').disabled = true;
      });
      return false;
    }
    return true;
  }

  function init() {
    const root = getArticleRoot();
    replaceEncryptedTextNodes(root);
    checkEnvironment();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

/* Manga Tint landing page
   The gradient-map code below is ported from the extension's content.js
   so the demo produces exactly the same result as the extension. */
(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  /* ================= gradient map (ported from content.js) ================= */

  function hex2rgb(hex) {
    const h = hex.replace("#", "");
    const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    return [
      parseInt(v.slice(0, 2), 16),
      parseInt(v.slice(2, 4), 16),
      parseInt(v.slice(4, 6), 16)
    ];
  }

  function extractStopsString(bg) {
    const m = String(bg).match(/linear-gradient\s*\((.*)\)\s*$/i);
    let inside = m ? m[1] : String(bg);
    const firstComma = inside.indexOf(",");
    if (firstComma !== -1) {
      const head = inside.slice(0, firstComma).trim();
      if (/^(to\s+|[-\d.]+\s*(deg|grad|rad|turn)\b)/i.test(head)) {
        inside = inside.slice(firstComma + 1);
      }
    }
    return inside.trim();
  }

  function splitStopsSafe(s) {
    const out = [];
    let depth = 0, start = 0;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === "(") depth++;
      else if (ch === ")") depth = Math.max(0, depth - 1);
      else if (ch === "," && depth === 0) {
        out.push(s.slice(start, i).trim());
        start = i + 1;
      }
    }
    out.push(s.slice(start).trim());
    return out;
  }

  function parseColor(str) {
    str = str.trim();
    let m = str.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (m) return hex2rgb(str);
    m = str.match(/^rgba?\s*\(\s*([^)]+)\)$/i);
    if (m) {
      const nums = m[1].split(/\s*,\s*/).slice(0, 3).map((n) => {
        if (/%$/.test(n)) return Math.round(parseFloat(n) * 2.55);
        return Math.max(0, Math.min(255, parseInt(n, 10)));
      });
      if (nums.length === 3 && nums.every((n) => Number.isFinite(n))) return nums;
    }
    return null;
  }

  function parseStopToken(tok) {
    const m = tok.match(/\s(-?\d+(?:\.\d+)?)%\s*$/);
    let pos = null;
    let colorStr = tok;
    if (m) {
      pos = Math.max(0, Math.min(100, parseFloat(m[1])));
      colorStr = tok.slice(0, m.index).trim();
    }
    const rgb = parseColor(colorStr);
    if (!rgb) return null;
    return { rgb, pos };
  }

  function parseStops(raw) {
    const inside = extractStopsString(raw);
    const tokens = splitStopsSafe(inside);
    const parsed = tokens.map(parseStopToken).filter(Boolean);
    if (!parsed.length) return [];
    const haveAllPos = parsed.every((p) => p.pos !== null);
    if (!haveAllPos) {
      const n = parsed.length - 1;
      parsed.forEach((p, i) => { p.pos = (i / (n || 1)) * 100; });
    }
    return parsed
      .map((p) => ({ pos: p.pos / 100, r: p.rgb[0], g: p.rgb[1], b: p.rgb[2] }))
      .sort((a, b) => a.pos - b.pos);
  }

  function buildTables(stopsStr) {
    const stops = parseStops(stopsStr);
    if (!stops.length) return null;
    const size = 256;
    const tr = [], tg = [], tb = [];
    for (let i = 0; i < size; i++) {
      const t = i / (size - 1);
      let a = stops[0], b = stops[stops.length - 1];
      for (let s = 0; s < stops.length - 1; s++) {
        if (t >= stops[s].pos && t <= stops[s + 1].pos) { a = stops[s]; b = stops[s + 1]; break; }
      }
      const w = (b.pos - a.pos) || 1;
      const u = Math.min(1, Math.max(0, (t - a.pos) / w));
      const r = a.r + (b.r - a.r) * u;
      const g = a.g + (b.g - a.g) * u;
      const bl = a.b + (b.b - a.b) * u;
      tr.push((r / 255).toFixed(6));
      tg.push((g / 255).toFixed(6));
      tb.push((bl / 255).toFixed(6));
    }
    return { r: tr.join(" "), g: tg.join(" "), b: tb.join(" ") };
  }

  /* ================= demo: chips + filter ================= */

  const tintedImg = $("#tintedImg");
  const chips = $$(".chip");
  const chipOriginal = $("#chipOriginal");

  function applyGradient(gradient) {
    const t = buildTables(gradient);
    if (!t) return;
    const f = document.getElementById("mt-map");
    f.querySelector("feFuncR").setAttribute("tableValues", t.r);
    f.querySelector("feFuncG").setAttribute("tableValues", t.g);
    f.querySelector("feFuncB").setAttribute("tableValues", t.b);
    tintedImg.classList.add("is-tinted");
  }

  function removeGradient() {
    tintedImg.classList.remove("is-tinted");
  }

  function selectChip(chip) {
    chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
    if (chip === chipOriginal) {
      removeGradient();
    } else {
      applyGradient(chip.style.backgroundImage);
    }
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => selectChip(chip));
  });

  // default selection: the warm amber gradient (chip 08 in the panel)
  const defaultChip = chips[7] || chips[0];
  if (defaultChip) selectChip(defaultChip);

  /* ================= comparison slider ================= */

  const compare = $("#compare");
  const range = $("#compareRange");
  if (compare && range) {
    const update = () => {
      compare.style.setProperty("--pos", range.value + "%");
    };
    range.addEventListener("input", update);
    update();
  }

  /* ================= language switch ================= */

  const I18N = {
    en: {
      skip: "Skip to demo",
      navDemo: "Demo", navHow: "How it works", navAbout: "About", navFaq: "FAQ",
      ctaChrome: "Add to Chrome", ctaFirefox: "Add to Firefox", ctaEdge: "Add to Edge", ctaDemo: "Try the demo",
      heroTitle: "Make black-and-white manga feel softer.",
      heroLead: "Choose a soft gradient and apply it instantly in your browser. Manga Tint changes how grayscale pages are displayed without modifying the original artwork.",
      heroNote: "A tiny browser extension. Pick a tint. Read in a softer tone.",
      demoTitle: "Try the difference yourself.",
      demoHint: "Pick a tint and drag the slider to compare.",
      demoFootnote: "These are the actual gradients used in the extension.",
      tagOriginal: "Original", tagTinted: "Tinted",
      sliderLabel: "Comparison slider: left shows the original grayscale page, right shows the tinted page",
      chipsLabel: "Tint options",
      altComic: "A grayscale manga page: a woman visits a quiet café on a rainy evening",
      altCharacter: "A grayscale illustration of a smiling woman",
      chip00: "Gold tint", chip01: "Silver tint", chip02: "Copper tint", chip03: "Green tint",
      chip04: "Twilight purple tint", chip05: "Rose pink tint", chip06: "Violet pink tint",
      chip07: "Warm amber tint", chip08: "Blue gray to peach tint", chip09: "Coral pink tint",
      chip10: "Purple coral tint", chip11: "Mauve teal tint", chip12: "Forest green to peach tint",
      chip13: "Sky blue tint", chip14: "Rainbow tint",
      howTitle: "How it works",
      how1Title: "Pick a gradient", how1Body: "Choose a tint from the simple color panel.",
      how2Title: "Apply instantly", how2Body: "The filter changes the page as you view it in your browser.",
      how3Title: "Return anytime", how3Body: "Switch back to the original grayscale view with one click.",
      videoTitle: "See the change in motion.",
      videoLead: "A short before-and-after demonstration will be added here.",
      videoPlay: "Play demo video",
      aboutTitle: "A small tool, on purpose.",
      aboutBody: "Manga Tint is a tiny browser extension for applying soft gradient colors to grayscale manga and images. Choose a tint with one click and return to the original view anytime.",
      about1: "It never edits the original image — only how the page is displayed in your browser.",
      about2: "It is not full colorization, and it does not use AI. It applies a preset gradient filter.",
      about3: "Some websites or image viewers may prevent the filter from applying correctly.",
      privacyTitle: "Privacy",
      privacyBody: "The visual effect is applied locally in your browser. Manga Tint does not collect or transmit any data, and does not upload the images you are viewing.",
      privacyLinkLabel: "Read the full privacy policy",
      privacyHref: "https://tailpiece.github.io/colored-glasses/privacy-en.html",
      usageTitle: "Usage note",
      usageBody: "Only publish transformed screenshots or recordings when you own the content or have permission to use it.",
      usageLinkLabel: "More details on the 色めがね guide page (previous name)",
      guideHref: "https://tailpiece.github.io/colored-glasses/index-en.html",
      faq1Q: "Does Manga Tint permanently edit images?",
      faq1A: "No. It changes how the page is displayed in your browser. The original files are never modified.",
      faq2Q: "Is this an AI coloring tool?",
      faq2A: "No. It applies a preset gradient filter to the displayed page. It does not analyze or understand the content.",
      faq3Q: "Does it work on every website?",
      faq3A: "Not always. Some websites or image viewers may prevent the filter from working correctly.",
      faq4Q: "Can I create my own palette?",
      faq4A: "No. The current version provides a fixed set of tint options.",
      faq5Q: "Can I return to the original view?",
      faq5A: "Yes. Use the remove option in the extension to switch back to the original view at any time.",
      faqMore: "View the detailed guide (色めがね — previous name)",
      finalTitle: "Read grayscale manga in a softer tone.",
      finalBody: "Simple filters. No accounts. No complicated settings.",
      footGuide: "Guide (色めがね)",
      footPrivacy: "Privacy Policy",
      footContact: "Contact"
    },
    ja: {
      skip: "デモへスキップ",
      navDemo: "デモ", navHow: "使い方", navAbout: "このツールについて", navFaq: "FAQ",
      ctaChrome: "Chromeに追加", ctaFirefox: "Firefoxに追加", ctaEdge: "Edgeに追加", ctaDemo: "デモを試す",
      heroTitle: "白黒の漫画を、やわらかな色調で。",
      heroLead: "好きなグラデーションを選ぶだけで、ブラウザ上の表示にその場で適用されます。Manga Tint は元の画像を一切編集せず、グレースケールのページの見え方だけを変えます。",
      heroNote: "小さなブラウザ拡張です。色を選んで、やわらかな色調で読めます。",
      demoTitle: "違いをその場で試せます。",
      demoHint: "色を選んで、スライダーを動かして比較してください。",
      demoFootnote: "拡張機能で実際に使われているグラデーションです。",
      tagOriginal: "Original", tagTinted: "Tinted",
      sliderLabel: "比較スライダー：左が元のグレースケール、右が色を適用した表示",
      chipsLabel: "色の選択肢",
      altComic: "グレースケールの漫画ページ：雨の夜、静かなカフェを訪れる女性",
      altCharacter: "微笑む女性のグレースケールイラスト",
      chip00: "ゴールド", chip01: "シルバー", chip02: "カッパー", chip03: "グリーン",
      chip04: "トワイライトパープル", chip05: "ローズピンク", chip06: "バイオレットピンク",
      chip07: "ウォームアンバー", chip08: "ブルーグレーからピーチ", chip09: "コーラルピンク",
      chip10: "パープルコーラル", chip11: "モーブティール", chip12: "フォレストグリーンからピーチ",
      chip13: "スカイブルー", chip14: "レインボー",
      howTitle: "使い方",
      how1Title: "グラデーションを選ぶ", how1Body: "シンプルなカラーパネルから色を選びます。",
      how2Title: "その場で適用", how2Body: "見ているページの表示にフィルターがかかります。",
      how3Title: "いつでも元に戻せる", how3Body: "ワンクリックで元のグレースケール表示に戻ります。",
      videoTitle: "変化を動画で。",
      videoLead: "短い Before / After のデモ動画をここに掲載予定です。",
      videoPlay: "デモ動画を再生",
      aboutTitle: "小さな道具であること。",
      aboutBody: "Manga Tint は、グレースケールの漫画や画像にやわらかなグラデーションの色を重ねる小さなブラウザ拡張です。ワンクリックで色を選び、いつでも元の表示に戻せます。",
      about1: "元の画像は編集しません。ブラウザ上の表示だけを変えます。",
      about2: "本格的なカラー化ではなく、AI による着色でもありません。プリセットのグラデーションフィルターを適用します。",
      about3: "サイトや画像ビューアーによっては、正しく適用できない場合があります。",
      privacyTitle: "プライバシー",
      privacyBody: "視覚効果はブラウザ内でローカルに適用されます。Manga Tint はデータを収集・送信せず、閲覧中の画像をアップロードすることもありません。",
      privacyLinkLabel: "プライバシーポリシー全文を読む",
      privacyHref: "https://tailpiece.github.io/colored-glasses/privacy.html",
      usageTitle: "ご利用上の注意",
      usageBody: "変換後のスクリーンショットや動画を公開する場合は、ご自身が権利を持つ作品、または加工・公開の許可を得た作品を使用してください。",
      usageLinkLabel: "詳しくは「色めがね」のガイドページ（旧名称）へ",
      guideHref: "https://tailpiece.github.io/colored-glasses/",
      faq1Q: "画像そのものが編集されますか？",
      faq1A: "いいえ。ブラウザ上の表示だけが変わります。元のファイルは一切変更されません。",
      faq2Q: "AI による着色ツールですか？",
      faq2A: "いいえ。表示中のページにプリセットのグラデーションフィルターを適用するだけで、内容の解析は行いません。",
      faq3Q: "すべてのサイトで使えますか？",
      faq3A: "常にではありません。サイトや画像ビューアーによっては、正しく動作しない場合があります。",
      faq4Q: "自分でパレットを作れますか？",
      faq4A: "いいえ。現在のバージョンでは、あらかじめ用意された色のセットのみを提供しています。",
      faq5Q: "元の表示に戻せますか？",
      faq5A: "はい。拡張機能の remove ボタンで、いつでも元の表示に戻せます。",
      faqMore: "詳しいガイドを見る（旧名称「色めがね」）",
      finalTitle: "グレースケールの漫画を、やわらかな色調で。",
      finalBody: "シンプルなフィルター。アカウント不要。複雑な設定なし。",
      footGuide: "ガイド（色めがね）",
      footPrivacy: "プライバシーポリシー",
      footContact: "お問い合わせ"
    }
  };

  function setLang(lang) {
    const dict = I18N[lang] || I18N.en;
    document.documentElement.lang = lang;
    $$("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key] !== undefined) el.textContent = dict[key];
    });
    $$("[data-i18n-attr]").forEach((el) => {
      el.getAttribute("data-i18n-attr").split(";").forEach((pair) => {
        const [attr, key] = pair.split(":");
        if (attr && key && dict[key] !== undefined) el.setAttribute(attr, dict[key]);
      });
    });
    const btnEn = $("#langEn"), btnJa = $("#langJa");
    if (btnEn && btnJa) {
      btnEn.setAttribute("aria-pressed", String(lang === "en"));
      btnJa.setAttribute("aria-pressed", String(lang === "ja"));
    }
    try { localStorage.setItem("mt-lang", lang); } catch (_) { /* private mode */ }
  }

  const btnEn = $("#langEn"), btnJa = $("#langJa");
  if (btnEn) btnEn.addEventListener("click", () => setLang("en"));
  if (btnJa) btnJa.addEventListener("click", () => setLang("ja"));

  let initialLang = "en";
  try {
    const params = new URLSearchParams(location.search);
    initialLang = params.get("lang") || localStorage.getItem("mt-lang") || "en";
  } catch (_) { /* ignore */ }
  if (initialLang !== "en") setLang(initialLang === "ja" ? "ja" : "en");

  /* ================= video: reduced motion aware ================= */

  const video = $("#demoVideo");
  const playBtn = $("#videoPlayBtn");
  if (video && playBtn) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    video.removeAttribute("controls");
    if (reduced) {
      playBtn.hidden = false;
    } else {
      const p = video.play();
      if (p && p.catch) p.catch(() => { playBtn.hidden = false; });
    }
    playBtn.addEventListener("click", () => {
      if (video.paused) { video.play(); } else { video.pause(); }
    });
    video.addEventListener("play", () => { if (!reduced) playBtn.hidden = true; else playBtn.textContent = "⏸"; });
    video.addEventListener("pause", () => { playBtn.hidden = false; playBtn.textContent = "▶"; });
  }
})();

(() => {
  if (window.__cgListenerInstalled) return;
  window.__cgListenerInstalled = true;

  const SVG_ID = 'cg-defs';
  const FILTER_ID = 'colored-glasses-map';

  // --- util ---
  function elNS(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
  }

  // 優先順でターゲット要素を取得
  function pickTargetContainer() {
    const viewer = document.getElementById('viewer');
    if (viewer) return viewer;

    const mainid = document.getElementById('main');
    if (mainid) return mainid;

    const main = document.getElementsByTagName('main');
    if (main.length > 0) return main[0];

    const body = document.getElementsByTagName('body');
    if (body.length > 0) return body[0];

    return null;
  }

  function hex2rgb(hex) {
    const h = hex.replace('#', '');
    const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    return [
      parseInt(v.slice(0, 2), 16),
      parseInt(v.slice(2, 4), 16),
      parseInt(v.slice(4, 6), 16)
    ];
  }

  // linear-gradient(...) の中身だけを取り出す（角度/方向トークンを除去）
  function extractStopsString(bg) {
    const m = String(bg).match(/linear-gradient\s*\((.*)\)\s*$/i);
    let inside = m ? m[1] : String(bg);

    // 先頭トークンが方向/角度なら捨てる（to ... / 45deg / 0.25turn 等）
    // 括弧は使わないので単純 split でOK
    const firstComma = inside.indexOf(',');
    if (firstComma !== -1) {
      const head = inside.slice(0, firstComma).trim();
      if (/^(to\s+|[-\d.]+\s*(deg|grad|rad|turn)\b)/i.test(head)) {
        inside = inside.slice(firstComma + 1);
      }
    }

    return inside.trim();
  }

  // 括弧内のカンマを無視して分割
  function splitStopsSafe(s) {
    const out = [];
    let depth = 0, start = 0;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === '(') depth++;
      else if (ch === ')') depth = Math.max(0, depth - 1);
      else if (ch === ',' && depth === 0) {
        out.push(s.slice(start, i).trim());
        start = i + 1;
      }
    }
    out.push(s.slice(start).trim());
    return out;
  }

  // rgb()/rgba()/#hex に対応
  function parseColor(str) {
    str = str.trim();
    // #rgb / #rrggbb
    let m = str.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (m) {
      return hex2rgb(str);
    }
    // rgb( ... ) / rgba( ... )
    m = str.match(/^rgba?\s*\(\s*([^)]+)\)$/i);
    if (m) {
      const nums = m[1].split(/\s*,\s*/).slice(0, 3).map(n => {
        if (/%$/.test(n)) return Math.round(parseFloat(n) * 2.55);
        return Math.max(0, Math.min(255, parseInt(n, 10)));
      });
      if (nums.length === 3 && nums.every(n => Number.isFinite(n))) return nums;
    }
    return null; // 未対応
  }

  // 1ストップ文字列 "rgb(51,51,51) 0%" → {color,pos}
  function parseStopToken(tok) {
    // 最後に位置（%）が付く想定（無ければ null）
    const m = tok.match(/\s(-?\d+(?:\.\d+)?)%\s*$/);
    let pos = null;
    let colorStr = tok;
    if (m) {
      pos = Math.max(0, Math.min(100, parseFloat(m[1])));
      colorStr = tok.slice(0, m.index).trim();
    }
    const rgb = parseColor(colorStr);
    if (!rgb) return null;
    return { rgb, pos }; // pos は %、後で 0..1 に正規化
  }

  function parseStops(raw) {
    const inside = extractStopsString(raw);
    const tokens = splitStopsSafe(inside);
    const parsed = tokens.map(parseStopToken).filter(Boolean);
    if (!parsed.length) return [];

    // 位置が欠けている場合は均等割り当て
    const haveAllPos = parsed.every(p => p.pos !== null);
    if (!haveAllPos) {
      const n = parsed.length - 1;
      parsed.forEach((p, i) => { p.pos = (i / (n || 1)) * 100; });
    }

    // 0..1 に正規化、RGB は 0..255 のまま
    return parsed
      .map(p => ({ pos: p.pos / 100, r: p.rgb[0], g: p.rgb[1], b: p.rgb[2] }))
      .sort((a, b) => a.pos - b.pos);
  }

  function buildTables(stopsStr) {
    const stops = parseStops(stopsStr);
    if (!stops.length) return null;

    const size = 256;
    const tr = [], tg = [], tb = [];
    for (let i = 0; i < size; i++) {
      const t = i / (size - 1);
      // 区間探索
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
    return { r: tr.join(' '), g: tg.join(' '), b: tb.join(' ') };
  }

  // SVGフィルタを構築/確保
  function ensureFilter() {
    // <svg id="cg-defs" style="position:absolute;width:0;height:0;overflow:hidden">
    let svg = document.getElementById(SVG_ID);
    if (!svg) {
      svg = elNS('svg');
      svg.setAttribute('id', SVG_ID);
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); // 追加
      svg.setAttribute('aria-hidden', 'true');                  // 任意: アクセシビリティ配慮
      const st = svg.style;
      st.position = 'absolute';
      st.width = '0';
      st.height = '0';
      st.overflow = 'hidden';
      // <body> でも <html> でも OK。より互換を取るなら <body> 直下にしてもよい
      (document.body || document.documentElement).appendChild(svg);
    }

    // <defs>
    let defs = svg.querySelector('defs');
    if (!defs) {
      defs = elNS('defs');
      svg.appendChild(defs);
    }

    // <filter id="colored-glasses-map" color-interpolation-filters="sRGB">
    let filter = defs.querySelector(`#${FILTER_ID}`);
    if (!filter) {
      filter = elNS('filter');
      filter.setAttribute('id', FILTER_ID);
      filter.setAttribute('color-interpolation-filters', 'sRGB');
      defs.appendChild(filter);

      // <feColorMatrix type="matrix" ... result="lum" />
      const feColorMatrix = elNS('feColorMatrix');
      feColorMatrix.setAttribute('type', 'matrix');
      feColorMatrix.setAttribute(
        'values',
        [
          '0.2126 0.7152 0.0722 0 0',
          '0.2126 0.7152 0.0722 0 0',
          '0.2126 0.7152 0.0722 0 0',
          '0       0      0      1 0'
        ].join(' ')
      );
      feColorMatrix.setAttribute('result', 'lum');
      filter.appendChild(feColorMatrix);

      // <feComponentTransfer in="lum" result="mapped">
      const feComp = elNS('feComponentTransfer');
      feComp.setAttribute('in', 'lum');
      feComp.setAttribute('result', 'mapped');

      const feR = elNS('feFuncR');
      feR.setAttribute('type', 'table');
      feR.setAttribute('tableValues', '0 1');

      const feG = elNS('feFuncG');
      feG.setAttribute('type', 'table');
      feG.setAttribute('tableValues', '0 1');

      const feB = elNS('feFuncB');
      feB.setAttribute('type', 'table');
      feB.setAttribute('tableValues', '0 1');

      feComp.appendChild(feR);
      feComp.appendChild(feG);
      feComp.appendChild(feB);
      filter.appendChild(feComp);

      // <feComposite in="mapped" in2="SourceAlpha" operator="in" result="final"/>
      const feCompst = elNS('feComposite');
      feCompst.setAttribute('in', 'mapped');
      feCompst.setAttribute('in2', 'SourceAlpha');
      feCompst.setAttribute('operator', 'in');
      feCompst.setAttribute('result', 'final');
      filter.appendChild(feCompst);

      // <feMerge><feMergeNode in="final"/></feMerge>
      const feMerge = elNS('feMerge');
      const feMergeNode = elNS('feMergeNode');
      feMergeNode.setAttribute('in', 'final');
      feMerge.appendChild(feMergeNode);
      filter.appendChild(feMerge);
    }

    return filter;
  }

  function updateFilter(gradient) {
    const f = ensureFilter();         // 先にSVGとfilterを必ず作る
    const t = buildTables(gradient);  // その後テーブル生成
    if (!t) return;                   // 失敗したら何もしない（だがSVGはいる）
    const feR = f.querySelector('feFuncR');
    const feG = f.querySelector('feFuncG');
    const feB = f.querySelector('feFuncB');
    if (feR) feR.setAttribute('tableValues', t.r);
    if (feG) feG.setAttribute('tableValues', t.g);
    if (feB) feB.setAttribute('tableValues', t.b);

    const target = pickTargetContainer();
    if (target) {
      // 念のため既存 filter を上書き（複合指定したいなら追記ロジックに）
      target.style.filter = `url(#${FILTER_ID})`;
    }
  }

  function removeFilter() {
    const svg = document.getElementById(SVG_ID);
    if (svg && svg.parentNode) svg.parentNode.removeChild(svg);
    const target = pickTargetContainer();
    if (target) target.style.filter = 'none';
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg || typeof msg.gradient === 'undefined') return;
    if (msg.gradient === 'remove' || msg.gradient === '') {
      removeFilter();
      sendResponse && sendResponse({ ok: true, removed: true });
    } else {
      updateFilter(msg.gradient);
      sendResponse && sendResponse({ ok: true, filterId: `#${FILTER_ID}` });
    }
  });
})();

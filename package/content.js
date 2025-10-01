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
    const h = hex.replace('#','');
    const v = h.length === 3 ? h.split('').map(c=>c+c).join('') : h;
    return [
      parseInt(v.slice(0,2),16),
      parseInt(v.slice(2,4),16),
      parseInt(v.slice(4,6),16)
    ];
  }

  function parseStops(str) {
    return str.split(/\s*,\s*/).map(tok => {
      const m = tok.match(/(#[0-9a-fA-F]{3,6})\s+(\d+)%/);
      if (!m) return null;
      const rgb = hex2rgb(m[1]);
      return { pos: +m[2]/100, r: rgb[0], g: rgb[1], b: rgb[2] };
    }).filter(Boolean).sort((a,b)=>a.pos-b.pos);
  }

  function buildTables(stopsStr) {
    const stops = parseStops(stopsStr);
    if (!stops.length) return null;
    const size = 256;
    const tr = [], tg = [], tb = [];
    for (let i=0;i<size;i++) {
      const t = i/(size-1);
      let a=stops[0], b=stops[stops.length-1];
      for (let s=0;s<stops.length-1;s++) {
        if (t>=stops[s].pos && t<=stops[s+1].pos) {
          a=stops[s]; b=stops[s+1]; break;
        }
      }
      const u = (t-a.pos)/(b.pos-a.pos||1);
      const r = a.r+(b.r-a.r)*u;
      const g = a.g+(b.g-a.g)*u;
      const bl= a.b+(b.b-a.b)*u;
      tr.push((r/255).toFixed(6));
      tg.push((g/255).toFixed(6));
      tb.push((bl/255).toFixed(6));
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
      const st = svg.style;
      st.position = 'absolute';
      st.width = '0';
      st.height = '0';
      st.overflow = 'hidden';
      document.documentElement.appendChild(svg);
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
    const t = buildTables(gradient);
    if (!t) return;
    const f = ensureFilter();

    const feR = f.querySelector('feFuncR');
    const feG = f.querySelector('feFuncG');
    const feB = f.querySelector('feFuncB');

    if (feR) feR.setAttribute('tableValues', t.r);
    if (feG) feG.setAttribute('tableValues', t.g);
    if (feB) feB.setAttribute('tableValues', t.b);

    const target = pickTargetContainer();
    if (target) {
      target.style.filter = `url(#${FILTER_ID})`;
    }
  }

  function removeFilter() {
    const svg = document.getElementById(SVG_ID);
    if (svg && svg.parentNode) svg.parentNode.removeChild(svg);
    const target = pickTargetContainer();
    if (target) target.style.filter = 'none';
  }

  chrome.runtime.onMessage.addListener((msg,_sender,sendResponse)=>{
    if (!msg || typeof msg.gradient==='undefined') return;
    if (msg.gradient==='remove' || msg.gradient==='') {
      removeFilter();
      sendResponse && sendResponse({ok:true,removed:true});
    } else {
      updateFilter(msg.gradient);
      sendResponse && sendResponse({ok:true,filterId:`#${FILTER_ID}`});
    }
  });
})();

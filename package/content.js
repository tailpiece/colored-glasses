(() => {
  if (window.__cgListenerInstalled) return;
  window.__cgListenerInstalled = true;

  const SVG_ID = 'cg-defs';
  const FILTER_ID = 'colored-glasses-map';

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

  function ensureFilter() {
    let svg = document.getElementById(SVG_ID);
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.id = SVG_ID;
      Object.assign(svg.style,{position:'absolute',width:'0',height:'0',overflow:'hidden'});
      document.documentElement.appendChild(svg);
      svg.innerHTML = `<defs>
        <filter id="${FILTER_ID}" color-interpolation-filters="sRGB">
          <feColorMatrix type="matrix"
            values="0.2126 0.7152 0.0722 0 0
                    0.2126 0.7152 0.0722 0 0
                    0.2126 0.7152 0.0722 0 0
                    0       0      0      1 0" result="lum"/>
          <feComponentTransfer in="lum" result="mapped">
            <feFuncR type="table" tableValues="0 1"/>
            <feFuncG type="table" tableValues="0 1"/>
            <feFuncB type="table" tableValues="0 1"/>
          </feComponentTransfer>
          <feComposite in="mapped" in2="SourceAlpha" operator="in" result="final"/>
          <feMerge><feMergeNode in="final"/></feMerge>
        </filter>
      </defs>`;
    }
    return svg.querySelector(`#${FILTER_ID}`);
  }

  function updateFilter(gradient) {
    const t = buildTables(gradient);
    if (!t) return;
    const f = ensureFilter();
    f.querySelector('feFuncR').setAttribute('tableValues', t.r);
    f.querySelector('feFuncG').setAttribute('tableValues', t.g);
    f.querySelector('feFuncB').setAttribute('tableValues', t.b);

    const target = pickTargetContainer();
    if (target) {
      target.style.filter = `url(#${FILTER_ID})`;
    }
  }

  function removeFilter() {
    const svg = document.getElementById(SVG_ID);
    if (svg) svg.remove();
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

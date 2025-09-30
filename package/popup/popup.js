// ===== Presets =====
const PRESETS = [
  "#333333 0%, #B67B03 18%, #DAAF08 45%, #FEE9A0 70%, #DAAF08 85%, #B67B03 90%, #B67B03 98%, #ffffff 99%",
  "#333333 0%, #757575 18%, #9E9E9E 45%, #E8E8E8 70%, #9E9E9E 85%, #757575 90%, #757575 98%, #ffffff 99%",
  "#333333 0%, #ca7345 18%, #a14521 45%, #ffdeca 70%, #a14521 85%, #ca7345 90%, #ca7345 98%, #ffffff 99%",
  "#333333 0%, #44ca85 18%, #1a7043 45%, #7cf3ba 70%, #298946 85%, #31a070 90%, #31a070 98%, #ffffff 99%",
  "#333333 0%, #161532 18%, #6b6392 47%, #f78787 70%, #ffe4a8 92%, #ffffff 99%",
  "#333333 15%, #87094A 30%, #FF6773 50%, #FE839E 70%, #FCB89B 85%, #F8E0CA 96%, #ffffff 100%",
  "#333333 0%, #231557 19%, #44107A 29%, #ff5c92 67%, #ffb38a 91%, #fee3be 99%",
  "#333333 0%, #58200e 9%, #b45313 35%, #c96b2c 45%, #fea690 55%, #f78787 70%, #ffe4a8 92%, #ffffff 99%",
  "#333333 0%, #073155 18%, #368396 47%, #f78787 70%, #ffe4a8 92%, #ffffff 99%",
  "#333333 15%, #87094A 30%, #FF4A7A 50%, #FF7770 70%, #FFC484 85%, #F8E0CA 96%, #ffffff 100%",
  "#333333 8%, #3f2b88 27%, #FF4A7A 50%, #FF7770 70%, #FFC484 90%, #F8E0CA 99%",
  "#333333 0%, #763d3d 30%, #5eba97 62%, #ffffff 99%",
  "#333333 0%, #075433 18%, #369664 47%, #f78787 70%, #ffe4a8 92%, #ffffff 99%",
  "#007EA7 0%, #80CED7 98%, #ffffff 99%",
  "#ff2400 0%, #e81d1d 13%, #e8b71d 26%, #e3e81d 39%, #1de840 52%, #1ddde8 65%, #2b1de8 78%, #dd00f3 91%, #ffffff 100%"
];

let gp = null;
let attached = false;
let gradient = null;

const $ = (s) => document.querySelector(s);

// --- helpers ---

function rgbToHex(color) {
  if (/^#[a-f\d]{3}$|^#[a-f\d]{6}$/i.test(color)) return color;
  const m = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!m) return '';
  return '#' + [m[1], m[2], m[3]].map(v => (+v).toString(16).padStart(2, '0')).join('');
}

function replaceCss(css) {
  let ret = css;
  const rgba = css.match(/rgba\(\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(?:0|1|0?\.\d+)\)/g);
  if (rgba) {
    rgba.forEach(str => {
      ret = ret.replace(
        str,
        rgbToHex(str.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),.*\)/, 'rgb($1,$2,$3)'))
      );
    });
  }
  const rgbs = ret.match(/rgb\(\d+\s*,\s*\d+\s*,\s*\d+\)/g);
  if (rgbs) {
    rgbs.forEach(str => { ret = ret.replace(str, rgbToHex(str)); });
  }
  ret = ret.replace(/linear-gradient\(to\s+right,\s*/, '');
  if (ret.endsWith(')')) ret = ret.slice(0, -1);
  return ret;
}

function addTransparent(stops) {
  const ary = stops.split(', ');
  const start = ary[0].split(' ');
  if (start.length > 1 && start[1] !== '0%') {
    ary.unshift('transparent 0%', `${start[0]} 0%`);
  } else {
    ary.unshift('transparent 0%');
  }
  return ary.join(', ');
}

async function sendMessageAsync(msg) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  await ensureInjected(tab.id);
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tab.id, msg, (res) => resolve(res));
  });
}

async function ensureInjected(tabId) {
  const [{ result: already }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => window.__cgListenerInstalled === true
  });
  if (already) return;

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"]
  });
}

// --- core ---

function applyStopsToGp(stops) {
  attached = true;
  gp.off('change', onChange);
  gp.clear();
  const ary = stops.split(', ');
  ary.forEach((chunk, i) => {
    const parts = chunk.replace('%', '').split(' ');
    gp.addHandler(parseInt(parts[1]), parts[0], 1, i === ary.length - 1 ? { keepSelect: 1 } : undefined);
  });
  gradient = stops;
  gp.on('change', onChange);
  sendMessageAsync({ gradient: addTransparent(stops) });
}

function onChange(finish) {
  const value = gp.getValue();               // e.g. "linear-gradient(to right, #xxx 0%, ...)"
  gradient = replaceCss(value);              // to "#xxx 0%, #yyy 50%, ..."
  if (attached) {
    if (finish === 1 || finish === undefined) console.info(gradient);
    sendMessageAsync({ gradient: addTransparent(gradient) });
  }
}

function buildPresets() {
  const grid = $('#presetGrid');
  PRESETS.forEach(stops => {
    const b = document.createElement('button');
    b.style.backgroundImage = `linear-gradient(to bottom right, ${stops})`;
    b.addEventListener('click', () => applyStopsToGp(stops));
    grid.appendChild(b);
  });
}

// Init
window.addEventListener('DOMContentLoaded', () => {
  gp = new Grapick({ el: '#grapick', direction: 'right', type: 'linear', min: 0, max: 100 });
  gp.on('change', onChange);
  buildPresets();

  $('#btnRemove').addEventListener('click', () => sendMessageAsync({ gradient: 'remove' }));
});

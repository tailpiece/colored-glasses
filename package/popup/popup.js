let gradient = null;
const $ = (s) => document.querySelector(s);

// --- content.js へのメッセージ送信 ---
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

// --- 初期化 ---
window.addEventListener("DOMContentLoaded", () => {
  const grid = $("#presetGrid");
  const preview = $("#previewEditor");

  // 各ボタンにイベントをアタッチ
  grid.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const bg = btn.style.backgroundImage; // ← linear-gradient(...) そのまま
      gradient = bg;
      preview.style.backgroundImage = bg;   // プレビュー更新
      sendMessageAsync({ gradient: bg });   // ページに適用
    });
  });

  // remove ボタン
  $("#btnRemove").addEventListener("click", () => {
    gradient = null;
    preview.style.backgroundImage = "none";
    sendMessageAsync({ gradient: "remove" });
  });
});

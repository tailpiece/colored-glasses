if (!window.browserExtensionColoredGlasses) {
  function browserExtensionColoredGlasses(msg) {
    const body = document.getElementsByTagName('body');
    const main = document.getElementsByTagName('main');
    // const canvas = document.getElementsByTagName('canvas');
    const target = body.length > 0 ? body[0] : undefined;
    if (!target) {
      return;
    }

    const coloredGlassesId = 'colored-glasses-id';
    const layers = document.getElementById('layers');
    const cssId = document.getElementById(coloredGlassesId);

    if (msg.gradient && msg.gradient !== '') {
      if (msg.gradient !== "remove") {
        GradientMaps.applyGradientMap(target, msg.gradient);
        if (main.length > 0 && layers && !cssId) {
          const filterId = target.getAttribute('data-gradientmap-filter');
          const fragment = document.createDocumentFragment();
          const style = document.createElement('style');
          style.id = coloredGlassesId;
          style.innerText = '#layers ul, #layers > div > div > div > div > div > div > div { filter: url(#' + filterId + '); }';
          fragment.appendChild(style);
          main[0].appendChild(fragment);
        }
      } else {
        GradientMaps.removeGradientMap(target);
        if (main.length > 0 && layers && cssId) {
          cssId.remove();
        }
      }
    }
  }

  chrome.runtime.onMessage.addListener(browserExtensionColoredGlasses);
}

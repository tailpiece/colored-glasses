chrome.runtime.onMessage.addListener(function(msg) {
  const body = document.getElementsByTagName('body');
  const main = document.getElementsByTagName('main');
  const target = main.length > 0 ? main[0] : body.length > 0 ? body[0] : undefined;
  if (!target) {
    return;
  }

  const coloredGlassesId = 'colored-glasses-id';
  const layers = document.getElementById('layers');
  const cssId = document.getElementById(coloredGlassesId);

  if (msg.gradient && msg.gradient !== '') {
    if (msg.gradient !== "remove") {
      GradientMaps.applyGradientMap(target, msg.gradient);
      if (main && layers && !cssId) {
        const filterId = target.getAttribute('data-gradientmap-filter');
        const fragment = document.createDocumentFragment();
        const style = document.createElement('style');
        style.id = coloredGlassesId;
        style.innerText  = '#layers ul { filter: url(#' + filterId + '); }';
        fragment.appendChild(style);
        main.appendChild(fragment);
      }
    } else {
      GradientMaps.removeGradientMap(target);
      if (main && layers && cssId) {
        cssId.remove();
      }
    }
  }
});
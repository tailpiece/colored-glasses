chrome.runtime.onMessage.addListener(function(msg) {
  const target = document.getElementsByTagName('body')[0];
  if (msg.gradient && msg.gradient !== '') {
    if (msg.gradient === "remove") {
      GradientMaps.removeGradientMap(target);
    } else {
      // console.info(msg.gradient);
      GradientMaps.applyGradientMap(target, msg.gradient);
    }
  }
});
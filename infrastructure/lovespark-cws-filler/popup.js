/* LoveSpark CWS Filler — popup. Purely informational; all the work happens in
 * the in-page overlay (content.js) on the CWS dashboard. No permissions, no
 * network, no storage. This just initialises the shared theme dropdown. */
document.addEventListener("DOMContentLoaded", () => {
  if (window.LoveSparkTheme) LoveSparkTheme.init();
});

/* Dark Mode Reader — inline.js
   style="" attributes and legacy bgcolor/color attributes. We never rewrite the
   author's inline value (site JS may read it back); we set a --dmr-* custom
   property next to it and let theme.css apply it via [data-dmr-inline~=prop]. */
(function (root) {
  'use strict';
  const colors = root.DMR.colors;
  const PROPS = ['background', 'border', 'background-color', 'color', 'border-color', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'fill', 'stroke', 'outline-color', 'background-image', 'box-shadow'];
  const MARK = 'data-dmr-inline';

  function processElement(el, palette) {
    if (!(el instanceof Element) || !el.style) return;
    const style = el.style;
    const hit = [];
    for (const prop of PROPS) {
      let value = style.getPropertyValue(prop);
      if (!value) {
        // legacy attributes: <td bgcolor="#fff"> <font color="red">
        if (prop === 'background-color' && el.hasAttribute('bgcolor')) value = el.getAttribute('bgcolor');
        else if (prop === 'color' && el.hasAttribute('color') && el.tagName === 'FONT') value = el.getAttribute('color');
        else continue;
      }
      const next = colors.rewriteDeclaration(prop, value, palette);
      if (next === null) continue;
      style.setProperty('--dmr-' + prop, next);
      hit.push(prop);
    }
    // custom properties set inline (style="--brand:#fff") get their derived copies inline too
    for (let i = 0; i < style.length; i++) {
      const prop = style[i];
      if (!prop.startsWith('--') || prop.startsWith('--dmr-')) continue;
      for (const [dp, dv] of colors.expandCustomProp(prop, style.getPropertyValue(prop), palette)) style.setProperty(dp, dv);
    }
    if (hit.length) el.setAttribute(MARK, hit.join(' '));
    else if (el.hasAttribute(MARK)) el.removeAttribute(MARK);
    el.__dmrSeen = el.getAttribute('style');
  }

  function isOwnMutation(el) { return el.__dmrSeen !== undefined && el.__dmrSeen === el.getAttribute('style'); }

  function clear(rootNode) {
    rootNode.querySelectorAll(`[${MARK}]`).forEach((el) => {
      el.removeAttribute(MARK);
      for (const prop of PROPS) el.style.removeProperty('--dmr-' + prop);
      el.__dmrSeen = undefined;
    });
  }

  root.DMR.inline = { processElement, isOwnMutation, clear, PROPS, MARK };
})(typeof globalThis !== 'undefined' ? globalThis : this);

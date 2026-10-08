'use strict';

(function studyBubbles() {
  var tooltip = null;
  var selectedText = '';

  function createTooltip() {
    var el = document.createElement('div');
    el.id = 'sb-tooltip';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.textContent = 'Save as Bubble';
    el.addEventListener('click', saveBubble);
    el.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') saveBubble();
    });
    return el;
  }

  function showTooltip(x, y) {
    if (!tooltip) {
      tooltip = createTooltip();
      document.body.appendChild(tooltip);
    }
    tooltip.style.left = x + 'px';
    tooltip.style.top = (y - 40) + 'px';
    tooltip.classList.add('sb-visible');
  }

  function hideTooltip() {
    if (tooltip) tooltip.classList.remove('sb-visible');
  }

  function saveBubble() {
    if (!selectedText) return;
    var domain = location.hostname.replace(/^www\./, '');
    browser.runtime.sendMessage({
      type: 'ADD_BUBBLE',
      front: selectedText.trim(),
      back: '',
      source: location.href,
      domain: domain,
    });
    hideTooltip();
    showConfirmation();
    window.getSelection().removeAllRanges();
    selectedText = '';
  }

  function showConfirmation() {
    var toast = document.createElement('div');
    toast.className = 'sb-toast';
    toast.textContent = 'Bubble saved!';
    document.body.appendChild(toast);
    requestAnimationFrame(function() { toast.classList.add('sb-toast-show'); });
    setTimeout(function() {
      toast.classList.remove('sb-toast-show');
      setTimeout(function() { toast.remove(); }, 300);
    }, 1500);
  }

  document.addEventListener('mouseup', function(e) {
    setTimeout(function() {
      var sel = window.getSelection();
      var text = sel ? sel.toString().trim() : '';
      if (text.length >= 3 && text.length <= 500) {
        selectedText = text;
        var range = sel.getRangeAt(0);
        var rect = range.getBoundingClientRect();
        showTooltip(
          rect.left + rect.width / 2 + window.scrollX,
          rect.top + window.scrollY
        );
      } else {
        selectedText = '';
        hideTooltip();
      }
    }, 10);
  });

  document.addEventListener('mousedown', function(e) {
    if (tooltip && !tooltip.contains(e.target)) {
      hideTooltip();
    }
  });

  // Check if extension is enabled
  browser.storage.local.get('enabled').then(function(data) {
    if (data.enabled === false) {
      if (tooltip) tooltip.remove();
      tooltip = null;
    }
  });

  browser.storage.onChanged.addListener(function(changes, area) {
    if (area !== 'local') return;
    if (changes.enabled && changes.enabled.newValue === false) {
      if (tooltip) { tooltip.remove(); tooltip = null; }
    }
  });
})();

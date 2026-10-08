/**
 * Result page — reads generated HTML from storage and renders it.
 */

(async function () {
  const loading = document.getElementById('loading');
  const toolbar = document.getElementById('toolbar');
  const artFrame = document.getElementById('artFrame');
  const errorContainer = document.getElementById('errorContainer');
  const errorMsg = document.getElementById('errorMsg');
  const saveBtn = document.getElementById('saveBtn');

  let htmlContent = null;

  try {
    const data = await chrome.storage.local.get(['resultHtml', 'resultError']);

    // Clear stored data after reading
    await chrome.storage.local.remove(['resultHtml', 'resultError']);

    if (data.resultError) {
      showError(data.resultError);
      return;
    }

    if (!data.resultHtml) {
      showError('No art to display. Right-click an image and select "Convert to Syntax Art".');
      return;
    }

    htmlContent = data.resultHtml;
    showArt(htmlContent);
  } catch (err) {
    showError(err.message);
  }

  function showArt(html) {
    loading.style.display = 'none';
    toolbar.style.display = 'flex';
    artFrame.style.display = 'block';

    // Use srcdoc for clean iframe rendering
    artFrame.srcdoc = html;

    // Auto-resize iframe to content height after load
    artFrame.onload = () => {
      try {
        const doc = artFrame.contentDocument;
        if (doc && doc.body) {
          const h = doc.body.scrollHeight + 40; // padding
          artFrame.style.height = h + 'px';
          artFrame.style.minHeight = '100vh';
        }
      } catch (e) {
        // Cross-origin fallback — just use full viewport
        artFrame.style.height = '100vh';
      }
    };
  }

  function showError(message) {
    loading.style.display = 'none';
    errorContainer.style.display = 'flex';
    errorMsg.textContent = message;
  }

  // Save HTML button
  saveBtn.addEventListener('click', () => {
    if (!htmlContent) return;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'syntax-art.html';
    a.click();
    URL.revokeObjectURL(url);
  });
})();

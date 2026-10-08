// LoveSpark Focus Pro — paywall.js
// Lightweight pro-gating stub. Swap chrome.storage check for ExtensionPay when ready.
'use strict';

const Paywall = {
  async isPro() {
    const { proStatus } = await chrome.storage.local.get('proStatus');
    return !!proStatus;
  },

  async gatePro(callback) {
    if (await this.isPro()) {
      callback();
    } else {
      this.showUpgrade();
    }
  },

  showUpgrade() {
    chrome.tabs.create({ url: 'https://lovespark.love/pro' });
  },
};

if (typeof globalThis !== 'undefined') globalThis.Paywall = Paywall;

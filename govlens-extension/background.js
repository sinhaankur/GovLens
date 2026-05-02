// background.js – GovLens service worker
// Maintains the gov-site badge using the shared region-detection module.

importScripts('regions.js');

const { isGovUrl, detectRegion } = self.GOVLENS_REGIONS;

function setBadge(tabId, region) {
  if (region) {
    chrome.action.setBadgeText({ tabId, text: region.code });
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#137B3B' });
  } else {
    chrome.action.setBadgeText({ tabId, text: '' });
  }
}

chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
  if (change.status === 'complete' && tab.url) {
    setBadge(tabId, isGovUrl(tab.url) ? detectRegion(tab.url) : null);
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    setBadge(tabId, isGovUrl(tab.url) ? detectRegion(tab.url) : null);
  } catch (_) {}
});

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  if (msg?.type === 'OPEN_SIDE_PANEL') {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.windowId != null && chrome.sidePanel?.open) {
          await chrome.sidePanel.open({ windowId: tab.windowId });
        }
        respond({ ok: true });
      } catch (e) {
        respond({ ok: false, error: e.message });
      }
    })();
    return true;
  }
});

if (chrome.sidePanel?.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
}

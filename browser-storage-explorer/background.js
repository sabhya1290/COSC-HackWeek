// background.js - Background Service Worker for Browser Storage Explorer

// Listener for message passing between popup/dashboard and the active tab / cookies api
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_COOKIES') {
    chrome.cookies.getAll({ url: message.url }, (cookies) => {
      sendResponse({ cookies: cookies || [] });
    });
    return true; // Keep message channel open for async response
  }

  if (message.type === 'SET_COOKIE') {
    const details = {
      url: message.url,
      name: message.name,
      value: message.value,
      domain: message.domain || undefined,
      path: message.path || undefined,
      secure: message.secure,
      httpOnly: message.httpOnly,
      sameSite: message.sameSite || undefined
    };

    // If expiration is provided, convert to Unix timestamp (seconds)
    if (message.expirationDate) {
      details.expirationDate = parseFloat(message.expirationDate);
    }

    chrome.cookies.set(details, (cookie) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, cookie });
      }
    });
    return true;
  }

  if (message.type === 'DELETE_COOKIE') {
    chrome.cookies.remove({
      url: message.url,
      name: message.name
    }, (details) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, details });
      }
    });
    return true;
  }
});

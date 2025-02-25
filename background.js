// Background service worker for the Rapid Reader extension

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Rapid Reader extension installed');
});

// Listen for messages from the popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle any background tasks here if needed
  if (message.action === 'log') {
    console.log('Rapid Reader Log:', message.data);
  }
  return true; // Required for async response
});

// Optional: Add context menu for selected text
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'rsvpSelectedText',
    title: 'Speed Read with RSVP',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'rsvpSelectedText') {
    // Open the popup with the selected text
    chrome.action.openPopup();
  }
});

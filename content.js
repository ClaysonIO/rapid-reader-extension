// This content script is injected into web pages
// It can be used to interact with the page content if needed
// For our RSVP reader, we're primarily using the chrome.scripting API from the popup
// But we'll keep this file for potential future enhancements

console.log('Rapid Reader content script loaded');

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSelectedText') {
    const selectedText = window.getSelection().toString();
    sendResponse({ selectedText });
  }
  return true; // Required for async response
});

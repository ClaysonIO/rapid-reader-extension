// This content script is injected into web pages
// It can be used to interact with the page content if needed
// For our RSVP reader, we're primarily using the chrome.scripting API from the popup
// But we'll keep this file for potential future enhancements

console.log('Rapid Reader content script loaded');

// Function to select the main text content of the page
function selectMainContent() {
  // Clear any existing selection
  window.getSelection().removeAllRanges();
  
  // Potential content elements in order of priority
  const contentSelectors = [
    'article', 'main', '.content', '.article', '.post', '.entry',
    '#content', '#main', '.main-content', '.article-content',
    '.post-content', '.entry-content'
  ];
  
  // Find the first matching element that has substantial text
  let contentElement = null;
  
  // First try common content selectors
  for (const selector of contentSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      // Check if element has substantial text (more than 100 characters)
      const text = element.textContent.trim();
      if (text.length > 100) {
        contentElement = element;
        break;
      }
    }
    if (contentElement) break;
  }
  
  // If no content element found with selectors, try to find the element with the most text
  if (!contentElement) {
    let maxTextLength = 0;
    const bodyElements = document.body.querySelectorAll('p, div, section, article');
    
    for (const element of bodyElements) {
      // Skip elements that are likely not main content
      if (isElementToIgnore(element)) continue;
      
      const text = element.textContent.trim();
      if (text.length > maxTextLength) {
        maxTextLength = text.length;
        contentElement = element;
      }
    }
  }
  
  // If we found a content element, create a range and select it
  if (contentElement) {
    try {
      const range = document.createRange();
      range.selectNodeContents(contentElement);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      return selection.toString();
    } catch (e) {
      console.error('Error selecting content:', e);
    }
  }
  
  return '';
}

// Helper function to determine if an element should be ignored
function isElementToIgnore(element) {
  // Check if element or its ancestors are navigation, header, footer, sidebar, etc.
  const elementsToIgnore = ['nav', 'header', 'footer', 'aside', 'menu', 'button'];
  
  // Check if the element itself is one to ignore
  if (elementsToIgnore.includes(element.tagName.toLowerCase())) {
    return true;
  }
  
  // Check if element has classes that suggest it's not main content
  const classesToIgnore = ['nav', 'menu', 'header', 'footer', 'sidebar', 'comment', 'widget', 'ad', 'banner'];
  const elementClasses = element.className.toLowerCase();
  if (classesToIgnore.some(cls => elementClasses.includes(cls))) {
    return true;
  }
  
  // Check if element contains mostly images or buttons
  const images = element.querySelectorAll('img');
  const buttons = element.querySelectorAll('button, input[type="button"], input[type="submit"], .btn');
  const textLength = element.textContent.trim().length;
  
  // If element has more images/buttons than text, it's probably not main content
  if ((images.length > 0 || buttons.length > 0) && textLength < 50) {
    return true;
  }
  
  // Check ancestors up to 3 levels
  let parent = element.parentElement;
  let level = 0;
  while (parent && level < 3) {
    if (elementsToIgnore.includes(parent.tagName.toLowerCase())) {
      return true;
    }
    const parentClasses = parent.className.toLowerCase();
    if (classesToIgnore.some(cls => parentClasses.includes(cls))) {
      return true;
    }
    parent = parent.parentElement;
    level++;
  }
  
  return false;
}

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSelectedText') {
    const selectedText = window.getSelection().toString();
    sendResponse({ selectedText });
  } else if (message.action === 'selectMainContent') {
    const selectedText = selectMainContent();
    sendResponse({ selectedText });
  }
  return true; // Required for async response
});

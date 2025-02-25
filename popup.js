// Global variables
let words = [];
let currentIndex = 0;
let intervalId = null;
let wpm = 300;
let isPlaying = false;
let currentTheme = 'light'; // Default theme

// DOM elements
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const wpmSlider = document.getElementById('wpm');
const wpmValue = document.getElementById('wpm-value');
const statusMessage = document.getElementById('status-message');
const wordCount = document.getElementById('word-count');
const progressBar = document.getElementById('progress-bar');
const progressContainer = document.querySelector('.progress');
const beforeSpan = document.querySelector('.before');
const highlightSpan = document.querySelector('.highlight');
const afterSpan = document.querySelector('.after');
const themeSelect = document.getElementById('theme-select');

// Variables for drag functionality
let isDragging = false;

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
  // Set up event listeners
  startBtn.addEventListener('click', startReading);
  pauseBtn.addEventListener('click', pauseReading);
  resetBtn.addEventListener('click', resetReading);
  wpmSlider.addEventListener('input', updateWpm);
  themeSelect.addEventListener('change', updateTheme);
  
  // Add progress bar interaction events
  progressContainer.addEventListener('click', handleProgressClick);
  progressContainer.addEventListener('mousedown', handleProgressDragStart);
  document.addEventListener('mousemove', handleProgressDrag);
  document.addEventListener('mouseup', handleProgressDragEnd);
  
  // Load saved settings from storage
  chrome.storage.sync.get(['savedWpm', 'theme'], (result) => {
    // Load WPM
    if (result.savedWpm) {
      wpm = result.savedWpm;
      wpmSlider.value = wpm;
      wpmValue.textContent = wpm;
    }
    
    // Load theme
    if (result.theme) {
      currentTheme = result.theme;
      themeSelect.value = currentTheme;
      applyTheme(currentTheme);
    } else {
      // Default to system theme if not set
      themeSelect.value = 'system';
      applyTheme('system');
    }
  });
  
  // Get selected text from the active tab
  getSelectedText();
});

// Apply the selected theme
function applyTheme(theme) {
  currentTheme = theme;
  
  if (theme === 'system') {
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (currentTheme === 'system') {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    });
  } else {
    // Apply specific theme
    document.documentElement.setAttribute('data-theme', theme);
  }
  
  // Save theme preference
  chrome.storage.sync.set({theme: theme});
}

// Update theme when selection changes
function updateTheme() {
  const selectedTheme = themeSelect.value;
  applyTheme(selectedTheme);
}

// Get the selected text from the active tab
function getSelectedText() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    
    chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      function: () => {
        return window.getSelection().toString();
      }
    }, (results) => {
      if (chrome.runtime.lastError) {
        statusMessage.textContent = 'Error: ' + chrome.runtime.lastError.message;
        return;
      }
      
      const selectedText = results[0].result;
      
      if (!selectedText || selectedText.trim() === '') {
        // No text selected, attempt to select main content
        statusMessage.textContent = 'No text selected. Attempting to find main content...';
        
        // Execute script directly to select main content
        chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          function: () => {
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
            
            // Execute the main content selection
            return selectMainContent();
          }
        }, (results) => {
          if (chrome.runtime.lastError) {
            statusMessage.textContent = 'Error: ' + chrome.runtime.lastError.message;
            disableControls(true);
            return;
          }
          
          const mainContentText = results[0].result;
          
          if (!mainContentText || mainContentText.trim() === '') {
            statusMessage.textContent = 'Could not find main content. Please select text manually.';
            disableControls(true);
            return;
          }
          
          // Process the automatically selected text
          processText(mainContentText);
          statusMessage.textContent = 'Main content automatically selected.';
        });
        return;
      }
      
      // Process the selected text
      processText(selectedText);
    });
  });
}

// Process the text for RSVP reading
function processText(text) {
  // Split text into words and filter out empty strings
  words = text.split(/\s+/).filter(word => word.length > 0);
  
  // Update word count and reading time estimate
  updateWordCountAndTime();
  
  if (words.length > 0) {
    statusMessage.textContent = 'Ready to start speed reading.';
    disableControls(false);
    
    // Display the first word
    displayWord(0);
  } else {
    statusMessage.textContent = 'No valid text found. Please select text and try again.';
    disableControls(true);
  }
}

// Display a word using the RSVP technique
function displayWord(index) {
  if (index >= words.length) {
    pauseReading();
    statusMessage.textContent = 'Finished reading.';
    return;
  }
  
  const word = words[index];
  
  // Find the optimal recognition point (ORP)
  // For RSVP, this is typically near 30% of the word length
  const orpIndex = Math.min(Math.max(Math.floor(word.length * 0.3), 0), word.length - 1);
  
  // Split the word into parts
  const beforeORP = word.substring(0, orpIndex);
  const orpChar = word.charAt(orpIndex);
  const afterORP = word.substring(orpIndex + 1);
  
  // Update the display
  beforeSpan.textContent = beforeORP;
  highlightSpan.textContent = orpChar;
  afterSpan.textContent = afterORP;
  
  // Update progress bar
  const progress = ((index + 1) / words.length) * 100;
  progressBar.style.width = `${progress}%`;
}

// Start the speed reading
function startReading() {
  if (isPlaying || words.length === 0) return;
  
  isPlaying = true;
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  
  // Calculate interval based on WPM
  const interval = 60000 / wpm; // milliseconds per word
  
  // Start the interval
  intervalId = setInterval(() => {
    displayWord(currentIndex);
    currentIndex++;
    
    if (currentIndex >= words.length) {
      clearInterval(intervalId);
      isPlaying = false;
      startBtn.disabled = false;
      pauseBtn.disabled = true;
      statusMessage.textContent = 'Finished reading.';
    }
  }, interval);
  
  statusMessage.textContent = 'Speed reading...';
}

// Pause the speed reading
function pauseReading() {
  if (!isPlaying) return;
  
  clearInterval(intervalId);
  isPlaying = false;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  
  statusMessage.textContent = 'Paused.';
}

// Reset the speed reading
function resetReading() {
  clearInterval(intervalId);
  isPlaying = false;
  currentIndex = 0;
  
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  
  // Reset progress bar
  progressBar.style.width = '0%';
  
  // Display the first word
  if (words.length > 0) {
    displayWord(0);
    statusMessage.textContent = 'Reset to beginning.';
  }
}

// Update the WPM value
function updateWpm() {
  wpm = parseInt(wpmSlider.value);
  wpmValue.textContent = wpm;
  
  // Save the WPM to chrome storage
  chrome.storage.sync.set({savedWpm: wpm});
  
  // Update reading time estimate with new WPM
  updateWordCountAndTime();
  
  // If currently playing, restart with new speed
  if (isPlaying) {
    pauseReading();
    startReading();
  }
}

// Update word count and reading time estimate
function updateWordCountAndTime() {
  // Calculate reading time in minutes
  const readingTimeMinutes = words.length / wpm;
  
  // Convert to minutes:seconds format
  const minutes = Math.floor(readingTimeMinutes);
  const seconds = Math.round((readingTimeMinutes - minutes) * 60);
  
  // Format as MM:SS
  const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  // Update display
  wordCount.textContent = `Words: ${words.length} (${timeFormatted})`;
}

// Handle click on progress bar
function handleProgressClick(event) {
  if (isPlaying) {
    pauseReading();
  }
  
  const rect = progressContainer.getBoundingClientRect();
  const clickPosition = (event.clientX - rect.left) / rect.width;
  
  // Calculate the new index based on click position
  const newIndex = Math.floor(clickPosition * words.length);
  
  // Update current index and display
  currentIndex = Math.min(Math.max(newIndex, 0), words.length - 1);
  displayWord(currentIndex);
}

// Handle drag start on progress bar
function handleProgressDragStart(event) {
  isDragging = true;
  
  // If reading is in progress, pause it
  if (isPlaying) {
    pauseReading();
  }
  
  // Process the initial drag position
  handleProgressDrag(event);
}

// Handle dragging on progress bar
function handleProgressDrag(event) {
  if (!isDragging) return;
  
  const rect = progressContainer.getBoundingClientRect();
  
  // Calculate drag position, clamped between 0 and 1
  const dragPosition = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
  
  // Calculate the new index based on drag position
  const newIndex = Math.floor(dragPosition * words.length);
  
  // Update current index and display
  currentIndex = Math.min(Math.max(newIndex, 0), words.length - 1);
  displayWord(currentIndex);
  
  // Update progress bar visually
  const progress = ((currentIndex + 1) / words.length) * 100;
  progressBar.style.width = `${progress}%`;
}

// Handle drag end
function handleProgressDragEnd() {
  isDragging = false;
}

// Enable or disable controls
function disableControls(disabled) {
  startBtn.disabled = disabled;
  resetBtn.disabled = disabled;
  wpmSlider.disabled = disabled;
}

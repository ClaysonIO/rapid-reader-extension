# Rapid Reader Chrome Extension

A Chrome extension that implements the RSVP (Rapid Serial Visual Presentation) speed reading method for selected text on web pages. This extension allows you to speed read any selected text using the RSVP technique, which helps you read faster by presenting words one at a time with optimal recognition point (ORP) highlighting.

## Features

- Speed read selected text on any web page
- Adjustable reading speed (100-800 WPM)
- Optimal Recognition Point (ORP) highlighting for better comprehension
- Progress tracking
- Simple, intuitive interface
- Context menu integration

## Installation

### Prerequesites

1. Clone the repository to your machine.
2. Have a Chromium-based browser installed

### Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" by toggling the switch in the top right corner
3. Click "Load unpacked" and select the `RapidReader` folder
4. The extension should now be installed and visible in your Chrome toolbar

## How to Use

1. Select text on any web page
2. Click the Rapid Reader icon in the Chrome toolbar
3. The popup will display the selected text in the RSVP reader
4. Use the controls to:
   - Adjust the reading speed using the slider
   - Start/pause the speed reading
   - Reset to the beginning

You can also right-click on selected text and choose "Speed Read with RSVP" from the context menu.

If you click the extension icon without any text selected, it will attempt to select the main text of the current page.

## How It Works

The RSVP technique works by:

1. Presenting words one at a time in a fixed position
2. Highlighting the Optimal Recognition Point (ORP) of each word (typically near 30% of the word length)
3. This reduces the need for eye movement, allowing faster reading while maintaining comprehension

## Permissions

This extension requires the following permissions:

- `activeTab`: To access the current tab's content
- `scripting`: To execute scripts in the active tab
- `storage`: To store settings
- `contextMenus`: To add a context menu item for selected text

## Development

This extension is built using:

- Manifest V3 for Chrome Extensions
- HTML, CSS, and JavaScript
- Chrome Extension APIs

This tool was primarily generated using Claude Sonnet v3.7, via Cline.

## License

This project is open source and available under the MIT License.

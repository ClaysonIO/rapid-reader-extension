function cleanText(text) {
  return text
    .replace(/[–—]/g, ' $& ')
    .replace(/(?<=\p{L}[.,;:!?]?)\d+/gu, '');
}

if (typeof module !== 'undefined') module.exports = { cleanText };

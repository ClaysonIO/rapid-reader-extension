const { test } = require('node:test');
const assert = require('node:assert/strict');
const { cleanText } = require('./utils.js');

// Footnote removal
test('removes footnote number directly after a word', () => {
  assert.equal(cleanText('word42'), 'word');
});

test('removes multiple footnote numbers', () => {
  assert.equal(cleanText('word1 and another2'), 'word and another');
});

test('removes footnote after sentence-ending punctuation', () => {
  assert.equal(cleanText('End of sentence.42'), 'End of sentence.');
});

// Legitimate numbers that must be preserved
test('preserves dollar currency values', () => {
  assert.equal(cleanText('$200'), '$200');
});

test('preserves euro currency values', () => {
  assert.equal(cleanText('€200'), '€200');
});

test('preserves pound currency values', () => {
  assert.equal(cleanText('£200'), '£200');
});

test('preserves hyphenated number ranges', () => {
  assert.equal(cleanText('200-300'), '200-300');
});

test('preserves decimal numbers', () => {
  assert.equal(cleanText('3.14'), '3.14');
});

test('preserves comma-formatted numbers', () => {
  assert.equal(cleanText('1,000'), '1,000');
});

test('preserves standalone numbers', () => {
  assert.equal(cleanText('Type 2 diabetes'), 'Type 2 diabetes');
});

// Dash isolation
test('surrounds em-dash with spaces', () => {
  assert.equal(cleanText('word—word'), 'word — word');
});

test('surrounds en-dash with spaces', () => {
  assert.equal(cleanText('word–word'), 'word – word');
});

// Combined cases
test('removes footnote and isolates dash in the same string', () => {
  assert.equal(cleanText('word42—next'), 'word — next');
});

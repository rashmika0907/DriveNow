/**
 * Utility functions for security and DOM manipulation
 */

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML string
 */
const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Create a safe HTML element from template string
 * @param {string} html - HTML string (should be trusted/sanitized)
 * @returns {HTMLElement} DOM element
 */
const createElement = (html) => {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstChild;
};

module.exports = { escapeHtml, createElement };


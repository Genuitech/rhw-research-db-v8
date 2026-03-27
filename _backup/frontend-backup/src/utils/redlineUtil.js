/**
 * redlineUtil.js — Diff calculation and HTML formatting helpers
 * Phase 3, Plan 03-04: EntryViewer & RedlineEditor
 *
 * Uses a line-by-line LCS (Longest Common Subsequence) approach:
 * 1. Split both strings into words for meaningful diffing
 * 2. Find the LCS of word tokens
 * 3. Emit add/remove/equal parts
 */

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Tokenize a string into an array of tokens (words + whitespace/punctuation).
 * Keeps whitespace as separate tokens so diffs feel natural.
 * @param {string} str
 * @returns {string[]}
 */
function tokenize(str) {
  if (!str) return [];
  // Split into word characters and non-word characters (whitespace, punctuation)
  return str.match(/\w+|\W+/g) || [];
}

/**
 * Compute the LCS table for two token arrays.
 * @param {string[]} a
 * @param {string[]} b
 * @returns {number[][]}
 */
function lcsTable(a, b) {
  const m = a.length;
  const n = b.length;
  // Use a flat array for memory efficiency
  const dp = new Array((m + 1) * (n + 1)).fill(0);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i * (n + 1) + j] = dp[(i - 1) * (n + 1) + (j - 1)] + 1;
      } else {
        dp[i * (n + 1) + j] = Math.max(
          dp[(i - 1) * (n + 1) + j],
          dp[i * (n + 1) + (j - 1)]
        );
      }
    }
  }

  return { dp, n };
}

/**
 * Backtrack through the LCS table to produce a diff array.
 * @param {string[]} a - original tokens
 * @param {string[]} b - edited tokens
 * @returns {{ type: 'equal'|'add'|'remove', text: string }[]}
 */
function backtrack(a, b) {
  const m = a.length;
  const n = b.length;
  const { dp } = lcsTable(a, b);

  const parts = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      parts.unshift({ type: 'equal', text: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i * (n + 1) + (j - 1)] >= dp[(i - 1) * (n + 1) + j])) {
      parts.unshift({ type: 'add', text: b[j - 1] });
      j--;
    } else {
      parts.unshift({ type: 'remove', text: a[i - 1] });
      i--;
    }
  }

  return parts;
}

/**
 * Merge consecutive parts of the same type into single parts.
 * Reduces clutter in the diff output.
 * @param {{ type: string, text: string }[]} parts
 * @returns {{ type: string, text: string }[]}
 */
function mergeParts(parts) {
  if (parts.length === 0) return [];
  const merged = [];
  let current = { ...parts[0] };

  for (let i = 1; i < parts.length; i++) {
    if (parts[i].type === current.type) {
      current.text += parts[i].text;
    } else {
      merged.push(current);
      current = { ...parts[i] };
    }
  }
  merged.push(current);
  return merged;
}

/**
 * Calculate diff between original and edited strings.
 * Returns an array of { type: 'equal'|'add'|'remove', text: string }.
 *
 * Guarantee: filtering out 'add' parts and joining = original.
 *            filtering out 'remove' parts and joining = edited.
 *
 * @param {string} original
 * @param {string} edited
 * @returns {{ type: 'equal'|'add'|'remove', text: string }[]}
 */
export function calculateDiff(original, edited) {
  if (original === edited) {
    if (!original) return [];
    return [{ type: 'equal', text: original }];
  }

  const tokensA = tokenize(original);
  const tokensB = tokenize(edited);

  if (tokensA.length === 0) {
    return edited ? [{ type: 'add', text: edited }] : [];
  }
  if (tokensB.length === 0) {
    return original ? [{ type: 'remove', text: original }] : [];
  }

  const parts = backtrack(tokensA, tokensB);
  return mergeParts(parts);
}

/**
 * Format a diff array as an HTML string.
 * - Additions: <ins class="redline-add">text</ins> (green)
 * - Deletions: <del class="redline-del">text</del> (red)
 * - Equal: <span class="redline-equal">text</span>
 *
 * All text is HTML-escaped to prevent XSS.
 * Newlines in text are converted to <br> tags.
 *
 * @param {{ type: 'equal'|'add'|'remove', text: string }[]} diff
 * @returns {string} HTML string
 */
export function formatRedlineHTML(diff) {
  if (!diff || diff.length === 0) return '';

  return diff
    .map(({ type, text }) => {
      const escaped = escapeHtml(text).replace(/\n/g, '<br>');

      switch (type) {
        case 'add':
          return `<ins class="redline-add">${escaped}</ins>`;
        case 'remove':
          return `<del class="redline-del">${escaped}</del>`;
        case 'equal':
        default:
          return `<span class="redline-equal">${escaped}</span>`;
      }
    })
    .join('');
}

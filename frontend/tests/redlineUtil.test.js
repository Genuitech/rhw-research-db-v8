/**
 * Tests for redlineUtil — diff calculation helper
 * Phase 3, Plan 03-04: EntryViewer & RedlineEditor
 */

import { describe, it, expect } from 'vitest';
import { calculateDiff, formatRedlineHTML } from '../src/utils/redlineUtil.js';

describe('calculateDiff', () => {
  it('returns empty array for identical strings', () => {
    const diff = calculateDiff('hello world', 'hello world');
    // All parts should be "equal"
    expect(diff.every((part) => part.type === 'equal')).toBe(true);
  });

  it('detects a simple addition at end', () => {
    const diff = calculateDiff('hello', 'hello world');
    const added = diff.filter((p) => p.type === 'add');
    expect(added.length).toBeGreaterThan(0);
    const addedText = added.map((p) => p.text).join('');
    expect(addedText).toContain(' world');
  });

  it('detects a simple deletion at end', () => {
    const diff = calculateDiff('hello world', 'hello');
    const removed = diff.filter((p) => p.type === 'remove');
    expect(removed.length).toBeGreaterThan(0);
    const removedText = removed.map((p) => p.text).join('');
    expect(removedText).toContain(' world');
  });

  it('detects replacement in the middle', () => {
    const diff = calculateDiff('the cat sat', 'the dog sat');
    const added = diff.filter((p) => p.type === 'add');
    const removed = diff.filter((p) => p.type === 'remove');
    expect(added.length).toBeGreaterThan(0);
    expect(removed.length).toBeGreaterThan(0);
  });

  it('handles completely different strings', () => {
    const diff = calculateDiff('abc', 'xyz');
    const added = diff.filter((p) => p.type === 'add');
    const removed = diff.filter((p) => p.type === 'remove');
    expect(added.length).toBeGreaterThan(0);
    expect(removed.length).toBeGreaterThan(0);
  });

  it('handles empty original string', () => {
    const diff = calculateDiff('', 'new content');
    const added = diff.filter((p) => p.type === 'add');
    expect(added.length).toBeGreaterThan(0);
    const addedText = added.map((p) => p.text).join('');
    expect(addedText).toBe('new content');
  });

  it('handles empty edited string', () => {
    const diff = calculateDiff('original content', '');
    const removed = diff.filter((p) => p.type === 'remove');
    expect(removed.length).toBeGreaterThan(0);
    const removedText = removed.map((p) => p.text).join('');
    expect(removedText).toBe('original content');
  });

  it('handles both strings empty', () => {
    const diff = calculateDiff('', '');
    expect(diff).toEqual([]);
  });

  it('returns array of objects with type and text properties', () => {
    const diff = calculateDiff('hello', 'hello world');
    expect(Array.isArray(diff)).toBe(true);
    diff.forEach((part) => {
      expect(part).toHaveProperty('type');
      expect(part).toHaveProperty('text');
      expect(['add', 'remove', 'equal']).toContain(part.type);
    });
  });

  it('reconstructs original from equal + remove parts', () => {
    const original = 'the quick brown fox';
    const edited = 'the slow brown fox';
    const diff = calculateDiff(original, edited);
    const reconstructed = diff
      .filter((p) => p.type !== 'add')
      .map((p) => p.text)
      .join('');
    expect(reconstructed).toBe(original);
  });

  it('reconstructs edited from equal + add parts', () => {
    const original = 'the quick brown fox';
    const edited = 'the slow brown fox';
    const diff = calculateDiff(original, edited);
    const reconstructed = diff
      .filter((p) => p.type !== 'remove')
      .map((p) => p.text)
      .join('');
    expect(reconstructed).toBe(edited);
  });
});

describe('formatRedlineHTML', () => {
  it('returns a string', () => {
    const diff = [
      { type: 'equal', text: 'hello' },
      { type: 'add', text: ' world' },
    ];
    expect(typeof formatRedlineHTML(diff)).toBe('string');
  });

  it('wraps additions in ins element with class', () => {
    const diff = [{ type: 'add', text: 'new text' }];
    const html = formatRedlineHTML(diff);
    expect(html).toContain('<ins');
    expect(html).toContain('new text');
  });

  it('wraps deletions in del element with class', () => {
    const diff = [{ type: 'remove', text: 'old text' }];
    const html = formatRedlineHTML(diff);
    expect(html).toContain('<del');
    expect(html).toContain('old text');
  });

  it('renders equal text as plain span or text node', () => {
    const diff = [{ type: 'equal', text: 'unchanged' }];
    const html = formatRedlineHTML(diff);
    expect(html).toContain('unchanged');
    // Should NOT wrap in ins or del
    expect(html).not.toContain('<ins');
    expect(html).not.toContain('<del');
  });

  it('handles empty diff array', () => {
    const html = formatRedlineHTML([]);
    expect(typeof html).toBe('string');
    expect(html).toBe('');
  });

  it('escapes HTML special characters to prevent XSS', () => {
    const diff = [{ type: 'add', text: '<script>alert(1)</script>' }];
    const html = formatRedlineHTML(diff);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('preserves newlines as <br> or equivalent', () => {
    const diff = [{ type: 'equal', text: 'line one\nline two' }];
    const html = formatRedlineHTML(diff);
    // Either <br> tag or whitespace-pre rendering
    expect(html).toMatch(/line one|line two/);
  });
});

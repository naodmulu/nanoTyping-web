import { describe, expect, it } from 'vitest';

describe('test runner smoke test', () => {
  it('runs and evaluates basic assertions', () => {
    expect(1 + 1).toBe(2);
  });

  it('has jsdom available', () => {
    expect(typeof document).toBe('object');
    expect(document.createElement('div')).toBeInstanceOf(HTMLElement);
  });

  it('has jest-dom matchers wired up', () => {
    const el = document.createElement('span');
    el.textContent = 'hi';
    document.body.appendChild(el);
    expect(el).toBeInTheDocument();
    el.remove();
  });
});

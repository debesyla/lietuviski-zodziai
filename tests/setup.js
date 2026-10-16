import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';

// The SvelteKit router is not running in unit tests, so shallow routing writes
// straight to the test window's history.
vi.mock('$app/navigation', () => ({
  replaceState: vi.fn((url) => window.history.replaceState(window.history.state, '', url))
}));

afterEach(() => window.history.replaceState(null, '', '/'));

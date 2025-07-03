import { mock } from 'bun:test';

mock.module('ink-spinner', () => ({
  default: () => 'Spinner',
}));

mock.module('ink', () => ({
  render: () => ({
    lastFrame: () => 'mocked frame',
    rerender: () => {},
    unmount: () => {},
  }),
  Box: ({ children }: { children: React.ReactNode }) => children,
  Text: ({ children }: { children: React.ReactNode }) => children,
}));

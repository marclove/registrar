import { expect, test, mock } from 'bun:test';
import Cli from './cli.js';
import React from 'react';

mock.module('ink', () => ({
  render: (tree: React.ReactElement) => {
    return {
      lastFrame: () => "mocked frame",
      rerender: (newTree: React.ReactElement) => {},
      unmount: () => {},
    };
  },
  Box: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

mock.module('ink-spinner', () => ({
    default: () => '<Spinner />',
}));

test('should render checking status', () => {
  const { lastFrame } = require('ink').render(<Cli status="checking" />);
  expect(lastFrame()).toBe('mocked frame');
});
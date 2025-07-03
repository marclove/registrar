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
  const { render } = require('ink');
  const { lastFrame } = render(<Cli status="checking" />);
  expect(lastFrame()).toBe('mocked frame');
});

test('should render success status', () => {
  const { render } = require('ink');
  const { lastFrame } = render(<Cli status="success" />);
  expect(lastFrame()).toBe('mocked frame');
});

test('should render error status', () => {
  const { render } = require('ink');
  const { lastFrame } = render(<Cli status="error" error="Test Error" />);
  expect(lastFrame()).toBe('mocked frame');
});

test('should render message-only status', () => {
  const { render } = require('ink');
  const { lastFrame } = render(<Cli status="message-only" message="Test Message" />);
  expect(lastFrame()).toBe('mocked frame');
});

test('should render generating status', () => {
  const { render } = require('ink');
  const { lastFrame } = render(<Cli status="generating" />);
  expect(lastFrame()).toBe('mocked frame');
});

test('should render retrying status', () => {
  const { render } = require('ink');
  const { lastFrame } = render(<Cli status="retrying" attempt={2} maxAttempts={3} />);
  expect(lastFrame()).toBe('mocked frame');
});

test('should render committing status', () => {
  const { render } = require('ink');
  const { lastFrame } = render(<Cli status="committing" />);
  expect(lastFrame()).toBe('mocked frame');
});

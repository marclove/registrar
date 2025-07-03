import React from 'react';
import { expect, test } from 'bun:test';
import { render } from 'ink-testing-library';
import Cli from './cli.js';

test('should render checking status', () => {
  const { lastFrame } = render(<Cli status="checking" />);
  
  expect(lastFrame()).toContain('Checking for staged changes...');
  // Note: Spinner characters may vary, so we check for the status text
});

test('should render generating status with timer', () => {
  const { lastFrame } = render(<Cli status="generating" />);
  
  expect(lastFrame()).toContain('Generating commit message...');
  expect(lastFrame()).toContain('Time elapsed: 0s');
});

test('should render committing status with timer', () => {
  const { lastFrame } = render(<Cli status="committing" />);
  
  expect(lastFrame()).toContain('Committing changes...');
  expect(lastFrame()).toContain('Time elapsed: 0s');
});

test('should render success status', () => {
  const { lastFrame } = render(<Cli status="success" />);
  
  expect(lastFrame()).toContain('✓');
  expect(lastFrame()).toContain('Committed successfully!');
});

test('should render error status', () => {
  const { lastFrame } = render(<Cli status="error" error="Test error message" />);
  
  expect(lastFrame()).toContain('✗');
  expect(lastFrame()).toContain('Error occurred');
  expect(lastFrame()).toContain('Test error message');
});

test('should display message when provided', () => {
  const message = 'feat: add new feature';
  const { lastFrame } = render(<Cli status="success" message={message} />);
  
  expect(lastFrame()).toContain(message);
});

test('should not show timer for checking status', () => {
  const { lastFrame } = render(<Cli status="checking" />);
  
  expect(lastFrame()).not.toContain('Time elapsed:');
});

test('should not show timer for success status', () => {
  const { lastFrame } = render(<Cli status="success" />);
  
  expect(lastFrame()).not.toContain('Time elapsed:');
});

test('should not show timer for error status', () => {
  const { lastFrame } = render(<Cli status="error" error="Test error" />);
  
  expect(lastFrame()).not.toContain('Time elapsed:');
});

test('should handle status transitions', () => {
  const { lastFrame, rerender } = render(<Cli status="checking" />);
  
  expect(lastFrame()).toContain('Checking for staged changes...');
  
  rerender(<Cli status="generating" />);
  expect(lastFrame()).toContain('Generating commit message...');
  expect(lastFrame()).toContain('Time elapsed: 0s');
  
  rerender(<Cli status="committing" message="feat: test message" />);
  expect(lastFrame()).toContain('Committing changes...');
  expect(lastFrame()).toContain('feat: test message');
  
  rerender(<Cli status="success" message="Committed with message: feat: test message" />);
  expect(lastFrame()).toContain('✓');
  expect(lastFrame()).toContain('Committed successfully!');
});

// Note: Timer increment tests are not possible with Bun's current timer limitations
// The actual timer functionality works in practice, but we can't test the increment behavior
// since Bun doesn't support advancing fake timers with setInterval yet
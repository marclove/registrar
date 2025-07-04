import { render } from "ink-testing-library";
import React from "react";
import { expect, test, vi } from "vitest";
import Cli from "./cli.js";

vi.mock("ink-spinner", () => ({
  default: () => "<Spinner />",
}));

test("should render checking status", () => {
  const { lastFrame } = render(<Cli status="checking" />);
  expect(lastFrame()).toContain("Checking for staged changes...");
});

test("should render success status", () => {
  const { lastFrame } = render(<Cli status="success" />);
  expect(lastFrame()).toContain("Committed successfully!");
});

test("should render error status", () => {
  const { lastFrame } = render(<Cli status="error" error="Test Error" />);
  expect(lastFrame()).toContain("Test Error");
});

test("should render message-only status", () => {
  const { lastFrame } = render(<Cli status="message-only" message="Test Message" />);
  expect(lastFrame()).toContain("Test Message");
});

test("should render generating status", () => {
  const { lastFrame } = render(<Cli status="generating" />);
  expect(lastFrame()).toContain("Generating commit message...");
});

test("should render retrying status", () => {
  const { lastFrame } = render(<Cli status="retrying" attempt={2} maxAttempts={3} />);
  expect(lastFrame()).toContain("Retrying commit message generation (attempt 2/3)...");
});

test("should render committing status", () => {
  const { lastFrame } = render(<Cli status="committing" />);
  expect(lastFrame()).toContain("Committing changes...");
});

import { render } from "ink";
import React from "react";
import simpleGit from "simple-git";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as message from "./message.js";

vi.mock("ink", async () => {
  const actual = await vi.importActual("ink");
  return {
    ...actual,
    render: vi.fn(() => ({
      rerender: vi.fn(),
      unmount: vi.fn(),
      lastFrame: vi.fn(),
    })),
  };
});

const mockGit = {
  diff: vi.fn(() => Promise.resolve("mock diff content")),
  commit: vi.fn(() => Promise.resolve()),
};

vi.mock("simple-git", () => ({
  default: () => mockGit,
}));

// Mock the new git-utils module
const mockValidateGitState = vi.fn(() => Promise.resolve({ isValid: true }));
const mockEnhancedGit = {
  getStagedDiff: vi.fn(() => Promise.resolve("mock diff content")),
  commit: vi.fn(() => Promise.resolve()),
};

vi.mock("./git-utils.js", () => ({
  validateGitState: mockValidateGitState,
  EnhancedGit: vi.fn(() => mockEnhancedGit),
}));

describe("runApp", () => {
  const mockCommitMessage = vi.fn(() => Promise.resolve("feat: add new feature"));
  let commitMessageSpy: any;

  // Mock modules for runApp tests
  vi.mock("ink-spinner", () => ({
    default: () => "⠋",
  }));

  vi.mock("react", async () => {
    const actual = await vi.importActual("react");
    return {
      ...actual,
      Fragment: ({ children }: { children: React.ReactNode }) => children,
    };
  });

  // Mock process.exit to prevent tests from actually exiting
  const originalExit = process.exit;
  const mockExit = vi.fn((_code?: number) => {});

  // Mock setTimeout to control timing
  const originalSetTimeout = setTimeout;
  const mockSetTimeout = vi.fn((callback: Function, delay?: number) => {
    // Execute callback immediately for testing
    callback();
    return 1 as unknown as NodeJS.Timeout;
  });

  beforeEach(() => {
    process.exit = mockExit as any;
    global.setTimeout = mockSetTimeout as any;

    // Spy on the default export of message.js
    commitMessageSpy = vi.spyOn(message, "default").mockImplementation(
      mockCommitMessage as any,
    );

    // Clear all mocks
    mockValidateGitState.mockClear();
    mockEnhancedGit.getStagedDiff.mockClear(); 
    mockEnhancedGit.commit.mockClear();
    mockCommitMessage.mockClear();
    mockExit.mockClear();
    mockSetTimeout.mockClear();
    (render as any).mockClear();
  });

  afterEach(() => {
    process.exit = originalExit;
    global.setTimeout = originalSetTimeout;
    // Restore the original implementation
    commitMessageSpy.mockRestore();
    vi.restoreAllMocks();
  });

  test("app module should export runApp function", async () => {
    const { runApp } = await import("./app.js");
    expect(typeof runApp).toBe("function");
  });

  test("runApp handles successful flow", async () => {
    // Mock successful operations
    mockValidateGitState.mockResolvedValue({ isValid: true });
    mockEnhancedGit.getStagedDiff.mockResolvedValue("mock diff content");
    mockEnhancedGit.commit.mockResolvedValue(undefined);
    mockCommitMessage.mockResolvedValue("feat: add new feature");

    const { runApp } = await import("./app.js");

    await runApp();

    expect(render).toHaveBeenCalled();
    expect(mockValidateGitState).toHaveBeenCalled();
    expect(mockEnhancedGit.getStagedDiff).toHaveBeenCalled();
    expect(mockCommitMessage).toHaveBeenCalledWith("mock diff content");
    expect(mockEnhancedGit.commit).toHaveBeenCalledWith("feat: add new feature");
    expect(mockSetTimeout).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  test("runApp handles no staged changes", async () => {
    // Mock no staged changes
    mockValidateGitState.mockResolvedValue({ 
      isValid: false, 
      message: "No changes have been staged for commit."
    });

    const { runApp } = await import("./app.js");

    await runApp();

    expect(render).toHaveBeenCalled();
    expect(mockValidateGitState).toHaveBeenCalled();
    expect(mockCommitMessage).not.toHaveBeenCalled();
    expect(mockEnhancedGit.commit).not.toHaveBeenCalled();

    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test("runApp handles git diff error", async () => {
    // Mock git validation error
    mockValidateGitState.mockResolvedValue({ 
      isValid: false, 
      message: "Git validation failed"
    });

    const { runApp } = await import("./app.js");

    await runApp();

    expect(render).toHaveBeenCalled();
    expect(mockValidateGitState).toHaveBeenCalled();
    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test("runApp handles commit message generation error with retries", async () => {
    // Mock successful validation and diff but failed message generation for all attempts
    mockValidateGitState.mockResolvedValue({ isValid: true });
    mockEnhancedGit.getStagedDiff.mockResolvedValue("mock diff content");
    mockCommitMessage.mockRejectedValue(new Error("API error"));

    const { runApp } = await import("./app.js");

    await runApp();

    expect(render).toHaveBeenCalled();
    expect(mockValidateGitState).toHaveBeenCalled();
    expect(mockEnhancedGit.getStagedDiff).toHaveBeenCalled();
    // Should be called 3 times (max attempts)
    expect(mockCommitMessage).toHaveBeenCalledTimes(3);
    expect(mockCommitMessage).toHaveBeenCalledWith("mock diff content");
    expect(mockEnhancedGit.commit).not.toHaveBeenCalled();
    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test("runApp succeeds on second attempt after initial failure", async () => {
    // Mock successful validation and diff, failed first attempt, successful second attempt
    mockValidateGitState.mockResolvedValue({ isValid: true });
    mockEnhancedGit.getStagedDiff.mockResolvedValue("mock diff content");
    mockCommitMessage
      .mockRejectedValueOnce(new Error("First attempt failed"))
      .mockResolvedValueOnce("feat: add new feature");
    mockEnhancedGit.commit.mockResolvedValue(undefined);

    const { runApp } = await import("./app.js");

    await runApp();

    expect(render).toHaveBeenCalled();
    expect(mockValidateGitState).toHaveBeenCalled();
    expect(mockEnhancedGit.getStagedDiff).toHaveBeenCalled();
    // Should be called twice (first fails, second succeeds)
    expect(mockCommitMessage).toHaveBeenCalledTimes(2);
    expect(mockCommitMessage).toHaveBeenCalledWith("mock diff content");
    expect(mockEnhancedGit.commit).toHaveBeenCalledWith("feat: add new feature");
    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 1500);
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  test("runApp succeeds on third attempt after two failures", async () => {
    // Mock successful validation and diff, two failed attempts, successful third attempt
    mockValidateGitState.mockResolvedValue({ isValid: true });
    mockEnhancedGit.getStagedDiff.mockResolvedValue("mock diff content");
    mockCommitMessage
      .mockRejectedValueOnce(new Error("First attempt failed"))
      .mockRejectedValueOnce(new Error("Second attempt failed"))
      .mockResolvedValueOnce("feat: add new feature");
    mockEnhancedGit.commit.mockResolvedValue(undefined);

    const { runApp } = await import("./app.js");

    await runApp();

    expect(render).toHaveBeenCalled();
    expect(mockValidateGitState).toHaveBeenCalled();
    expect(mockEnhancedGit.getStagedDiff).toHaveBeenCalled();
    // Should be called three times (first two fail, third succeeds)
    expect(mockCommitMessage).toHaveBeenCalledTimes(3);
    expect(mockCommitMessage).toHaveBeenCalledWith("mock diff content");
    expect(mockEnhancedGit.commit).toHaveBeenCalledWith("feat: add new feature");
    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 1500);
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  test("runApp handles git commit error", async () => {
    // Mock successful operations until commit
    mockValidateGitState.mockResolvedValue({ isValid: true });
    mockEnhancedGit.getStagedDiff.mockResolvedValue("mock diff content");
    mockCommitMessage.mockResolvedValue("feat: add new feature");
    mockEnhancedGit.commit.mockRejectedValue(new Error("Commit failed"));

    const { runApp } = await import("./app.js");

    await runApp();

    expect(render).toHaveBeenCalled();
    expect(mockValidateGitState).toHaveBeenCalled();
    expect(mockEnhancedGit.getStagedDiff).toHaveBeenCalled();
    expect(mockCommitMessage).toHaveBeenCalledWith("mock diff content");
    expect(mockEnhancedGit.commit).toHaveBeenCalledWith("feat: add new feature");
    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test("runApp handles non-Error exceptions", async () => {
    mockValidateGitState.mockResolvedValue({ 
      isValid: false, 
      message: "String error"
    });

    const { runApp } = await import("./app.js");
    await runApp();

    expect(render).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
  });
});

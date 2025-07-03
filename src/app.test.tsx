import {
  afterEach,
  beforeEach,
  describe,
  expect,
  vi,
  test,
} from "vitest";
import React from "react";
import * as message from "./message.js";
import { render } from "ink";
import simpleGit from "simple-git";

vi.mock('ink', async () => {
  const actual = await vi.importActual('ink');
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

describe("runApp", () => {
  const mockCommitMessage = vi.fn(() => Promise.resolve("feat: add new feature"));
  let commitMessageSpy: ReturnType<typeof vi.spyOn>;

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
      mockCommitMessage,
    );

    // Clear all mocks
    mockGit.diff.mockClear();
    mockGit.commit.mockClear();
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
    mockGit.diff.mockResolvedValue("mock diff content");
    mockGit.commit.mockResolvedValue(undefined);
    mockCommitMessage.mockResolvedValue("feat: add new feature");

    const { runApp } = await import("./app.js");

    await runApp();

    expect(render).toHaveBeenCalled();
    expect(mockGit.diff).toHaveBeenCalledWith({ "--cached": null });
    expect(mockCommitMessage).toHaveBeenCalledWith("mock diff content");
    expect(mockGit.commit).toHaveBeenCalledWith("feat: add new feature");
    expect(mockSetTimeout).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  test("runApp handles no staged changes", async () => {
    // Mock no staged changes
    mockGit.diff.mockResolvedValue("");

    const { runApp } = await import("./app.js");

    await runApp();

    expect(render).toHaveBeenCalled();
    expect(mockGit.diff).toHaveBeenCalledWith({ "--cached": null });
    expect(mockCommitMessage).not.toHaveBeenCalled();
    expect(mockGit.commit).not.toHaveBeenCalled();

    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test("runApp handles git diff error", async () => {
    // Mock git diff error
    mockGit.diff.mockRejectedValue(new Error("Git diff failed"));

    const { runApp } = await import("./app.js");

    await runApp();

    expect(render).toHaveBeenCalled();
    expect(mockGit.diff).toHaveBeenCalledWith({ "--cached": null });
    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test("runApp handles commit message generation error with retries", async () => {
    // Mock successful diff but failed message generation for all attempts
    mockGit.diff.mockResolvedValue("mock diff content");
    mockCommitMessage.mockRejectedValue(new Error("API error"));

    const { runApp } = await import("./app.js");

    await runApp();

    expect(render).toHaveBeenCalled();
    expect(mockGit.diff).toHaveBeenCalledWith({ "--cached": null });
    // Should be called 3 times (max attempts)
    expect(mockCommitMessage).toHaveBeenCalledTimes(3);
    expect(mockCommitMessage).toHaveBeenCalledWith("mock diff content");
    expect(mockGit.commit).not.toHaveBeenCalled();
    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test("runApp succeeds on second attempt after initial failure", async () => {
    // Mock successful diff, failed first attempt, successful second attempt
    mockGit.diff.mockResolvedValue("mock diff content");
    mockCommitMessage
      .mockRejectedValueOnce(new Error("First attempt failed"))
      .mockResolvedValueOnce("feat: add new feature");
    mockGit.commit.mockResolvedValue(undefined);

    const { runApp } = await import("./app.js");

    await runApp();

    expect(render).toHaveBeenCalled();
    expect(mockGit.diff).toHaveBeenCalledWith({ "--cached": null });
    // Should be called twice (first fails, second succeeds)
    expect(mockCommitMessage).toHaveBeenCalledTimes(2);
    expect(mockCommitMessage).toHaveBeenCalledWith("mock diff content");
    expect(mockGit.commit).toHaveBeenCalledWith("feat: add new feature");
    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 1500);
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  test("runApp succeeds on third attempt after two failures", async () => {
    // Mock successful diff, two failed attempts, successful third attempt
    mockGit.diff.mockResolvedValue("mock diff content");
    mockCommitMessage
      .mockRejectedValueOnce(new Error("First attempt failed"))
      .mockRejectedValueOnce(new Error("Second attempt failed"))
      .mockResolvedValueOnce("feat: add new feature");
    mockGit.commit.mockResolvedValue(undefined);

    const { runApp } = await import("./app.js");

    await runApp();

    expect(render).toHaveBeenCalled();
    expect(mockGit.diff).toHaveBeenCalledWith({ "--cached": null });
    // Should be called three times (first two fail, third succeeds)
    expect(mockCommitMessage).toHaveBeenCalledTimes(3);
    expect(mockCommitMessage).toHaveBeenCalledWith("mock diff content");
    expect(mockGit.commit).toHaveBeenCalledWith("feat: add new feature");
    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 1500);
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  test("runApp handles git commit error", async () => {
    // Mock successful operations until commit
    mockGit.diff.mockResolvedValue("mock diff content");
    mockCommitMessage.mockResolvedValue("feat: add new feature");
    mockGit.commit.mockRejectedValue(new Error("Commit failed"));

    const { runApp } = await import("./app.js");

    await runApp();

    expect(render).toHaveBeenCalled();
    expect(mockGit.diff).toHaveBeenCalledWith({ "--cached": null });
    expect(mockCommitMessage).toHaveBeenCalledWith("mock diff content");
    expect(mockGit.commit).toHaveBeenCalledWith("feat: add new feature");
    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test("runApp handles non-Error exceptions", async () => {
    mockGit.diff.mockRejectedValue("String error");

    const { runApp } = await import("./app.js");
    await runApp();

    expect(render).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);
  });
});

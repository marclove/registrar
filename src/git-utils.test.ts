import { describe, it, expect } from "vitest";
import { formatGitError, type GitError } from "./git-utils.js";

describe("git-utils", () => {
  describe("formatGitError", () => {
    it("should format git repository error", () => {
      const error: GitError = {
        name: "GitError",
        message: "original message",
        stderr: "not a git repository",
        command: "git status",
        exitCode: 128,
      };
      
      const formatted = formatGitError(error);
      expect(formatted).toBe(
        "This directory is not a Git repository. Please run this command from within a Git repository."
      );
    });

    it("should format no changes added error", () => {
      const error: GitError = {
        name: "GitError", 
        message: "original message",
        stderr: "no changes added to commit",
        command: "git commit",
        exitCode: 1,
      };
      
      const formatted = formatGitError(error);
      expect(formatted).toBe(
        'No changes have been staged for commit. Use "git add" to stage changes first.'
      );
    });

    it("should format nothing to commit error", () => {
      const error: GitError = {
        name: "GitError",
        message: "original message", 
        stderr: "nothing to commit",
        command: "git commit",
        exitCode: 1,
      };
      
      const formatted = formatGitError(error);
      expect(formatted).toBe("No changes detected. There is nothing to commit.");
    });

    it("should format index lock error", () => {
      const error: GitError = {
        name: "GitError",
        message: "original message",
        stderr: "fatal: Unable to create '.git/index.lock': File exists",
        command: "git add",
        exitCode: 128,
      };
      
      const formatted = formatGitError(error);
      expect(formatted).toBe(
        "Git index is locked. Another git process may be running. Please wait and try again."
      );
    });

    it("should format pre-commit hook failure", () => {
      const error: GitError = {
        name: "GitError",
        message: "original message",
        stderr: "pre-commit hook failed",
        command: "git commit",
        exitCode: 1,
      };
      
      const formatted = formatGitError(error);
      expect(formatted).toBe(
        "Commit failed due to a pre-commit hook. Please resolve the issues and try again. Original error: pre-commit hook failed"
      );
    });

    it("should format commit-msg hook failure", () => {
      const error: GitError = {
        name: "GitError",
        message: "original message",
        stderr: "commit-msg hook failed",
        command: "git commit", 
        exitCode: 1,
      };
      
      const formatted = formatGitError(error);
      expect(formatted).toBe(
        "Commit failed due to a commit-msg hook. Please resolve the issues and try again. Original error: commit-msg hook failed"
      );
    });

    it("should format unrelated histories error", () => {
      const error: GitError = {
        name: "GitError",
        message: "original message",
        stderr: "refusing to merge unrelated histories",
        command: "git merge",
        exitCode: 1,
      };
      
      const formatted = formatGitError(error);
      expect(formatted).toBe(
        "Cannot merge unrelated Git histories. This may require manual intervention."
      );
    });

    it("should format pathspec error", () => {
      const error: GitError = {
        name: "GitError",
        message: "original message", 
        stderr: "error: pathspec 'nonexistent.txt' did not match any files",
        command: "git add",
        exitCode: 1,
      };
      
      const formatted = formatGitError(error);
      expect(formatted).toBe(
        "No files match the specified path. Please check the file paths and try again."
      );
    });

    it("should format corrupted repository error", () => {
      const error: GitError = {
        name: "GitError",
        message: "original message",
        stderr: "fatal: could not read index",
        command: "git status",
        exitCode: 128,
      };
      
      const formatted = formatGitError(error);
      expect(formatted).toBe(
        "Unable to read Git repository data. The repository may be corrupted."
      );
    });

    it("should handle generic errors with stderr", () => {
      const error: GitError = {
        name: "GitError",
        message: "original message",
        stderr: "some other git error",
        command: "git push",
        exitCode: 1,
      };
      
      const formatted = formatGitError(error);
      expect(formatted).toBe(
        "Git command failed (git push) with exit code 1: some other git error"
      );
    });

    it("should handle errors without stderr", () => {
      const error: GitError = {
        name: "GitError",
        message: "",
        stderr: "",
        command: "git push",
        exitCode: 1,
      };
      
      const formatted = formatGitError(error);
      expect(formatted).toBe(
        "Git command failed (git push) with exit code 1: No error details available"
      );
    });

    it("should handle errors without exit code", () => {
      const error: GitError = {
        name: "GitError",
        message: "original message",
        stderr: "network error",
        command: "git fetch",
      };
      
      const formatted = formatGitError(error);
      expect(formatted).toBe(
        "Git command failed (git fetch): network error"
      );
    });
  });
});
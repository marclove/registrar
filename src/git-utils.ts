/**
 * Git utility functions for enhanced error handling and git command execution
 * Inspired by google-gemini/gemini-cli improvements
 */

import simpleGit, { type SimpleGit } from "simple-git";

export interface GitError extends Error {
  exitCode?: number;
  stderr?: string;
  command?: string;
}

/**
 * Format git error messages with user-friendly descriptions
 * Based on the approach from google-gemini/gemini-cli PR #2891
 */
export function formatGitError(error: GitError): string {
  const command = error.command || 'git command';
  const stderr = error.stderr || '';
  const exitCode = error.exitCode;

  const baseError = exitCode 
    ? `Git command failed (${command}) with exit code ${exitCode}`
    : `Git command failed (${command})`;

  // Use stderr if available, otherwise fall back to original message
  const errorDetails = stderr.trim() || error.message || '';

  if (!errorDetails) {
    return `${baseError}: No error details available`;
  }

  // Check for specific git error patterns and provide user-friendly messages
  if (errorDetails.includes('not a git repository')) {
    return (
      'This directory is not a Git repository. ' +
      'Please run this command from within a Git repository.'
    );
  } else if (errorDetails.includes('no changes added to commit')) {
    return 'No changes have been staged for commit. Use "git add" to stage changes first.';
  } else if (errorDetails.includes('nothing to commit')) {
    return 'No changes detected. There is nothing to commit.';
  } else if (errorDetails.includes('index.lock')) {
    return 'Git index is locked. Another git process may be running. Please wait and try again.';
  } else if (errorDetails.includes('refusing to merge unrelated histories')) {
    return (
      'Cannot merge unrelated Git histories. ' +
      'This may require manual intervention.'
    );
  } else if (
    errorDetails.includes('pathspec') &&
    errorDetails.includes('did not match any files')
  ) {
    return (
      'No files match the specified path. ' +
      'Please check the file paths and try again.'
    );
  } else if (
    errorDetails.includes('fatal: could not read') ||
    errorDetails.includes('fatal: unable to read')
  ) {
    return 'Unable to read Git repository data. The repository may be corrupted.';
  } else if (errorDetails.includes('pre-commit hook failed')) {
    return (
      'Commit failed due to a pre-commit hook. ' +
      'Please resolve the issues and try again. ' +
      `Original error: ${errorDetails.trim()}`
    );
  } else if (errorDetails.includes('commit-msg hook failed')) {
    return (
      'Commit failed due to a commit-msg hook. ' +
      'Please resolve the issues and try again. ' +
      `Original error: ${errorDetails.trim()}`
    );
  } else {
    return `${baseError}: ${errorDetails.trim()}`;
  }
}

/**
 * Enhanced git wrapper with better error handling
 */
export class EnhancedGit {
  private git: SimpleGit;

  constructor() {
    this.git = simpleGit();
  }

  /**
   * Get staged changes diff
   */
  async getStagedDiff(): Promise<string> {
    try {
      return await this.git.diff({ "--cached": null });
    } catch (error) {
      throw this.enhanceError(error as Error, 'git diff --cached');
    }
  }

  /**
   * Get git status
   */
  async getStatus(): Promise<string> {
    try {
      const status = await this.git.status();
      return status.files.map(file => `${file.index}${file.working_tree} ${file.path}`).join('\n');
    } catch (error) {
      throw this.enhanceError(error as Error, 'git status');
    }
  }

  /**
   * Commit with enhanced error handling
   */
  async commit(message: string): Promise<void> {
    try {
      await this.git.commit(message);
    } catch (error) {
      throw this.enhanceError(error as Error, 'git commit');
    }
  }

  /**
   * Check if we're in a git repository
   */
  async isRepo(): Promise<boolean> {
    try {
      await this.git.status();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Enhance error with git-specific formatting
   */
  private enhanceError(error: Error, command: string): GitError {
    const gitError = error as GitError;
    gitError.command = command;
    
    // Extract stderr from simple-git error if available
    if ('git' in error && typeof (error as any).git === 'object') {
      const gitInfo = (error as any).git;
      if (gitInfo.stderr) {
        gitError.stderr = gitInfo.stderr;
      }
    }

    // Format the error message
    const formattedMessage = formatGitError(gitError);
    gitError.message = formattedMessage;
    
    return gitError;
  }
}

/**
 * Validate git repository state and provide helpful feedback
 */
export async function validateGitState(): Promise<{ isValid: boolean; message?: string }> {
  const git = new EnhancedGit();

  // Check if we're in a git repository
  if (!(await git.isRepo())) {
    return {
      isValid: false,
      message: 'This directory is not a Git repository. Please run this command from within a Git repository.'
    };
  }

  try {
    // Check for staged changes
    const diff = await git.getStagedDiff();
    if (!diff) {
      // Get status to provide more helpful feedback
      const status = await git.getStatus();
      if (status.trim()) {
        return {
          isValid: false,
          message: 'No changes have been staged for commit. You have unstaged changes. Use "git add" to stage changes first.'
        };
      } else {
        return {
          isValid: false,
          message: 'No changes detected. There is nothing to commit.'
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      message: error instanceof Error ? error.message : 'Unknown git error occurred'
    };
  }
}
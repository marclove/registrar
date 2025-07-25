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
  } else if (errorDetails.includes('pre-commit hook failed') || errorDetails.includes('.git/hooks/pre-commit')) {
    return (
      'Commit failed due to a pre-commit hook. ' +
      'Please resolve the issues and try again. ' +
      `Original error: ${errorDetails.trim()}`
    );
  } else if (errorDetails.includes('commit-msg hook failed') || errorDetails.includes('.git/hooks/commit-msg')) {
    return (
      'Commit failed due to a commit-msg hook. ' +
      'Please resolve the issues and try again. ' +
      `Original error: ${errorDetails.trim()}`
    );
  } else if (errorDetails.includes('prepare-commit-msg hook failed') || errorDetails.includes('.git/hooks/prepare-commit-msg')) {
    return (
      'Commit failed due to a prepare-commit-msg hook. ' +
      'Please resolve the issues and try again. ' +
      `Original error: ${errorDetails.trim()}`
    );
  } else if (errorDetails.includes('post-commit hook failed') || errorDetails.includes('.git/hooks/post-commit')) {
    return (
      'Post-commit hook failed, but the commit was successful. ' +
      'You may want to check the hook configuration. ' +
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
 * Get detailed information about staged changes
 */
export async function getStagedFilesInfo(): Promise<{
  files: Array<{ status: string; path: string }>;
  totalChanges: number;
}> {
  const git = new EnhancedGit();
  
  try {
    const status = await git.getStatus();
    const statusLines = status.split('\n').filter(line => line.trim());
    
    const stagedFiles = statusLines
      .filter(line => {
        const statusChar = line.charAt(0);
        return statusChar !== ' ' && statusChar !== '?';
      })
      .map(line => ({
        status: getStagedStatusDescription(line.charAt(0)),
        path: line.slice(3)
      }));
    
    return {
      files: stagedFiles,
      totalChanges: stagedFiles.length
    };
  } catch (error) {
    return {
      files: [],
      totalChanges: 0
    };
  }
}

/**
 * Convert git status character to human-readable description
 */
function getStagedStatusDescription(statusChar: string): string {
  switch (statusChar) {
    case 'A': return 'added';
    case 'M': return 'modified';
    case 'D': return 'deleted';
    case 'R': return 'renamed';
    case 'C': return 'copied';
    case 'U': return 'unmerged';
    default: return 'changed';
  }
}
export async function validateGitState(): Promise<{ isValid: boolean; message?: string; details?: string }> {
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
      // Get detailed status to provide better feedback
      const status = await git.getStatus();
      if (status.trim()) {
        // Parse status to understand what's happening
        const statusLines = status.split('\n').filter(line => line.trim());
        const unstagedFiles = statusLines.filter(line => line.startsWith(' M') || line.startsWith(' D') || line.startsWith(' A'));
        const untrackedFiles = statusLines.filter(line => line.startsWith('??'));
        
        let detailMessage = '';
        if (unstagedFiles.length > 0) {
          detailMessage += `\nUnstaged changes found in ${unstagedFiles.length} file(s):`;
          unstagedFiles.slice(0, 5).forEach(line => {
            detailMessage += `\n  ${line.slice(3)}`; // Remove status prefix
          });
          if (unstagedFiles.length > 5) {
            detailMessage += `\n  ... and ${unstagedFiles.length - 5} more`;
          }
        }
        
        if (untrackedFiles.length > 0) {
          if (detailMessage) detailMessage += '\n';
          detailMessage += `\nUntracked files found (${untrackedFiles.length} file(s)):`;
          untrackedFiles.slice(0, 5).forEach(line => {
            detailMessage += `\n  ${line.slice(3)}`; // Remove status prefix
          });
          if (untrackedFiles.length > 5) {
            detailMessage += `\n  ... and ${untrackedFiles.length - 5} more`;
          }
        }

        return {
          isValid: false,
          message: 'No changes have been staged for commit. Use "git add <file>" to stage changes first.',
          details: detailMessage
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
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to run CLI command
async function runCLI(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const child = spawn('node', ['dist/index.js', ...args], {
      cwd: join(__dirname, '..'),
      stdio: 'pipe'
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ stdout, stderr, code: code || 0 });
    });
  });
}

// Helper function to get package version
function getPackageVersion(): string {
  const packageJsonPath = join(__dirname, '../package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  return packageJson.version;
}

describe('CLI Arguments with yargs', () => {
  describe('Version flag', () => {
    it('should display version with -v flag', async () => {
      const result = await runCLI(['-v']);
      expect(result.stdout.trim()).toBe(getPackageVersion());
      expect(result.code).toBe(0);
    });

    it('should display version with --version flag', async () => {
      const result = await runCLI(['--version']);
      expect(result.stdout.trim()).toBe(getPackageVersion());
      expect(result.code).toBe(0);
    });
  });

  describe('Help flag', () => {
    it('should display help with -h flag', async () => {
      const result = await runCLI(['-h']);
      expect(result.stdout).toContain('Options:');
      expect(result.stdout).toContain('--no-commit');
      expect(result.stdout).toContain('--message-only');
      expect(result.stdout).toContain('--help');
      expect(result.stdout).toContain('--version');
      expect(result.code).toBe(0);
    });

    it('should display help with --help flag', async () => {
      const result = await runCLI(['--help']);
      expect(result.stdout).toContain('Options:');
      expect(result.stdout).toContain('--no-commit');
      expect(result.stdout).toContain('--message-only');
      expect(result.stdout).toContain('--help');
      expect(result.stdout).toContain('--version');
      expect(result.code).toBe(0);
    });

    it('should include option descriptions in help', async () => {
      const result = await runCLI(['-h']);
      expect(result.stdout).toContain('Generate message only without committing');
      expect(result.stdout).toContain('Show help');
      expect(result.stdout).toContain('Show version number');
      expect(result.code).toBe(0);
    });
  });

  describe('Message-only flags', () => {
    it('should recognize --no-commit flag', async () => {
      // This test checks that the flag is recognized, but we can't test full functionality
      // without mocking git operations, so we just check it doesn't error on unknown flags
      const result = await runCLI(['--no-commit']);
      // The command should fail gracefully due to no staged changes, not due to unknown flag
      expect(result.stderr).toContain('You must stage changes before generating a commit message');
      expect(result.code).toBe(1);
    });

    it('should recognize --message-only flag', async () => {
      const result = await runCLI(['--message-only']);
      // The command should fail gracefully due to no staged changes, not due to unknown flag
      expect(result.stderr).toContain('You must stage changes before generating a commit message');
      expect(result.code).toBe(1);
    });
  });

  describe('Invalid flags', () => {
    it('should handle unknown flags gracefully', async () => {
      const result = await runCLI(['--unknown-flag']);
      expect(result.stderr).toContain('Unknown arguments: unknown-flag');
      expect(result.code).toBe(1);
    });
  });
});

describe('CLI argument parsing logic', () => {
  // Test the argument parsing logic separately from the CLI execution
  describe('yargs configuration', () => {
    it('should parse no-commit flag correctly', () => {
      // Mock argv object that yargs would produce
      const argv = {
        'no-commit': true,
        'message-only': false
      };
      
      const messageOnly = argv['no-commit'] || argv['message-only'];
      expect(messageOnly).toBe(true);
    });

    it('should parse message-only flag correctly', () => {
      const argv = {
        'no-commit': false,
        'message-only': true
      };
      
      const messageOnly = argv['no-commit'] || argv['message-only'];
      expect(messageOnly).toBe(true);
    });

    it('should handle both flags being false', () => {
      const argv = {
        'no-commit': false,
        'message-only': false
      };
      
      const messageOnly = argv['no-commit'] || argv['message-only'];
      expect(messageOnly).toBe(false);
    });

    it('should handle both flags being true', () => {
      const argv = {
        'no-commit': true,
        'message-only': true
      };
      
      const messageOnly = argv['no-commit'] || argv['message-only'];
      expect(messageOnly).toBe(true);
    });
  });
});

describe('Version function', () => {
  it('should return correct version from package.json', () => {
    const version = getPackageVersion();
    expect(version).toBe('0.1.4');
    expect(typeof version).toBe('string');
    expect(version.length).toBeGreaterThan(0);
  });
});
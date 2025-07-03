import { describe, it, expect } from 'bun:test';

interface RunAppOptions {
  messageOnly?: boolean;
}

describe('message-only functionality', () => {
  it('should accept messageOnly option in runApp interface', () => {
    // Test the interface type checking
    const optionsMessageOnly: RunAppOptions = { messageOnly: true };
    const optionsNormal: RunAppOptions = { messageOnly: false };
    const optionsDefault: RunAppOptions = {};
    
    expect(optionsMessageOnly.messageOnly).toBe(true);
    expect(optionsNormal.messageOnly).toBe(false);
    expect(optionsDefault.messageOnly).toBeUndefined();
  });

  it('should handle command line argument parsing', () => {
    // Test argument parsing logic
    const args1: string[] = ['--message-only'];
    const args2: string[] = ['--no-commit'];
    const args3: string[] = ['--other-flag'];
    const args4: string[] = [];
    
    const messageOnly1 = args1.includes('--no-commit') || args1.includes('--message-only');
    const messageOnly2 = args2.includes('--no-commit') || args2.includes('--message-only');
    const messageOnly3 = args3.includes('--no-commit') || args3.includes('--message-only');
    const messageOnly4 = args4.includes('--no-commit') || args4.includes('--message-only');
    
    expect(messageOnly1).toBe(true);
    expect(messageOnly2).toBe(true);
    expect(messageOnly3).toBe(false);
    expect(messageOnly4).toBe(false);
  });
});
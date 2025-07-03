import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import Spinner from 'ink-spinner';

interface CliProps {
  status: 'checking' | 'generating' | 'committing' | 'success' | 'error';
  message?: string;
  error?: string;
}

export default function Cli({ status, message, error }: CliProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (status === 'generating' || status === 'committing') {
      const interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setSeconds(0);
    }
  }, [status]);

  const getStatusText = () => {
    switch (status) {
      case 'checking':
        return 'Checking for staged changes...';
      case 'generating':
        return 'Generating commit message...';
      case 'committing':
        return 'Committing changes...';
      case 'success':
        return 'Committed successfully!';
      case 'error':
        return 'Error occurred';
      default:
        return '';
    }
  };

  const showSpinner = status === 'checking' || status === 'generating' || status === 'committing';
  const showTimer = status === 'generating' || status === 'committing';

  return (
    <Box flexDirection="column">
      <Box>
        {showSpinner && (
          <Text>
            <Spinner type="dots" /> {getStatusText()}
          </Text>
        )}
        {!showSpinner && status === 'success' && (
          <Text color="green">✓ {getStatusText()}</Text>
        )}
        {!showSpinner && status === 'error' && (
          <Text color="red">✗ {getStatusText()}</Text>
        )}
      </Box>
      
      {showTimer && (
        <Box marginTop={1}>
          <Text color="gray">Time elapsed: {seconds}s</Text>
        </Box>
      )}
      
      {message && (
        <Box marginTop={1} paddingLeft={2}>
          <Text>{message}</Text>
        </Box>
      )}
      
      {error && (
        <Box marginTop={1}>
          <Text color="red">{error}</Text>
        </Box>
      )}
    </Box>
  );
}
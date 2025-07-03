import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { useEffect, useState } from 'react';

interface CliProps {
  status: 'checking' | 'generating' | 'retrying' | 'committing' | 'success' | 'error';
  message?: string;
  error?: string;
  attempt?: number;
  maxAttempts?: number;
}

export default function Cli({ status, message, error, attempt, maxAttempts }: CliProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (status === 'generating' || status === 'retrying' || status === 'committing') {
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
      case 'retrying':
        return `Retrying commit message generation (attempt ${attempt}/${maxAttempts})...`;
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

  const showSpinner = status === 'checking' || status === 'generating' || status === 'retrying' || status === 'committing';
  const showTimer = status === 'generating' || status === 'retrying' || status === 'committing';

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

      {status === 'retrying' && attempt && maxAttempts && (
        <Box marginTop={1}>
          <Text color="yellow">
            Previous attempt failed. Retrying... ({attempt - 1} failed attempts)
          </Text>
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

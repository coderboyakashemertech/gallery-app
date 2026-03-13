import React from 'react';
import { HelperText } from 'react-native-paper';

type Props = {
  message?: string | null;
};

export function FormMessage({ message }: Props) {
  if (!message) {
    return null;
  }

  return <HelperText type="error">{message}</HelperText>;
}

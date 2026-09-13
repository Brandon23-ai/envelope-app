import { useState } from 'react';
import { Pressable, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { TextField } from './TextField';

interface PasswordFieldProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label: string;
  error?: string;
}

export function PasswordField({ label, error, ...inputProps }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <TextField
      label={label}
      error={error}
      secureTextEntry={!isVisible}
      autoCapitalize="none"
      rightAccessory={
        <Pressable onPress={() => setIsVisible((prev) => !prev)} hitSlop={12}>
          <Ionicons name={isVisible ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
        </Pressable>
      }
      {...inputProps}
    />
  );
}

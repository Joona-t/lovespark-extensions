import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { DEBOUNCE_SEARCH } from '../../lib/constants';

interface Props {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = 'Search notes...' }: Props) {
  const { theme } = useTheme();
  const [value, setValue] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSearch = useCallback((q: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onSearch(q), DEBOUNCE_SEARCH);
  }, [onSearch]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.glass, borderColor: theme.glassBorder, borderRadius: theme.radiusSm }]}>
      <Text style={[styles.icon, { color: theme.textMuted }]}>🔍</Text>
      <TextInput
        style={[styles.input, { color: theme.textDark }]}
        value={value}
        onChangeText={(v) => { setValue(v); debouncedSearch(v); }}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Search notes"
      />
      {value.length > 0 && (
        <Pressable
          onPress={handleClear}
          accessibilityLabel="Clear search"
          hitSlop={8}
        >
          <Text style={[styles.clear, { color: theme.textMuted }]}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    minHeight: 44,
    gap: 8,
  },
  icon: {
    fontSize: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
  },
  clear: {
    fontSize: 16,
    padding: 4,
  },
});

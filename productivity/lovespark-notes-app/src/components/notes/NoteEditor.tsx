import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TextInput, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Sparky } from '../ui/Sparky';
import { DEBOUNCE_SAVE, MAX_TITLE_LENGTH } from '../../lib/constants';

interface Props {
  initialTitle: string;
  initialContent: string;
  onChangeTitle: (title: string) => void;
  onChangeContent: (content: string) => void;
  autoFocus?: boolean;
  children?: React.ReactNode; // TagBar slot
}

export function NoteEditor({ initialTitle, initialContent, onChangeTitle, onChangeContent, autoFocus, children }: Props) {
  const { theme } = useTheme();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const titleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<TextInput>(null);

  const debouncedSaveTitle = useCallback((value: string) => {
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => onChangeTitle(value), DEBOUNCE_SAVE);
  }, [onChangeTitle]);

  const debouncedSaveContent = useCallback((value: string) => {
    if (contentTimer.current) clearTimeout(contentTimer.current);
    contentTimer.current = setTimeout(() => onChangeContent(value), DEBOUNCE_SAVE);
  }, [onChangeContent]);

  useEffect(() => {
    return () => {
      // Flush pending saves on unmount
      if (titleTimer.current) {
        clearTimeout(titleTimer.current);
        onChangeTitle(title);
      }
      if (contentTimer.current) {
        clearTimeout(contentTimer.current);
        onChangeContent(content);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView style={styles.scroll} keyboardDismissMode="interactive">
        <TextInput
          style={[styles.titleInput, { color: theme.textDark, borderBottomColor: theme.glassBorder }]}
          value={title}
          onChangeText={(v) => { setTitle(v); debouncedSaveTitle(v); }}
          placeholder="Title"
          placeholderTextColor={theme.textMuted}
          maxLength={MAX_TITLE_LENGTH}
          accessibilityLabel="Note title"
        />

        {children}

        <TextInput
          ref={contentRef}
          style={[styles.contentInput, { color: theme.textDark }]}
          value={content}
          onChangeText={(v) => { setContent(v); debouncedSaveContent(v); }}
          placeholder="Start writing..."
          placeholderTextColor={theme.textMuted}
          multiline
          textAlignVertical="top"
          scrollEnabled={false}
          autoFocus={autoFocus}
          accessibilityLabel="Note content"
        />
        <View style={styles.sparkyFooter}>
          <Sparky size={32} style={{ opacity: 0.5 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    padding: 16,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '700',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  contentInput: {
    fontSize: 15,
    lineHeight: 24,
    minHeight: 200,
  },
  sparkyFooter: {
    alignItems: 'center',
    paddingVertical: 32,
  },
});

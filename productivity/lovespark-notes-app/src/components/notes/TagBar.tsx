import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useTagStore } from '../../stores/tagStore';
import { getDefaultTagColour, sanitizeTag } from '../../lib/formatters';
import { lightTap } from '../../utils/haptics';

interface Props {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export function TagBar({ tags, onAddTag, onRemoveTag }: Props) {
  const { theme } = useTheme();
  const tagDefs = useTagStore(s => s.tags);
  const getOrCreateTag = useTagStore(s => s.getOrCreateTag);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = () => {
    const clean = sanitizeTag(inputValue);
    if (clean && !tags.includes(clean)) {
      getOrCreateTag(clean);
      onAddTag(clean);
    }
    setInputValue('');
    setInputVisible(false);
  };

  return (
    <View style={styles.container}>
      {tags.map(tag => {
        const colour = tagDefs.find(t => t.name === tag)?.colour || getDefaultTagColour(tag).color;
        return (
          <View key={tag} style={[styles.chip, { backgroundColor: colour + '22', borderRadius: theme.radiusSm }]}>
            <Text style={[styles.chipText, { color: colour }]}>#{tag}</Text>
            <Pressable
              onPress={() => { lightTap(); onRemoveTag(tag); }}
              accessibilityLabel={`Remove tag ${tag}`}
              hitSlop={8}
            >
              <Text style={[styles.remove, { color: colour }]}>×</Text>
            </Pressable>
          </View>
        );
      })}

      {inputVisible ? (
        <TextInput
          style={[styles.input, { color: theme.textDark, borderColor: theme.glassBorder, borderRadius: theme.radiusSm }]}
          value={inputValue}
          onChangeText={setInputValue}
          onSubmitEditing={handleSubmit}
          onBlur={() => { if (!inputValue) setInputVisible(false); }}
          placeholder="tag name"
          placeholderTextColor={theme.textMuted}
          maxLength={20}
          autoFocus
          autoCapitalize="none"
          returnKeyType="done"
        />
      ) : (
        <Pressable
          onPress={() => { lightTap(); setInputVisible(true); }}
          accessibilityLabel="Add tag"
          style={[styles.addBtn, { borderColor: theme.glassBorder, borderRadius: theme.radiusSm }]}
        >
          <Text style={[styles.addText, { color: theme.textMuted }]}>+ tag</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
    minHeight: 32,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  remove: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 2,
  },
  addBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingHorizontal: 10,
    paddingVertical: 4,
    minHeight: 32,
    justifyContent: 'center',
  },
  addText: {
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    minWidth: 80,
    minHeight: 32,
  },
});

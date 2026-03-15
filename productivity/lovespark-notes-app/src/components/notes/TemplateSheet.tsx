import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useProStore } from '../../stores/proStore';
import { TEMPLATES } from '../../lib/constants';
import { ProBadge } from '../ui/ProBadge';
import { lightTap } from '../../utils/haptics';
import { formatToday } from '../../lib/formatters';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (content: string, title: string) => void;
}

export function TemplateSheet({ visible, onClose, onSelect }: Props) {
  const { theme } = useTheme();
  const isPro = useProStore(s => s.isPro);

  const handleSelect = (template: typeof TEMPLATES[0]) => {
    if (template.pro && !isPro) return;
    const content = template.content.replace(/\{\{date\}\}/g, formatToday());
    lightTap();
    onSelect(content, template.label);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.glassStrong,
              borderColor: theme.glassBorder,
              borderTopLeftRadius: theme.radius,
              borderTopRightRadius: theme.radius,
            },
          ]}
        >
          <View style={styles.handle} />
          <Text style={[styles.heading, { color: theme.textDark }]}>
            Choose a template
          </Text>
          {TEMPLATES.map(t => {
            const locked = t.pro && !isPro;
            return (
              <Pressable
                key={t.id}
                onPress={() => handleSelect(t)}
                disabled={locked}
                style={({ pressed }) => [
                  styles.option,
                  {
                    borderRadius: theme.radiusSm,
                    opacity: locked ? 0.5 : pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={styles.emoji}>{t.emoji}</Text>
                <Text style={[styles.label, { color: theme.textDark }]}>{t.label}</Text>
                {locked && <ProBadge />}
              </Pressable>
            );
          })}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    marginBottom: 16,
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
    minHeight: 44,
  },
  emoji: {
    fontSize: 20,
  },
  label: {
    fontSize: 15,
    flex: 1,
  },
});

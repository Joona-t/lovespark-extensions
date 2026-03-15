import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { FAB } from '../../src/components/ui/FAB';
import { TemplateSheet } from '../../src/components/notes/TemplateSheet';
import { useNotesStore } from '../../src/stores/notesStore';
import { useNoteLimit } from '../../src/hooks/useNoteLimit';
import { successNotification, warningNotification } from '../../src/utils/haptics';

export default function TabsLayout() {
  const { theme } = useTheme();
  const router = useRouter();
  const createNote = useNotesStore(s => s.createNote);
  const { canCreate } = useNoteLimit();
  const [templateVisible, setTemplateVisible] = useState(false);

  const handleNewNote = useCallback(() => {
    if (!canCreate) {
      warningNotification();
      setTemplateVisible(true);
      return;
    }
    const note = createNote();
    successNotification();
    router.push(`/note/${note.id}`);
  }, [canCreate, createNote, router]);

  const handleTemplateSelect = useCallback((content: string, title: string) => {
    if (!canCreate) return;
    const note = createNote({ title, content });
    successNotification();
    router.push(`/note/${note.id}`);
  }, [canCreate, createNote, router]);

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.pinkAccent,
          tabBarInactiveTintColor: theme.textMuted,
          tabBarStyle: {
            backgroundColor: theme.glassStrong,
            borderTopColor: theme.glassBorder,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '500',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Notes',
            tabBarIcon: () => <Text style={styles.tabIcon}>📝</Text>,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: () => <Text style={styles.tabIcon}>🔍</Text>,
          }}
        />
        <Tabs.Screen
          name="tags"
          options={{
            title: 'Tags',
            tabBarIcon: () => <Text style={styles.tabIcon}>🏷</Text>,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: () => <Text style={styles.tabIcon}>⚙️</Text>,
          }}
        />
      </Tabs>

      <FAB
        onPress={handleNewNote}
        onLongPress={() => setTemplateVisible(true)}
      />

      <TemplateSheet
        visible={templateVisible}
        onClose={() => setTemplateVisible(false)}
        onSelect={handleTemplateSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabIcon: {
    fontSize: 20,
  },
});

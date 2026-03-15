import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { DMMono_400Regular } from '@expo-google-fonts/dm-mono';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { AtkinsonHyperlegible_400Regular } from '@expo-google-fonts/atkinson-hyperlegible';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { ProProvider } from '../src/pro/ProProvider';
import { useThemeStore } from '../src/stores/themeStore';
import { useNotesStore } from '../src/stores/notesStore';
import { usePrefsStore } from '../src/stores/prefsStore';
import { WELCOME_NOTE } from '../src/lib/constants';

SplashScreen.preventAutoHideAsync();

function WelcomeSeeder() {
  const hasSeenWelcome = usePrefsStore(s => s.hasSeenWelcome);
  const setHasSeenWelcome = usePrefsStore(s => s.setHasSeenWelcome);
  const createNote = useNotesStore(s => s.createNote);
  const noteCount = useNotesStore(s => s.notes.length);

  useEffect(() => {
    if (!hasSeenWelcome && noteCount === 0) {
      createNote({
        title: WELCOME_NOTE.title,
        content: WELCOME_NOTE.content,
        tags: WELCOME_NOTE.tags,
      });
      setHasSeenWelcome(true);
    }
  }, [hasSeenWelcome, noteCount, createNote, setHasSeenWelcome]);

  return null;
}

function GarbageCollector() {
  const gc = useNotesStore(s => s.garbageCollect);
  useEffect(() => { gc(); }, [gc]);
  return null;
}

export default function RootLayout() {
  const themeId = useThemeStore(s => s.themeId);

  const [fontsLoaded] = useFonts({
    DMMono: DMMono_400Regular,
    PressStart2P: PressStart2P_400Regular,
    Atkinson: AtkinsonHyperlegible_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  const isDark = themeId === 'dark' || themeId === 'slate';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ProProvider>
          <WelcomeSeeder />
          <GarbageCollector />
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="note/[id]"
              options={{ presentation: 'card', animation: 'slide_from_right' }}
            />
          </Stack>
        </ProProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

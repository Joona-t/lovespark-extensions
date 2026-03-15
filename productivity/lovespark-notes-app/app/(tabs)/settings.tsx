import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Linking } from 'react-native';
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper';
import { GlassCard } from '../../src/components/layout/GlassCard';
import { Sparky } from '../../src/components/ui/Sparky';
import { ThemeDropdown } from '../../src/components/ui/ThemeDropdown';
import { PinkButton } from '../../src/components/ui/PinkButton';
import { ProBadge } from '../../src/components/ui/ProBadge';
import { ProGate } from '../../src/components/ui/ProGate';
import { useTheme } from '../../src/theme/ThemeProvider';
import { usePrefsStore } from '../../src/stores/prefsStore';
import { useNotesStore } from '../../src/stores/notesStore';
import { useProStore } from '../../src/stores/proStore';
import { FONTS, type ContentFont } from '../../src/lib/constants';
import { exportNotesAsJSON } from '../../src/utils/export';
import { lightTap } from '../../src/utils/haptics';

export default function SettingsScreen() {
  const { theme } = useTheme();
  const contentFont = usePrefsStore(s => s.contentFont);
  const setContentFont = usePrefsStore(s => s.setContentFont);
  const sortOrder = usePrefsStore(s => s.sortOrder);
  const setSortOrder = usePrefsStore(s => s.setSortOrder);
  const dailyMode = usePrefsStore(s => s.dailyMode);
  const setDailyMode = usePrefsStore(s => s.setDailyMode);
  const notes = useNotesStore(s => s.notes);
  const isPro = useProStore(s => s.isPro);

  const handleExport = async () => {
    await exportNotesAsJSON(notes);
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Sparky size={36} />
          <Text style={[styles.title, { color: theme.titleColor || theme.textDark }]}>
            Settings
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Theme */}
        <GlassCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.textDark }]}>Theme</Text>
          <ThemeDropdown />
        </GlassCard>

        {/* Font */}
        <GlassCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.textDark }]}>Content Font</Text>
          <View style={styles.optionRow}>
            {FONTS.map(f => {
              const locked = f.pro && !isPro;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => {
                    if (locked) return;
                    lightTap();
                    setContentFont(f.id);
                  }}
                  style={[
                    styles.fontOption,
                    {
                      backgroundColor: contentFont === f.id ? theme.pinkAccent + '22' : 'transparent',
                      borderColor: contentFont === f.id ? theme.pinkAccent : theme.glassBorder,
                      borderRadius: theme.radiusSm,
                      opacity: locked ? 0.5 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.fontLabel, { color: contentFont === f.id ? theme.pinkAccent : theme.textDark }]}>
                    {f.label}
                  </Text>
                  {locked && <ProBadge />}
                </Pressable>
              );
            })}
          </View>
        </GlassCard>

        {/* Sort Order */}
        <GlassCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.textDark }]}>Sort Notes By</Text>
          <View style={styles.optionRow}>
            {([['updatedAt', 'Last Modified'], ['createdAt', 'Date Created'], ['title', 'Title']] as const).map(([id, label]) => (
              <Pressable
                key={id}
                onPress={() => { lightTap(); setSortOrder(id); }}
                style={[
                  styles.fontOption,
                  {
                    backgroundColor: sortOrder === id ? theme.pinkAccent + '22' : 'transparent',
                    borderColor: sortOrder === id ? theme.pinkAccent : theme.glassBorder,
                    borderRadius: theme.radiusSm,
                  },
                ]}
              >
                <Text style={[styles.fontLabel, { color: sortOrder === id ? theme.pinkAccent : theme.textDark }]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </GlassCard>

        {/* Daily Brain Dump Mode */}
        <GlassCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.textDark }]}>Daily Brain Dump</Text>
          <View style={styles.optionRow}>
            {([['blank', 'Blank'], ['structured', 'Structured']] as const).map(([id, label]) => (
              <Pressable
                key={id}
                onPress={() => { lightTap(); setDailyMode(id); }}
                style={[
                  styles.fontOption,
                  {
                    backgroundColor: dailyMode === id ? theme.pinkAccent + '22' : 'transparent',
                    borderColor: dailyMode === id ? theme.pinkAccent : theme.glassBorder,
                    borderRadius: theme.radiusSm,
                  },
                ]}
              >
                <Text style={[styles.fontLabel, { color: dailyMode === id ? theme.pinkAccent : theme.textDark }]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </GlassCard>

        {/* Export */}
        <GlassCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.textDark }]}>Export</Text>
          <ProGate fallbackMessage="Export all notes as JSON">
            <PinkButton title="Export Notes (JSON)" onPress={handleExport} />
          </ProGate>
        </GlassCard>

        {/* Sync */}
        <GlassCard style={styles.card}>
          <View style={styles.syncRow}>
            <Text style={[styles.sectionTitle, { color: theme.textDark }]}>iCloud Sync</Text>
            <ProBadge />
          </View>
          <Text style={[styles.comingSoon, { color: theme.textMuted }]}>
            Coming soon — sync notes across all your devices.
          </Text>
        </GlassCard>

        {/* About */}
        <GlassCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.textDark }]}>About</Text>
          <Text style={[styles.aboutText, { color: theme.textMuted }]}>
            LoveSpark Notes v1.0.0{'\n'}
            Free, open-source, privacy-first.{'\n'}
            No ads. No tracking. Your notes stay on your device.
          </Text>
          <View style={{ marginTop: 12 }}>
            <PinkButton
              title="Support on Ko-fi ☕"
              variant="secondary"
              onPress={() => Linking.openURL('https://ko-fi.com/lovespark')}
            />
          </View>
        </GlassCard>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 12,
  },
  card: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fontOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    gap: 6,
    minHeight: 44,
  },
  fontLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  comingSoon: {
    fontSize: 13,
    lineHeight: 18,
  },
  aboutText: {
    fontSize: 13,
    lineHeight: 20,
  },
});

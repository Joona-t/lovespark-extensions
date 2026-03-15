import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { NoteEntry } from '../lib/constants';
import { storage } from '../stores/mmkv';

interface ExportedNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  wordCount: number;
  createdAt: number;
  updatedAt: number;
}

export async function exportNotesAsJSON(notes: NoteEntry[]): Promise<void> {
  const exported: ExportedNote[] = notes
    .filter(n => !n.deletedAt)
    .map(n => ({
      id: n.id,
      title: n.title,
      content: storage.getString('note_' + n.id) || '',
      tags: n.tags,
      pinned: n.pinned,
      wordCount: n.wordCount,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    }));

  const json = JSON.stringify(exported, null, 2);
  const filename = `lovespark-notes-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File(Paths.cache, filename);
  file.write(json);

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Export Notes',
  });
}

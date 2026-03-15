import { useNotesStore } from '../stores/notesStore';
import { useProStore } from '../stores/proStore';
import { MAX_FREE_NOTES } from '../lib/constants';

export function useNoteLimit() {
  const activeCount = useNotesStore(s => s.activeNoteCount());
  const isPro = useProStore(s => s.isPro);

  return {
    canCreate: isPro || activeCount < MAX_FREE_NOTES,
    activeCount,
    limit: MAX_FREE_NOTES,
    isPro,
  };
}

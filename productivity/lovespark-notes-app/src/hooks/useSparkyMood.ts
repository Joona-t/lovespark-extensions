import { useState, useEffect, useRef } from 'react';
import { randomMessage } from '../lib/formatters';
import { MESSAGES, CELEBRATE_MESSAGES, UPSELL_MESSAGES } from '../lib/constants';
import { useNotesStore } from '../stores/notesStore';

export type SparkyMood = 'idle' | 'celebrate' | 'encourage' | 'upsell';

interface SparkyState {
  mood: SparkyMood;
  message: string;
}

export function useSparkyMood(): SparkyState {
  const noteCount = useNotesStore(s => s.activeNoteCount());
  const prevCount = useRef(noteCount);
  const [state, setState] = useState<SparkyState>({
    mood: 'idle',
    message: randomMessage(MESSAGES),
  });

  // Celebrate milestones
  useEffect(() => {
    if (noteCount > prevCount.current) {
      const milestones = [1, 5, 10, 50];
      if (milestones.includes(noteCount)) {
        const idx = milestones.indexOf(noteCount);
        setState({
          mood: 'celebrate',
          message: CELEBRATE_MESSAGES[idx] || randomMessage(CELEBRATE_MESSAGES),
        });
        const timer = setTimeout(() => {
          setState({ mood: 'idle', message: randomMessage(MESSAGES) });
        }, 4000);
        prevCount.current = noteCount;
        return () => clearTimeout(timer);
      }
    }
    prevCount.current = noteCount;
  }, [noteCount]);

  // Rotate idle messages every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        if (prev.mood !== 'idle') return prev;
        return { mood: 'idle', message: randomMessage(MESSAGES) };
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return state;
}

export function getUpsellMessage(): string {
  return randomMessage(UPSELL_MESSAGES);
}

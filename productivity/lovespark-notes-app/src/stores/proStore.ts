import { create } from 'zustand';

interface ProState {
  isPro: boolean;
  isLoading: boolean;
  setIsPro: (isPro: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useProStore = create<ProState>()((set) => ({
  isPro: false,
  isLoading: true,
  setIsPro: (isPro) => set({ isPro }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));

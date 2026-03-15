import React, { useEffect } from 'react';
import { useProStore } from '../stores/proStore';

// RevenueCat initialization — configure with actual API key before release
const REVENUECAT_API_KEY = '__REPLACE_WITH_REVENUECAT_KEY__';

export function ProProvider({ children }: { children: React.ReactNode }) {
  const setIsPro = useProStore(s => s.setIsPro);
  const setIsLoading = useProStore(s => s.setIsLoading);

  useEffect(() => {
    async function initPurchases() {
      try {
        const Purchases = require('react-native-purchases').default;
        await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        const info = await Purchases.getCustomerInfo();
        const isPro = info.entitlements.active['ls_notes_pro'] !== undefined;
        setIsPro(isPro);
      } catch {
        // RevenueCat not configured yet — default to free
        setIsPro(false);
      } finally {
        setIsLoading(false);
      }
    }
    initPurchases();
  }, [setIsPro, setIsLoading]);

  return <>{children}</>;
}

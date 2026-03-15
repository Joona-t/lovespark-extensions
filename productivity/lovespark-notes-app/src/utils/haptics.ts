import * as Haptics from 'expo-haptics';

export function lightTap(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function mediumTap(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function heavyTap(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

export function successNotification(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function warningNotification(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

export function selectionTap(): void {
  Haptics.selectionAsync();
}

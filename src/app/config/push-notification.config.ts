// Push Notification Configuration
// This file contains configuration for push notification endpoints

export interface PushNotificationConfig {
  enabled: boolean;
  debug: boolean;
  localTestMode: boolean;
}

// Default configuration
const defaultConfig: PushNotificationConfig = {
  enabled: true,
  debug: true,
  localTestMode: true
};

// Load from localStorage if available
function loadConfig(): PushNotificationConfig {
  try {
    const stored = localStorage.getItem('pushNotificationConfig');
    if (stored) {
      return { ...defaultConfig, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load push notification config:', error);
  }
  return defaultConfig;
}

// Save to localStorage
export function savePushNotificationConfig(config: Partial<PushNotificationConfig>): void {
  try {
    const current = loadConfig();
    const updated = { ...current, ...config };
    localStorage.setItem('pushNotificationConfig', JSON.stringify(updated));
    
    // Update the exported config
    Object.assign(pushNotificationConfig, updated);
    
    console.log('Push notification config saved:', updated);
  } catch (error) {
    console.error('Failed to save push notification config:', error);
  }
}

// Export the config
export const pushNotificationConfig = loadConfig();

// Helper functions
export function isPushNotificationEnabled(): boolean {
  return pushNotificationConfig.enabled;
}

export function isLocalTestMode(): boolean {
  return pushNotificationConfig.localTestMode;
}

export function togglePushNotifications(enabled: boolean): void {
  savePushNotificationConfig({ enabled });
}

export function toggleLocalTestMode(localTestMode: boolean): void {
  savePushNotificationConfig({ localTestMode });
}

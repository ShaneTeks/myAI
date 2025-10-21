/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#667eea';
const tintColorDark = '#764ba2';

export const Colors = {
  light: {
    text: '#1a1a1a',
    background: 'rgba(255, 255, 255, 0.1)',
    tint: tintColorLight,
    icon: '#667eea',
    tabIconDefault: 'rgba(255, 255, 255, 0.6)',
    tabIconSelected: '#fff',
    glass: 'rgba(255, 255, 255, 0.1)',
    glassBorder: 'rgba(255, 255, 255, 0.2)',
    shadow: 'rgba(31, 38, 135, 0.37)',
    gradientStart: '#667eea',
    gradientEnd: '#764ba2',
    inputBackground: 'rgba(255, 255, 255, 0.1)',
    messageUser: 'rgba(102, 126, 234, 0.2)',
    messageAI: 'rgba(255, 255, 255, 0.1)',
  },
  dark: {
    text: '#ffffff',
    background: '#1a1a1a',
    tint: tintColorDark,
    icon: '#a0a0a0',
    tabIconDefault: 'rgba(255, 255, 255, 0.4)',
    tabIconSelected: '#fff',
    glass: 'rgba(255, 255, 255, 0.05)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    gradientStart: '#2c3e50',
    gradientEnd: '#1a1a1a',
    inputBackground: '#2a2a2a',
    messageUser: 'rgba(118, 75, 162, 0.3)',
    messageAI: 'rgba(255, 255, 255, 0.05)',
    chatInputBackground: '#2a2a2a',
    chatInputBorder: '#404040',
    chatInputText: '#ffffff',
    chatInputPlaceholder: '#888888',
    // Settings specific colors
    settingsBackground: '#1a1a1a',
    settingsItemBackground: '#2a2a2a',
    settingsItemBorder: '#404040',
    settingsSectionBorder: '#404040',
    // Button colors
    primaryButton: '#764ba2',
    secondaryButton: '#2a2a2a',
    dangerButton: '#ff4444',
    // Text colors
    buttonText: '#ffffff',
    iconText: '#ffffff',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const colors = Colors.dark;

  const settingsOptions = [
    {
      title: 'Appearance',
      subtitle: 'Theme and display settings',
      icon: 'paintbrush',
      onPress: () => Alert.alert('Appearance', 'Theme settings coming soon!'),
    },
    {
      title: 'Notifications',
      subtitle: 'Message and system notifications',
      icon: 'bell',
      onPress: () => Alert.alert('Notifications', 'Notification settings coming soon!'),
    },
    {
      title: 'Privacy & Security',
      subtitle: 'Data protection and security',
      icon: 'lock',
      onPress: () => Alert.alert('Privacy', 'Privacy settings coming soon!'),
    },
    {
      title: 'Storage',
      subtitle: 'Manage chat history and media',
      icon: 'folder',
      onPress: () => Alert.alert('Storage', 'Storage management coming soon!'),
    },
    {
      title: 'About',
      subtitle: 'App version and information',
      icon: 'info.circle',
      onPress: () => Alert.alert('About', 'AI Chat App v1.0.0\nBuilt with React Native & Expo'),
    },
  ];

  const renderSettingItem = (item: typeof settingsOptions[0], index: number) => (
    <TouchableOpacity
      key={index}
      style={[styles.settingItem, { backgroundColor: colors.glass }]}
      onPress={item.onPress}
    >
      <View style={styles.settingContent}>
        <View style={[styles.settingIcon, { backgroundColor: colors.tint }]}>
          <ThemedText style={styles.settingIconText}>{item.icon}</ThemedText>
        </View>
        <View style={styles.settingText}>
          <ThemedText style={[styles.settingTitle, { color: colors.text }]}>
            {item.title}
          </ThemedText>
          <ThemedText style={[styles.settingSubtitle, { color: colors.tabIconDefault }]}>
            {item.subtitle}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.gradientBackground}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.glass }]}>
          <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
            Settings
          </ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.tabIconDefault }]}>
            Customize your chat experience
          </ThemedText>
        </View>

        {/* Settings List */}
        <ScrollView
          style={styles.settingsContainer}
          contentContainerStyle={styles.settingsContent}
          showsVerticalScrollIndicator={false}
        >
          {settingsOptions.map(renderSettingItem)}

          {/* Version Info */}
          <View style={[styles.versionContainer, { backgroundColor: colors.glass }]}>
            <ThemedText style={[styles.versionText, { color: colors.tabIconDefault }]}>
              AI Chat App v1.0.0
            </ThemedText>
            <ThemedText style={[styles.versionText, { color: colors.tabIconDefault }]}>
              Powered by React Native & Expo
            </ThemedText>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  header: {
    margin: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  settingsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  settingsContent: {
    paddingBottom: 20,
  },
  settingItem: {
    marginVertical: 6,
    padding: 16,
    borderRadius: 16,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingIconText: {
    color: Colors.dark.iconText,
    fontSize: 20,
    fontWeight: 'bold',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  versionContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

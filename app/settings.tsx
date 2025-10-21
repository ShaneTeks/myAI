import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const router = useRouter();

  const settingsOptions = [
    {
      title: 'Personalize',
      subtitle: 'Customize AI behavior and responses',
      icon: '★',
      onPress: () => router.push('/personalize'),
    },
    {
      title: 'Appearance',
      subtitle: 'Theme and display settings',
      icon: '◐',
      onPress: () => Alert.alert('Appearance', 'Theme settings coming soon!'),
    },
    {
      title: 'Notifications',
      subtitle: 'Message and system notifications',
      icon: '◉',
      onPress: () => Alert.alert('Notifications', 'Notification settings coming soon!'),
    },
    {
      title: 'Privacy & Security',
      subtitle: 'Data protection and security',
      icon: '◈',
      onPress: () => Alert.alert('Privacy', 'Privacy settings coming soon!'),
    },
    {
      title: 'Storage',
      subtitle: 'Manage chat history and media',
      icon: '◫',
      onPress: () => Alert.alert('Storage', 'Storage management coming soon!'),
    },
    {
      title: 'About',
      subtitle: 'App version and information',
      icon: 'i',
      onPress: () => Alert.alert('About', 'AI Chat App v1.0.0\nBuilt with React Native & Expo'),
    },
  ];

  const renderSettingItem = (item: typeof settingsOptions[0], index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.settingItem}
      onPress={item.onPress}
    >
      <View style={styles.settingContent}>
        <View style={styles.settingIcon}>
          <Text style={styles.settingIconText}>{item.icon}</Text>
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Settings List */}
      <ScrollView style={styles.settingsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.settingsContent}>
          {settingsOptions.map(renderSettingItem)}

          {/* Version Info */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>AI Chat App v1.0.0</Text>
            <Text style={styles.versionSubtext}>Powered by React Native & Expo</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.settingsBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.settingsSectionBorder,
    backgroundColor: Colors.dark.settingsBackground,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 20,
    color: Colors.dark.text,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  settingsContainer: {
    flex: 1,
    backgroundColor: Colors.dark.settingsBackground,
  },
  settingsContent: {
    padding: 16,
  },
  settingItem: {
    backgroundColor: Colors.dark.settingsItemBackground,
    marginVertical: 4,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.settingsItemBorder,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.tint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingIconText: {
    color: Colors.dark.iconText,
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.dark.icon,
  },
  versionContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: Colors.dark.chatInputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.chatInputBorder,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    color: Colors.dark.text,
    fontWeight: '600',
  },
  versionSubtext: {
    fontSize: 12,
    color: Colors.dark.icon,
    marginTop: 4,
  },
});

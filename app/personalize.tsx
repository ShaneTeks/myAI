import { Colors } from '@/constants/theme';
import { personalizationService, PersonalizationSettings } from '@/lib/personalizationService';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PersonalizeScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<PersonalizationSettings | null>(null);
  const [systemInstruction, setSystemInstruction] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const currentSettings = await personalizationService.getSettings();
      setSettings(currentSettings);
      setSystemInstruction(currentSettings.systemInstruction);
    } catch (error) {
      console.error('Error loading personalization settings:', error);
      Alert.alert('Error', 'Failed to load personalization settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!systemInstruction.trim()) {
      Alert.alert('Error', 'System instruction cannot be empty');
      return;
    }

    setSaving(true);
    try {
      await personalizationService.updateSettings({
        systemInstruction: systemInstruction.trim(),
      });
      Alert.alert('Success', 'Personalization settings saved successfully');
    } catch (error) {
      console.error('Error saving personalization settings:', error);
      Alert.alert('Error', 'Failed to save personalization settings');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'Are you sure you want to reset all personalization settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await personalizationService.resetToDefaults();
              await loadSettings();
              Alert.alert('Success', 'Settings reset to defaults');
            } catch (error) {
              console.error('Error resetting settings:', error);
              Alert.alert('Error', 'Failed to reset settings');
            }
          },
        },
      ]
    );
  };

  const presetInstructions = [
    {
      name: 'Default Assistant',
      instruction: 'You are a helpful AI assistant. Be concise but helpful, and provide accurate information.',
    },
    {
      name: 'Creative Writer',
      instruction: 'You are a creative writing assistant. Help with storytelling, character development, and creative ideas. Be imaginative and inspiring.',
    },
    {
      name: 'Technical Expert',
      instruction: 'You are a technical expert assistant. Provide detailed, accurate technical information. Focus on code examples, best practices, and problem-solving.',
    },
    {
      name: 'Casual Friend',
      instruction: 'You are a friendly, casual conversationalist. Use a relaxed tone, be supportive, and engage in natural conversation like a good friend.',
    },
    {
      name: 'Professional Advisor',
      instruction: 'You are a professional business advisor. Provide structured, analytical responses with actionable insights and professional recommendations.',
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading personalization settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <View style={styles.backIcon}>
            <Text style={styles.backIconText}>←</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personalize</Text>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={saveSettings}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* System Instruction Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Instruction</Text>
          <Text style={styles.sectionDescription}>
            Customize how the AI assistant behaves and responds to your messages.
          </Text>
          
          <TextInput
            style={styles.textInput}
            value={systemInstruction}
            onChangeText={setSystemInstruction}
            placeholder="Enter your custom system instruction..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Preset Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Presets</Text>
          <Text style={styles.sectionDescription}>
            Choose from these preset personalities or use them as inspiration.
          </Text>
          
          {presetInstructions.map((preset, index) => (
            <TouchableOpacity
              key={index}
              style={styles.presetItem}
              onPress={() => setSystemInstruction(preset.instruction)}
            >
              <View style={styles.presetContent}>
                <Text style={styles.presetName}>{preset.name}</Text>
                <Text style={styles.presetDescription} numberOfLines={2}>
                  {preset.instruction}
                </Text>
              </View>
              <View style={styles.presetIcon}>
                <Text style={styles.presetIconText}>→</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Reset Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
            <View style={styles.resetIcon}>
              <Text style={styles.resetIconText}>↺</Text>
            </View>
            <Text style={styles.resetButtonText}>Reset to Defaults</Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.settingsBackground,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.dark.icon,
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
  backIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.dark.chatInputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIconText: {
    fontSize: 16,
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
  saveButton: {
    backgroundColor: Colors.dark.primaryButton,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.dark.icon,
  },
  saveButtonText: {
    color: Colors.dark.buttonText,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: Colors.dark.settingsBackground,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.settingsSectionBorder,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.dark.icon,
    marginBottom: 16,
    lineHeight: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.dark.chatInputBorder,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.dark.text,
    backgroundColor: Colors.dark.chatInputBackground,
    minHeight: 120,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.settingsItemBackground,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.dark.settingsItemBorder,
  },
  presetContent: {
    flex: 1,
  },
  presetName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  presetDescription: {
    fontSize: 14,
    color: Colors.dark.icon,
    lineHeight: 18,
  },
  presetIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.dark.tint,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  presetIconText: {
    color: Colors.dark.iconText,
    fontSize: 12,
    fontWeight: 'bold',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.chatInputBackground,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.chatInputBorder,
  },
  resetIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.dark.icon,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resetIconText: {
    color: Colors.dark.iconText,
    fontSize: 14,
    fontWeight: 'bold',
  },
  resetButtonText: {
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: '600',
  },
});
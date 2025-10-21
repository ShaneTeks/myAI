import AsyncStorage from '@react-native-async-storage/async-storage';

const SYSTEM_INSTRUCTION_KEY = 'system_instruction';
const DEFAULT_SYSTEM_INSTRUCTION = 'You are a helpful AI assistant. Be concise but helpful, and provide accurate information.';

export interface PersonalizationSettings {
  systemInstruction: string;
}

class PersonalizationService {
  private static instance: PersonalizationService;
  private settings: PersonalizationSettings | null = null;

  private constructor() {}

  static getInstance(): PersonalizationService {
    if (!PersonalizationService.instance) {
      PersonalizationService.instance = new PersonalizationService();
    }
    return PersonalizationService.instance;
  }

  async getSystemInstruction(): Promise<string> {
    try {
      const stored = await AsyncStorage.getItem(SYSTEM_INSTRUCTION_KEY);
      return stored || DEFAULT_SYSTEM_INSTRUCTION;
    } catch (error) {
      console.error('Error getting system instruction:', error);
      return DEFAULT_SYSTEM_INSTRUCTION;
    }
  }

  async setSystemInstruction(instruction: string): Promise<void> {
    try {
      await AsyncStorage.setItem(SYSTEM_INSTRUCTION_KEY, instruction);
      if (this.settings) {
        this.settings.systemInstruction = instruction;
      }
    } catch (error) {
      console.error('Error setting system instruction:', error);
      throw error;
    }
  }

  async getSettings(): Promise<PersonalizationSettings> {
    if (this.settings) {
      return this.settings;
    }

    const systemInstruction = await this.getSystemInstruction();
    this.settings = {
      systemInstruction,
    };

    return this.settings;
  }

  async updateSettings(newSettings: Partial<PersonalizationSettings>): Promise<void> {
    const currentSettings = await this.getSettings();
    const updatedSettings = { ...currentSettings, ...newSettings };

    if (newSettings.systemInstruction !== undefined) {
      await this.setSystemInstruction(newSettings.systemInstruction);
    }

    this.settings = updatedSettings;
  }

  async resetToDefaults(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SYSTEM_INSTRUCTION_KEY);
      this.settings = null;
    } catch (error) {
      console.error('Error resetting personalization settings:', error);
      throw error;
    }
  }
}

export const personalizationService = PersonalizationService.getInstance();
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { EnvironmentDetector } from '../environmentDetector';

// Mock expo-constants
jest.mock('expo-constants', () => ({
  executionEnvironment: 'standalone',
  ExecutionEnvironment: {
    StoreClient: 'storeClient',
    Standalone: 'standalone',
    Bare: 'bare',
  },
}));

// Mock react-native Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    Version: '14.0',
  },
}));

describe('EnvironmentDetector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isExpoGO', () => {
    it('should return true when running in Expo Go', () => {
      (Constants as any).executionEnvironment = ExecutionEnvironment.StoreClient;
      
      const result = EnvironmentDetector.isExpoGO();
      
      expect(result).toBe(true);
    });

    it('should return false when not running in Expo Go', () => {
      (Constants as any).executionEnvironment = ExecutionEnvironment.Standalone;
      
      const result = EnvironmentDetector.isExpoGO();
      
      expect(result).toBe(false);
    });
  });

  describe('isPrebuiltApp', () => {
    it('should return true when running in prebuilt app', () => {
      (Constants as any).executionEnvironment = ExecutionEnvironment.Standalone;
      
      const result = EnvironmentDetector.isPrebuiltApp();
      
      expect(result).toBe(true);
    });

    it('should return false when not running in prebuilt app', () => {
      (Constants as any).executionEnvironment = ExecutionEnvironment.StoreClient;
      
      const result = EnvironmentDetector.isPrebuiltApp();
      
      expect(result).toBe(false);
    });
  });

  describe('isBareWorkflow', () => {
    it('should return true when running in bare workflow', () => {
      (Constants as any).executionEnvironment = ExecutionEnvironment.Bare;
      
      const result = EnvironmentDetector.isBareWorkflow();
      
      expect(result).toBe(true);
    });

    it('should return false when not running in bare workflow', () => {
      (Constants as any).executionEnvironment = ExecutionEnvironment.Standalone;
      
      const result = EnvironmentDetector.isBareWorkflow();
      
      expect(result).toBe(false);
    });
  });

  describe('canUseElevenLabsWidget', () => {
    it('should return true for prebuilt app on native platform', () => {
      (Constants as any).executionEnvironment = ExecutionEnvironment.Standalone;
      (Platform as any).OS = 'ios';
      
      const result = EnvironmentDetector.canUseElevenLabsWidget();
      
      expect(result).toBe(true);
    });

    it('should return true for bare workflow on native platform', () => {
      (Constants as any).executionEnvironment = ExecutionEnvironment.Bare;
      (Platform as any).OS = 'android';
      
      const result = EnvironmentDetector.canUseElevenLabsWidget();
      
      expect(result).toBe(true);
    });

    it('should return false for Expo Go', () => {
      (Constants as any).executionEnvironment = ExecutionEnvironment.StoreClient;
      (Platform as any).OS = 'ios';
      
      const result = EnvironmentDetector.canUseElevenLabsWidget();
      
      expect(result).toBe(false);
    });

    it('should return false for web platform', () => {
      (Constants as any).executionEnvironment = ExecutionEnvironment.Standalone;
      (Platform as any).OS = 'web';
      
      const result = EnvironmentDetector.canUseElevenLabsWidget();
      
      expect(result).toBe(false);
    });
  });

  describe('getEnvironmentDescription', () => {
    it('should return "Expo Go" for store client', () => {
      (Constants as any).executionEnvironment = ExecutionEnvironment.StoreClient;
      
      const result = EnvironmentDetector.getEnvironmentDescription();
      
      expect(result).toBe('Expo Go');
    });

    it('should return "Prebuilt App" for standalone', () => {
      (Constants as any).executionEnvironment = ExecutionEnvironment.Standalone;
      
      const result = EnvironmentDetector.getEnvironmentDescription();
      
      expect(result).toBe('Prebuilt App');
    });

    it('should return "Bare Workflow" for bare', () => {
      (Constants as any).executionEnvironment = ExecutionEnvironment.Bare;
      
      const result = EnvironmentDetector.getEnvironmentDescription();
      
      expect(result).toBe('Bare Workflow');
    });

    it('should return "Unknown Environment" for unknown execution environment', () => {
      (Constants as any).executionEnvironment = 'unknown';
      
      const result = EnvironmentDetector.getEnvironmentDescription();
      
      expect(result).toBe('Unknown Environment');
    });
  });

  describe('getPlatformInfo', () => {
    it('should return comprehensive platform information', () => {
      (Constants as any).executionEnvironment = ExecutionEnvironment.Standalone;
      (Platform as any).OS = 'ios';
      (Platform as any).Version = '14.0';
      
      const result = EnvironmentDetector.getPlatformInfo();
      
      expect(result).toEqual({
        os: 'ios',
        version: '14.0',
        isWeb: false,
        isIOS: true,
        isAndroid: false,
        executionEnvironment: 'Prebuilt App',
        canUseElevenLabsWidget: true,
      });
    });

    it('should correctly identify web platform', () => {
      (Platform as any).OS = 'web';
      
      const result = EnvironmentDetector.getPlatformInfo();
      
      expect(result.isWeb).toBe(true);
      expect(result.isIOS).toBe(false);
      expect(result.isAndroid).toBe(false);
      expect(result.canUseElevenLabsWidget).toBe(false);
    });

    it('should correctly identify Android platform', () => {
      (Platform as any).OS = 'android';
      (Platform as any).Version = 30;
      
      const result = EnvironmentDetector.getPlatformInfo();
      
      expect(result.isAndroid).toBe(true);
      expect(result.isIOS).toBe(false);
      expect(result.isWeb).toBe(false);
    });
  });
});
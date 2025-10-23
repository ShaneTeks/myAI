import Constants, { ExecutionEnvironment } from 'expo-constants'
import { Platform } from 'react-native'

/**
 * Environment detection utilities for determining app execution context
 * Used to enable/disable features based on runtime environment
 */
export class EnvironmentDetector {
  /**
   * Check if running in Expo Go client
   * @returns true if running in Expo Go, false otherwise
   */
  static isExpoGO(): boolean {
    return Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  }

  /**
   * Check if running in a prebuilt/standalone app
   * @returns true if running in prebuilt app, false otherwise
   */
  static isPrebuiltApp(): boolean {
    return Constants.executionEnvironment === ExecutionEnvironment.Standalone
  }

  /**
   * Check if running in bare workflow
   * @returns true if running in bare workflow, false otherwise
   */
  static isBareWorkflow(): boolean {
    return Constants.executionEnvironment === ExecutionEnvironment.Bare
  }

  /**
   * Check if ElevenLabs widget can be used in current environment
   * Widget requires prebuilt app and cannot run in Expo Go or web
   * @returns true if ElevenLabs widget is supported, false otherwise
   */
  static canUseElevenLabsWidget(): boolean {
    // Widget requires prebuilt app (not Expo Go) and native platform (not web)
    return (this.isPrebuiltApp() || this.isBareWorkflow()) && Platform.OS !== 'web'
  }

  /**
   * Get current execution environment as string for debugging
   * @returns string description of current environment
   */
  static getEnvironmentDescription(): string {
    if (this.isExpoGO()) {
      return 'Expo Go'
    } else if (this.isPrebuiltApp()) {
      return 'Prebuilt App'
    } else if (this.isBareWorkflow()) {
      return 'Bare Workflow'
    } else {
      return 'Unknown Environment'
    }
  }

  /**
   * Get platform information
   * @returns object with platform details
   */
  static getPlatformInfo() {
    return {
      os: Platform.OS,
      version: Platform.Version,
      isWeb: Platform.OS === 'web',
      isIOS: Platform.OS === 'ios',
      isAndroid: Platform.OS === 'android',
      executionEnvironment: this.getEnvironmentDescription(),
      canUseElevenLabsWidget: this.canUseElevenLabsWidget()
    }
  }
}
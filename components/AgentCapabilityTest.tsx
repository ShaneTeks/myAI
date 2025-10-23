import { Colors } from '@/constants/theme';
import { useChatContext } from '@/contexts/ChatContext';
import { elevenLabsService } from '@/lib/elevenLabsService';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function AgentCapabilityTest() {
  const [testResults, setTestResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const { testAgentCapabilities, getAgentStatus, synchronizeWithN8n } = useChatContext();

  const runCapabilityTests = async () => {
    setTesting(true);
    try {
      console.log('Running agent capability tests...');
      const results = await testAgentCapabilities();
      setTestResults(results);
      
      Alert.alert(
        'Test Results',
        `${results.summary.passed}/${results.summary.total} tests passed`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Test failed:', error);
      Alert.alert('Test Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setTesting(false);
    }
  };

  const checkAgentStatus = () => {
    try {
      const status = getAgentStatus();
      console.log('Agent Status:', status);
      
      const statusMessage = `
Environment: ${status.platform.executionEnvironment}
Widget Supported: ${status.widgetSupport.supported}
Configuration Valid: ${status.validation.valid}
Weather Capability: ${status.capabilities.capabilities.weather}
Structured Responses: ${status.capabilities.capabilities.structuredResponses}
      `.trim();
      
      Alert.alert('Agent Status', statusMessage);
    } catch (error) {
      console.error('Status check failed:', error);
      Alert.alert('Status Check Failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const testSynchronization = async () => {
    try {
      console.log('Testing synchronization with n8n...');
      const syncResult = await synchronizeWithN8n();
      
      const syncMessage = `
Success: ${syncResult.success}
Synchronized: ${syncResult.synchronized.length} capabilities
Missing: ${syncResult.missing.length} capabilities
Errors: ${syncResult.errors.length} errors
      `.trim();
      
      Alert.alert('Synchronization Test', syncMessage);
    } catch (error) {
      console.error('Synchronization test failed:', error);
      Alert.alert('Sync Test Failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const testWeatherParsing = async () => {
    try {
      console.log('Testing weather response parsing...');
      
      // Test with sample n8n weather response
      const sampleResponse = {
        transcript: JSON.stringify({
          AIResponse: "Here's the current weather in Swakopmund:",
          weatherAgent: {
            weather: true,
            type: "current",
            output: {
              location: "Swakopmund, Namibia",
              temperature: "21°C",
              feelsLike: "21°C",
              condition: "Partly cloudy",
              conditionImage: "https://cdn.weatherapi.com/weather/64x64/day/116.png",
              humidity: "64%",
              windSpeed: "15.5 km/h",
              windDirection: "WNW",
              pressure: "1016 mb",
              visibility: "10 km",
              uvIndex: "11.4",
              lastUpdated: "2025-10-22 13:00"
            }
          }
        }),
        session_id: 'test'
      };

      const processedMessage = elevenLabsService.processVoiceResponseWithCapabilities(sampleResponse);
      
      const hasWeatherWidget = processedMessage.widgets?.some(w => w.type === 'weather') || false;
      
      Alert.alert(
        'Weather Parsing Test',
        `Weather widget extracted: ${hasWeatherWidget}\nWidget count: ${processedMessage.widgets?.length || 0}`
      );
      
      console.log('Weather parsing test result:', {
        hasWeatherWidget,
        widgets: processedMessage.widgets,
        originalContent: processedMessage.content
      });
      
    } catch (error) {
      console.error('Weather parsing test failed:', error);
      Alert.alert('Weather Test Failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Agent Capability Tests</Text>
      <Text style={styles.subtitle}>Test ElevenLabs agent synchronization with n8n capabilities</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, testing && styles.buttonDisabled]} 
          onPress={runCapabilityTests}
          disabled={testing}
        >
          <Text style={styles.buttonText}>
            {testing ? 'Running Tests...' : 'Run All Capability Tests'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={checkAgentStatus}>
          <Text style={styles.buttonText}>Check Agent Status</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testSynchronization}>
          <Text style={styles.buttonText}>Test N8n Synchronization</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testWeatherParsing}>
          <Text style={styles.buttonText}>Test Weather Parsing</Text>
        </TouchableOpacity>
      </View>

      {testResults && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results</Text>
          <Text style={styles.resultsSummary}>
            {testResults.summary.passed}/{testResults.summary.total} tests passed
          </Text>
          
          {testResults.results.map((result: any, index: number) => (
            <View key={index} style={styles.resultItem}>
              <Text style={[
                styles.resultCapability,
                result.success ? styles.resultSuccess : styles.resultFailure
              ]}>
                {result.capability}: {result.success ? '✓' : '✗'}
              </Text>
              {result.error && (
                <Text style={styles.resultError}>{result.error}</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.icon,
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.dark.tint,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.dark.icon,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: Colors.dark.chatInputBackground,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.chatInputBorder,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 12,
  },
  resultsSummary: {
    fontSize: 16,
    color: Colors.dark.text,
    marginBottom: 16,
    fontWeight: '500',
  },
  resultItem: {
    marginBottom: 12,
  },
  resultCapability: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  resultSuccess: {
    color: '#4CAF50',
  },
  resultFailure: {
    color: '#ff4444',
  },
  resultError: {
    fontSize: 12,
    color: Colors.dark.icon,
    fontStyle: 'italic',
  },
});
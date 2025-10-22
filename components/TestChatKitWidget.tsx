import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function TestChatKitWidget() {
  const widgetUrl = 'https://widgets.chatkit.studio/embed/wig_e79yqoni';
  
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>ChatKit Widget Test</Text>
        <Text style={styles.subtitle}>
          Testing direct access to: {widgetUrl}
        </Text>
        
        <View style={styles.widgetContainer}>
          <WebView
            source={{ uri: widgetUrl }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            onError={(error) => console.log('WebView Error:', error)}
            onLoad={() => console.log('WebView Loaded')}
            onLoadEnd={() => console.log('WebView Load End')}
            onLoadStart={() => console.log('WebView Load Start')}
          />
        </View>
        
        <Text style={styles.note}>
          If you see content above, the widget URL works. If it's blank, there might be an issue with the widget or CORS.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#a0a0a0',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  widgetContainer: {
    height: 400,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  webview: {
    flex: 1,
  },
  note: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
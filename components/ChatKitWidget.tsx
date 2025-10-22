import { Colors } from '@/constants/theme';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface ChatKitWidgetProps {
  widgetId: string;
  widgetType: 'weather' | 'forecast' | 'calendar' | 'todo' | 'generic';
  data?: any;
  height?: number;
}

const WIDGET_CONFIGS = {
  weather: {
    url: 'https://widgets.chatkit.studio/embed/wig_e79yqoni', // Current weather widget
    defaultHeight: 300,
  },
  forecast: {
    url: 'https://widgets.chatkit.studio/embed/wig_5dafl1gl', // Forecast weather widget
    defaultHeight: 300,
  },
  calendar: {
    url: 'https://widgets.chatkit.studio/embed/calendar',
    defaultHeight: 400,
  },
  todo: {
    url: 'https://widgets.chatkit.studio/embed/todo',
    defaultHeight: 350,
  },
  generic: {
    url: 'https://widgets.chatkit.studio/embed/',
    defaultHeight: 300,
  },
};

export default function ChatKitWidget({ 
  widgetId, 
  widgetType, 
  data, 
  height 
}: ChatKitWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const webViewRef = useRef<WebView>(null);
  
  const config = WIDGET_CONFIGS[widgetType] || WIDGET_CONFIGS.generic;
  const widgetHeight = height || config.defaultHeight;
  const widgetUrl = widgetType === 'generic' ? `${config.url}${widgetId}` : config.url;

  // Create HTML content that embeds the ChatKit widget
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                background-color: #1a1a1a;
                color: #ffffff;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                overflow: hidden;
            }
            .widget-container {
                width: 100%;
                height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .widget-frame {
                width: 100%;
                height: 100%;
                border: none;
                border-radius: 12px;
                background: #2a2a2a;
            }
            .loading {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                color: #888;
            }
        </style>
    </head>
    <body>
        <div class="widget-container">
            <iframe 
                class="widget-frame"
                src="${widgetUrl}"
                frameborder="0"
                allowtransparency="true"
                allow="geolocation; microphone; camera"
                onload="window.ReactNativeWebView && window.ReactNativeWebView.postMessage('loaded')"
                onerror="window.ReactNativeWebView && window.ReactNativeWebView.postMessage('error')"
            ></iframe>
        </div>
        
        <script>
            // Handle widget interactions
            window.addEventListener('message', function(event) {
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'widget_interaction',
                        data: event.data
                    }));
                }
            });
            
            // Pass data to widget if provided
            ${data ? `
            window.addEventListener('load', function() {
                const widgetData = ${JSON.stringify(data)};
                // Send data to the widget iframe
                const iframe = document.querySelector('.widget-frame');
                if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage(widgetData, '*');
                }
            });
            ` : ''}
        </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const message = event.nativeEvent.data;
      
      if (message === 'loaded') {
        setLoading(false);
        setError(false);
      } else if (message === 'error') {
        setLoading(false);
        setError(true);
      } else {
        // Handle widget interactions
        const parsed = JSON.parse(message);
        console.log('Widget interaction:', parsed);
      }
    } catch (e) {
      console.log('Widget message:', event.nativeEvent.data);
    }
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <View style={[styles.container, { height: widgetHeight }]}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.dark.tint} />
        </View>
      )}
      
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webview}
        onMessage={handleMessage}
        onError={handleError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={true}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.messageAI,
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 4,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.messageAI,
    zIndex: 1,
  },
});
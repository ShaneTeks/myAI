# Native Weather Card Integration

This document explains how structured weather responses from your n8n agent are rendered as native React Native cards in your chat app.

## How It Works

Instead of using web widgets, your n8n agent returns structured JSON responses that are rendered as beautiful native React Native weather cards. This provides better performance, native feel, and seamless integration.

## n8n Agent Response Format

Your n8n agent should return responses in this exact format:

```json
[{
  "output": {
    "AIResponse": "Here's the current weather in Swakopmund: clear skies with mild temperatures, 20 °C during the day and 10 °C at night.",
    "weatherAgent": {
      "weather": true,
      "output": {
        "background": "sunny",
        "conditionImage": "https://example.com/sunny.png",
        "lowTemperature": "10 °C",
        "highTemperature": "22 °C",
        "location": "Swakopmund, Namibia",
        "conditionDescription": "Clear skies with mild temperatures",
        "forecast": [
          {
            "conditionImage": "https://example.com/sunny.png",
            "temperature": "20 °C"
          },
          {
            "conditionImage": "https://example.com/sunny.png",
            "temperature": "22 °C"
          },
          {
            "conditionImage": "https://example.com/sunny.png",
            "temperature": "18 °C"
          }
        ]
      }
    }
  }
}]
```

## Response Structure

### n8n Array Format
- **Array**: Must be an array with one object containing `output`
- **output.AIResponse**: `string` - Text message to display above the weather card
- **output.weatherAgent.weather**: `boolean` - Set to `true` to trigger weather card rendering
- **output.weatherAgent.output**: `object` - Weather information object

### Weather Output Object
- **background**: `string` - Background type ("sunny", "cloudy", "rainy", "clear", "night") or CSS gradient
- **conditionImage**: `string` - URL to main weather condition image
- **lowTemperature**: `string` - Low temperature (e.g., "10 °C")
- **highTemperature**: `string` - High temperature (e.g., "22 °C")
- **location**: `string` - Location name (e.g., "Swakopmund, Namibia")
- **conditionDescription**: `string` - Weather description text
- **forecast**: `array` - Array of forecast objects with `conditionImage` and `temperature`

### Background Types
The app automatically converts simple background types to beautiful gradients:
- **"sunny"** → Golden yellow gradient
- **"cloudy"** → Light blue/gray gradient  
- **"rainy"** → Blue/gray gradient
- **"clear"** → Bright blue gradient
- **"night"** → Dark gradient
- Or provide a custom CSS gradient string

## Testing the Integration

### Method 1: Use the Test Screen
Navigate to "Widget Test" in your app drawer to see a native weather card demo.

### Method 2: Chat Testing
Ask weather questions in your main chat:
- "What's the weather like?"
- "Show me the weather in London"
- "How's the temperature today?"

Your n8n agent should detect these and return structured weather responses.

### Method 3: Manual Testing
You can manually test by having your n8n agent return the structured response format shown above.

## Technical Implementation

### Components
- **WeatherCard**: Native React Native weather card component
- **MessageWithWidgets**: Enhanced message component that detects and renders weather cards
- **WeatherWidgetTest**: Test component for development

### Services
- **widgetParser**: Parses structured responses and validates weather data
- **chatService**: Handles structured responses from n8n agent

### Response Processing Flow
1. User sends weather-related message
2. n8n agent processes request and returns structured response
3. `parseStructuredResponse()` detects weather data
4. `WeatherCard` component renders native weather UI
5. Message displays both text and weather card

## Advantages Over Web Widgets

### Performance
- Native rendering is faster than WebView
- No network requests for widget loading
- Smooth animations and interactions

### User Experience
- Consistent with app design
- Native scrolling and touch handling
- Better accessibility support

### Customization
- Full control over styling and layout
- Easy to modify colors, fonts, and spacing
- Responsive design for all screen sizes

## Customization

### Styling the Weather Card
Modify `components/WeatherCard.tsx` to customize:
- Colors and gradients
- Typography and spacing
- Icon sizes and layout
- Animation effects

### Adding More Card Types
1. Create new card components (e.g., `CalendarCard.tsx`)
2. Add detection logic in `widgetParser.ts`
3. Update `MessageWithWidgets.tsx` to render new card types
4. Define response structure for your n8n agent

### Custom Backgrounds
The weather card supports CSS gradients. You can use tools like:
- [CSS Gradient Generator](https://cssgradient.io/)
- [Gradient Hunt](https://gradienthunt.com/)

## n8n Integration Tips

### Weather API Integration
Your n8n workflow should:
1. Detect weather-related user messages
2. Call a weather API (OpenWeatherMap, WeatherAPI, etc.)
3. Transform API response to match the required structure
4. Return structured JSON response

### Example n8n Workflow
1. **Webhook Trigger**: Receives user message
2. **IF Node**: Check if message contains weather keywords
3. **HTTP Request**: Call weather API with location
4. **Function Node**: Transform API response to required format
5. **Respond**: Return structured JSON

### Error Handling
If weather data is unavailable, return:
```json
{
  "weather": false,
  "text": "I'm sorry, I couldn't get weather information right now. Please try again later."
}
```

## Troubleshooting

### Weather Card Not Showing
- Verify `weather: true` in n8n response
- Check that `weatherData` object has all required fields
- Ensure image URLs are accessible

### Styling Issues
- Check gradient syntax in `background` field
- Verify image URLs return valid images
- Test on different screen sizes

### n8n Response Issues
- Validate JSON structure matches expected format
- Check n8n logs for errors
- Test API responses manually

## Next Steps

1. **Configure n8n Workflow**: Set up weather detection and API integration
2. **Add More Card Types**: Implement calendar, todo, or other structured responses
3. **Enhanced Styling**: Customize weather card design to match your app
4. **Location Services**: Add GPS location detection for automatic weather
5. **Caching**: Implement weather data caching for better performance
# Design Document

## Overview

This design implements a dual-widget weather system that supports both current weather and forecast widgets. The system will intelligently route weather requests to the appropriate API endpoints and render the correct widget based on the data type received.

## Architecture

### High-Level Flow
1. User makes weather request → N8N Agent
2. N8N Agent determines request type (current vs forecast)
3. N8N Agent calls appropriate WeatherAPI endpoint
4. N8N Agent structures response for correct widget type
5. Frontend Widget Parser identifies widget type and renders accordingly

### Component Structure
```
Weather System
├── N8N Agent (Backend)
│   ├── Request Classification
│   ├── API Route Selection
│   └── Response Structuring
├── Frontend Widget Parser
│   ├── Widget Type Detection
│   ├── Data Validation
│   └── Widget Rendering
└── ChatKit Widgets
    ├── Current Weather Widget (wig_e79yqoni)
    └── Forecast Widget (wig_5dafl1gl)
```

## Components and Interfaces

### N8N Agent Response Structure

#### Current Weather Response
```json
{
  "AIResponse": "Here's the current weather:",
  "weatherAgent": {
    "weather": true,
    "type": "current",
    "widgetId": "wig_e79yqoni",
    "output": {
      "location": "Swakopmund, Namibia",
      "temperature": "21°C",
      "feelsLike": "21°C",
      "condition": "Partly cloudy",
      "conditionImage": "https://cdn.weatherapi.com/weather/64x64/day/116.png",
      "humidity": "64%",
      "windSpeed": "15.5 km/h",
      "windDirection": "WNW",
      "pressure": "1016 mb",
      "visibility": "10 km",
      "uvIndex": "11.4",
      "lastUpdated": "2025-10-22 13:00",
      "cloudCover": "50%",
      "dewPoint": "13°C",
      "airQuality": {
        "usEpaIndex": 1,
        "gbDefraIndex": 2,
        "pm2_5": 14.45,
        "pm10": 20.85
      }
    }
  }
}
```

#### Forecast Weather Response
```json
{
  "AIResponse": "Here's the weather forecast:",
  "weatherAgent": {
    "weather": true,
    "type": "forecast",
    "widgetId": "wig_5dafl1gl",
    "output": {
      "location": "Swakopmund, Namibia",
      "background": "Clear skies over the Atlantic Ocean, gentle sea breeze.",
      "currentTemp": "15°C",
      "lowTemperature": "14°C",
      "highTemperature": "17°C",
      "conditionDescription": "Sunny",
      "conditionImage": "sunny.png",
      "forecast": [
        {
          "date": "2025-10-22",
          "conditionImage": "sunny.png",
          "highTemp": "17°C",
          "lowTemp": "14°C",
          "condition": "Sunny"
        },
        {
          "date": "2025-10-23",
          "conditionImage": "partly_cloudy.png",
          "highTemp": "22°C",
          "lowTemp": "13°C",
          "condition": "Partly Cloudy"
        },
        {
          "date": "2025-10-24",
          "conditionImage": "sunny.png",
          "highTemp": "17°C",
          "lowTemp": "14°C",
          "condition": "Sunny"
        }
      ]
    }
  }
}
```

### Widget Parser Interface

#### Enhanced Widget Detection
```typescript
interface WeatherWidgetData {
  weather: boolean;
  type: 'current' | 'forecast';
  widgetId: string;
  output: CurrentWeatherOutput | ForecastWeatherOutput;
}

interface CurrentWeatherOutput {
  location: string;
  temperature: string;
  feelsLike: string;
  condition: string;
  conditionImage: string;
  humidity: string;
  windSpeed: string;
  windDirection: string;
  pressure: string;
  visibility: string;
  uvIndex: string;
  lastUpdated: string;
}

interface ForecastWeatherOutput {
  location: string;
  background: string;
  currentTemp: string;
  lowTemperature: string;
  highTemperature: string;
  conditionDescription: string;
  conditionImage: string;
  forecast: ForecastDay[];
}

interface ForecastDay {
  date: string;
  conditionImage: string;
  highTemp: string;
  lowTemp: string;
  condition: string;
}
```

## Data Models

### WeatherAPI Integration

#### Current Weather Mapping
```typescript
// From WeatherAPI /current.json response
const mapCurrentWeather = (apiResponse: WeatherAPICurrentResponse) => ({
  location: `${apiResponse.location.name}, ${apiResponse.location.country}`,
  temperature: `${Math.round(apiResponse.current.temp_c)}°C`,
  feelsLike: `${Math.round(apiResponse.current.feelslike_c)}°C`,
  condition: apiResponse.current.condition.text,
  conditionImage: `https:${apiResponse.current.condition.icon}`,
  humidity: `${apiResponse.current.humidity}%`,
  windSpeed: `${apiResponse.current.wind_kph} km/h`,
  windDirection: apiResponse.current.wind_dir,
  pressure: `${apiResponse.current.pressure_mb} mb`,
  visibility: `${apiResponse.current.vis_km} km`,
  uvIndex: apiResponse.current.uv.toString(),
  lastUpdated: apiResponse.current.last_updated,
  cloudCover: `${apiResponse.current.cloud}%`,
  dewPoint: `${Math.round(apiResponse.current.dewpoint_c)}°C`,
  airQuality: {
    usEpaIndex: apiResponse.current.air_quality?.["us-epa-index"] || 0,
    gbDefraIndex: apiResponse.current.air_quality?.["gb-defra-index"] || 0,
    pm2_5: apiResponse.current.air_quality?.pm2_5 || 0,
    pm10: apiResponse.current.air_quality?.pm10 || 0
  }
});
```

#### Forecast Weather Mapping
```typescript
// From WeatherAPI /forecast.json response
const mapForecastWeather = (apiResponse: WeatherAPIForecastResponse) => ({
  location: `${apiResponse.location.name}, ${apiResponse.location.country}`,
  background: generateBackgroundDescription(apiResponse.current.condition),
  currentTemp: `${apiResponse.current.temp_c}°C`,
  lowTemperature: `${apiResponse.forecast.forecastday[0].day.mintemp_c}°C`,
  highTemperature: `${apiResponse.forecast.forecastday[0].day.maxtemp_c}°C`,
  conditionDescription: apiResponse.current.condition.text,
  conditionImage: mapConditionToImage(apiResponse.current.condition.code),
  forecast: apiResponse.forecast.forecastday.map(day => ({
    date: day.date,
    conditionImage: mapConditionToImage(day.day.condition.code),
    highTemp: `${day.day.maxtemp_c}°C`,
    lowTemp: `${day.day.mintemp_c}°C`,
    condition: day.day.condition.text
  }))
});
```

### Request Classification Logic

#### N8N Agent Request Analysis
```javascript
// Classify weather request type
const classifyWeatherRequest = (userMessage) => {
  const currentWeatherKeywords = [
    'current weather', 'weather now', 'temperature now',
    'how hot is it', 'how cold is it', 'weather right now'
  ];
  
  const forecastKeywords = [
    'forecast', 'weather tomorrow', 'next few days',
    'this week', 'weather forecast', 'upcoming weather'
  ];
  
  const message = userMessage.toLowerCase();
  
  if (forecastKeywords.some(keyword => message.includes(keyword))) {
    return 'forecast';
  }
  
  if (currentWeatherKeywords.some(keyword => message.includes(keyword))) {
    return 'current';
  }
  
  // Default to current weather for ambiguous requests
  return 'current';
};
```

## Error Handling

### Data Validation
```typescript
const validateWeatherData = (data: any): WeatherWidgetData | null => {
  if (!data?.weatherAgent?.weather) return null;
  
  const { type, widgetId, output } = data.weatherAgent;
  
  if (!['current', 'forecast'].includes(type)) return null;
  if (!widgetId) return null;
  if (!output) return null;
  
  // Type-specific validation
  if (type === 'current') {
    return validateCurrentWeatherOutput(output) ? data : null;
  } else {
    return validateForecastWeatherOutput(output) ? data : null;
  }
};
```

### Fallback Strategies
1. **Invalid Widget Type**: Default to current weather widget
2. **Missing Data Fields**: Use placeholder values or hide optional fields
3. **API Errors**: Display error message with retry option
4. **Network Issues**: Show cached weather data if available

## Testing Strategy

### Unit Tests
- Widget type detection logic
- Data mapping functions
- Validation functions
- Error handling scenarios

### Integration Tests
- N8N Agent response processing
- Widget rendering with different data types
- API endpoint routing
- Error state handling

### End-to-End Tests
- Current weather request flow
- Forecast weather request flow
- Mixed conversation scenarios
- Error recovery scenarios

## Implementation Notes

### Backward Compatibility
- Existing forecast widget responses will continue to work
- Gradual migration approach for N8N Agent updates
- Fallback to current behavior if new fields are missing

### Performance Considerations
- Cache weather condition image mappings
- Minimize API calls by intelligent request routing
- Lazy load widget components

### Widget Configuration
- Current Weather Widget: `wig_e79yqoni`
- Forecast Widget: `wig_5dafl1gl`
- Both widgets should be registered in the widget parser

This design ensures a clean separation between current weather and forecast functionality while maintaining backward compatibility and providing robust error handling.
# N8N Weather Mapping Guide

## Quick Reference

**📄 Complete Examples**: See `N8N_WEATHER_EXAMPLES.json` for comprehensive examples of both current and forecast weather responses with transformation functions.

## WeatherAPI Response to N8N Output Mapping

This guide shows how to map WeatherAPI responses to the expected N8N output format for both current and forecast weather widgets.

### WeatherAPI Current Response Structure
```json
{
  "location": {
    "name": "Swakopmund",
    "region": "Erongo", 
    "country": "Namibia",
    "lat": -22.6833,
    "lon": 14.5333,
    "tz_id": "Africa/Windhoek",
    "localtime_epoch": 1761131305,
    "localtime": "2025-10-22 13:08"
  },
  "current": {
    "last_updated_epoch": 1761130800,
    "last_updated": "2025-10-22 13:00",
    "temp_c": 21.2,
    "temp_f": 70.2,
    "is_day": 1,
    "condition": {
      "text": "Partly cloudy",
      "icon": "//cdn.weatherapi.com/weather/64x64/day/116.png",
      "code": 1003
    },
    "wind_mph": 9.6,
    "wind_kph": 15.5,
    "wind_degree": 290,
    "wind_dir": "WNW",
    "pressure_mb": 1016.0,
    "pressure_in": 30.0,
    "precip_mm": 0.0,
    "precip_in": 0.0,
    "humidity": 64,
    "cloud": 50,
    "feelslike_c": 21.2,
    "feelslike_f": 70.2,
    "windchill_c": 16.5,
    "windchill_f": 61.7,
    "heatindex_c": 16.5,
    "heatindex_f": 61.7,
    "dewpoint_c": 13.1,
    "dewpoint_f": 55.6,
    "vis_km": 10.0,
    "vis_miles": 6.0,
    "uv": 11.4,
    "gust_mph": 12.9,
    "gust_kph": 20.7,
    "air_quality": {
      "co": 86.85,
      "no2": 1.15,
      "o3": 63.0,
      "so2": 1.65,
      "pm2_5": 14.45,
      "pm10": 20.85,
      "us-epa-index": 1,
      "gb-defra-index": 2
    }
  }
}
```

### Expected N8N Output Format

#### Current Weather (type: "current")
```json
{
  "AIResponse": "Here's the current weather in Swakopmund:",
  "weatherAgent": {
    "weather": true,
    "type": "current",
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

#### Forecast Weather (type: "forecast")
```json
{
  "AIResponse": "Here's the weather forecast for Swakopmund:",
  "weatherAgent": {
    "weather": true,
    "type": "forecast",
    "output": {
      "background": "Clear skies over the Atlantic Ocean, gentle sea breeze.",
      "conditionImage": "https://cdn.weatherapi.com/weather/64x64/day/116.png",
      "lowTemperature": "18°C",
      "highTemperature": "27°C",
      "location": "Swakopmund, Namibia",
      "conditionDescription": "Sunny",
      "forecast": [
        {
          "conditionImage": "https://cdn.weatherapi.com/weather/64x64/day/113.png",
          "temperature": "25°C"
        },
        {
          "conditionImage": "https://cdn.weatherapi.com/weather/64x64/day/116.png",
          "temperature": "26°C"
        },
        {
          "conditionImage": "https://cdn.weatherapi.com/weather/64x64/day/113.png",
          "temperature": "27°C"
        }
      ]
    }
  }
}
```

## Field Mapping Reference

| N8N Output Field | WeatherAPI Source | Transformation |
|------------------|-------------------|----------------|
| `location` | `location.name + ", " + location.country` | Concatenate name and country |
| `temperature` | `current.temp_c` | Round and add "°C" |
| `feelsLike` | `current.feelslike_c` | Round and add "°C" |
| `condition` | `current.condition.text` | Use as-is |
| `conditionImage` | `current.condition.icon` | Add "https:" prefix |
| `humidity` | `current.humidity` | Add "%" suffix |
| `windSpeed` | `current.wind_kph` | Add " km/h" suffix |
| `windDirection` | `current.wind_dir` | Use as-is |
| `pressure` | `current.pressure_mb` | Add " mb" suffix |
| `visibility` | `current.vis_km` | Add " km" suffix |
| `uvIndex` | `current.uv` | Convert to string |
| `lastUpdated` | `current.last_updated` | Use as-is |
| `cloudCover` | `current.cloud` | Add "%" suffix |
| `dewPoint` | `current.dewpoint_c` | Round and add "°C" |
| `airQuality.usEpaIndex` | `current.air_quality["us-epa-index"]` | Use as-is |
| `airQuality.gbDefraIndex` | `current.air_quality["gb-defra-index"]` | Use as-is |
| `airQuality.pm2_5` | `current.air_quality.pm2_5` | Use as-is |
| `airQuality.pm10` | `current.air_quality.pm10` | Use as-is |

## JavaScript Transformation Functions

### Current Weather Transformation
```javascript
function transformCurrentWeatherToN8N(weatherApiResponse, userMessage) {
  const { location, current } = weatherApiResponse;
  
  return {
    AIResponse: `Here's the current weather in ${location.name}:`,
    weatherAgent: {
      weather: true,
      type: "current",
      output: {
        location: `${location.name}, ${location.country}`,
        temperature: `${Math.round(current.temp_c)}°C`,
        feelsLike: `${Math.round(current.feelslike_c)}°C`,
        condition: current.condition.text,
        conditionImage: `https:${current.condition.icon}`,
        humidity: `${current.humidity}%`,
        windSpeed: `${current.wind_kph} km/h`,
        windDirection: current.wind_dir,
        pressure: `${current.pressure_mb} mb`,
        visibility: `${current.vis_km} km`,
        uvIndex: current.uv.toString(),
        lastUpdated: current.last_updated,
        cloudCover: `${current.cloud}%`,
        dewPoint: `${Math.round(current.dewpoint_c)}°C`,
        airQuality: {
          usEpaIndex: current.air_quality?.["us-epa-index"] || 0,
          gbDefraIndex: current.air_quality?.["gb-defra-index"] || 0,
          pm2_5: current.air_quality?.pm2_5 || 0,
          pm10: current.air_quality?.pm10 || 0
        }
      }
    }
  };
}
```

### Forecast Weather Transformation
```javascript
function transformForecastWeatherToN8N(weatherApiResponse, userMessage) {
  const { location, current, forecast } = weatherApiResponse;
  
  return {
    AIResponse: `Here's the weather forecast for ${location.name}:`,
    weatherAgent: {
      weather: true,
      type: "forecast",
      output: {
        background: `${current.condition.text} conditions in ${location.name}.`,
        conditionImage: `https:${current.condition.icon}`,
        lowTemperature: `${Math.round(forecast.forecastday[0].day.mintemp_c)}°C`,
        highTemperature: `${Math.round(forecast.forecastday[0].day.maxtemp_c)}°C`,
        location: `${location.name}, ${location.country}`,
        conditionDescription: current.condition.text,
        forecast: forecast.forecastday.slice(0, 5).map(day => ({
          conditionImage: `https:${day.day.condition.icon}`,
          temperature: `${Math.round(day.day.maxtemp_c)}°C`
        }))
      }
    }
  };
}
```

## Widget Selection Logic

The app automatically selects the correct widget based on the `type` field:

- **type: "current"** → Uses current weather widget (`wig_e79yqoni`)
- **type: "forecast"** → Uses forecast weather widget (`wig_5dafl1gl`)
- **No type specified** → Defaults to current weather widget

## Request Type Detection

Your N8N agent should analyze the user's request to determine the appropriate type:

### Current Weather Keywords
- "current weather", "weather now", "temperature now"
- "how hot is it", "how cold is it", "weather right now"
- "what's the weather like"

### Forecast Weather Keywords  
- "forecast", "weather tomorrow", "next few days"
- "this week", "weather forecast", "upcoming weather"
- "will it rain", "weather for the weekend"

## Important Notes

1. **Temperature Units**: Always use Celsius (`temp_c`, `feelslike_c`, `dewpoint_c`)
2. **Icon URLs**: Add "https:" prefix to WeatherAPI icon URLs
3. **Type Field**: Set to "current" or "forecast" - no widgetId needed
4. **Air Quality**: Handle missing air quality data with fallback values
5. **Rounding**: Round temperature values to nearest integer for cleaner display
6. **Default Behavior**: If no type is specified, the app defaults to current weather

## Testing

Use these test files to verify your N8N output format:
- `N8N_WEATHER_EXAMPLES.json` - Complete examples with both current and forecast formats
- `TEST_CURRENT_WEATHER_RESPONSE.json` - Current weather test data
- `TEST_FORECAST_WEATHER_RESPONSE.json` - Forecast weather test data

## Summary

Your N8N agent needs to:
1. **Detect request type** using the keywords provided
2. **Set the correct type** ("current" or "forecast") 
3. **Transform the data** using the appropriate function
4. **Return the response** in the expected format

The app will automatically select the correct ChatKit widget based on the type field.
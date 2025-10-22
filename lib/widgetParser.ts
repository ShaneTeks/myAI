export interface CurrentWeatherData {
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
  cloudCover?: string;
  dewPoint?: string;
  airQuality?: {
    usEpaIndex: number;
    gbDefraIndex: number;
    pm2_5: number;
    pm10: number;
  };
}

export interface ForecastWeatherData {
  background: string;
  conditionImage: string;
  lowTemperature: string;
  highTemperature: string;
  location: string;
  conditionDescription: string;
  forecast: Array<{
    conditionImage: string;
    temperature: string;
  }>;
}

export type WeatherData = CurrentWeatherData | ForecastWeatherData;

export interface StructuredResponse {
  weather?: boolean;
  weatherData?: WeatherData;
  text: string;
}

export interface ParsedMessage {
  text: string;
  hasWeather: boolean;
  weatherData?: CurrentWeatherData;
}

export function parseStructuredResponse(response: string | any): ParsedMessage {
  // If response is a string, try to parse it as JSON
  if (typeof response === 'string') {
    try {
      const parsed = JSON.parse(response);
      return parseStructuredResponse(parsed); // Recursively parse the object
    } catch {
      // If not JSON, treat as plain text
      return {
        text: response,
        hasWeather: false,
      };
    }
  }

  // Handle n8n array response format
  if (Array.isArray(response) && response.length > 0) {
    const firstItem = response[0];
    if (firstItem.output) {
      const { AIResponse, weatherAgent } = firstItem.output;
      
      // Check if weather data exists
      if (weatherAgent && weatherAgent.weather === true && weatherAgent.output) {
        const weatherOutput = weatherAgent.output;
        
        // Transform current weather data with proper units and temperature conversion
        const addUnit = (value: string, unit: string) => {
          if (!value) return value;
          // Remove any existing unit and add the correct one
          const cleanValue = value.replace(/°C|°F|%|km\/h|mb|km/g, '').trim();
          return `${cleanValue}${unit}`;
        };

        // Convert temperature from Fahrenheit to Celsius if needed
        const convertToCelsius = (tempString: string): string => {
          if (!tempString) return tempString;
          
          // Extract numeric value and check for existing unit
          const match = tempString.match(/(-?\d+(?:\.\d+)?)\s*°?([CF])?/);
          if (!match) return tempString;
          
          const value = parseFloat(match[1]);
          const unit = match[2];
          
          // If it's already Celsius or no unit specified, assume it's Celsius
          if (unit === 'C' || !unit) {
            return `${value}°C`;
          }
          
          // Convert from Fahrenheit to Celsius
          if (unit === 'F') {
            const celsius = Math.round((value - 32) * 5 / 9 * 10) / 10; // Round to 1 decimal
            return `${celsius}°C`;
          }
          
          return `${value}°C`;
        };

        const transformedWeatherData: CurrentWeatherData = {
          location: weatherOutput.location,
          temperature: convertToCelsius(weatherOutput.temperature),
          feelsLike: convertToCelsius(weatherOutput.feelsLike),
          condition: weatherOutput.condition,
          conditionImage: weatherOutput.conditionImage,
          humidity: addUnit(weatherOutput.humidity, '%'),
          windSpeed: addUnit(weatherOutput.windSpeed, ' km/h'),
          windDirection: weatherOutput.windDirection,
          pressure: addUnit(weatherOutput.pressure, ' mb'),
          visibility: addUnit(weatherOutput.visibility, ' km'),
          uvIndex: weatherOutput.uvIndex,
          lastUpdated: weatherOutput.lastUpdated,
          cloudCover: weatherOutput.cloudCover ? addUnit(weatherOutput.cloudCover, '%') : undefined,
          dewPoint: weatherOutput.dewPoint ? convertToCelsius(weatherOutput.dewPoint) : undefined,
          airQuality: weatherOutput.airQuality,
        };

        return {
          text: AIResponse || '',
          hasWeather: true,
          weatherData: transformedWeatherData,
        };
      }
      
      // No weather data, just return the AI response
      return {
        text: AIResponse || '',
        hasWeather: false,
      };
    }
  }

  // Handle direct object format (legacy support)
  if (typeof response === 'object' && response !== null) {
    // Check for direct weather format
    if (response.weather === true && response.weatherData) {
      return {
        text: response.text || response.response || '',
        hasWeather: true,
        weatherData: response.weatherData,
      };
    }
    
    // Check for n8n output format
    if (response.output) {
      return parseStructuredResponse([response]); // Convert to array format
    }
    
    // Don't convert object to string, just return empty text
    return {
      text: response.text || response.response || '',
      hasWeather: false,
    };
  }

  // Fallback - avoid [object Object]
  return {
    text: typeof response === 'string' ? response : '',
    hasWeather: false,
  };
}

// Helper function to transform background strings to gradients
function transformBackground(background: string): string {
  const backgroundMap: { [key: string]: string } = {
    'sunny': 'linear-gradient(111deg, #1769C8 0%, #258AE3 56.92%, #31A3F8 100%)', // Use blue for sunny
    'cloudy': 'linear-gradient(111deg, #87CEEB 0%, #B0C4DE 56.92%, #D3D3D3 100%)',
    'rainy': 'linear-gradient(111deg, #4682B4 0%, #5F9EA0 56.92%, #708090 100%)',
    'clear': 'linear-gradient(111deg, #1769C8 0%, #258AE3 56.92%, #31A3F8 100%)',
    'night': 'linear-gradient(111deg, #2C3E50 0%, #34495E 56.92%, #4A5568 100%)',
  };

  // If it's already a gradient, return as is
  if (background.includes('gradient')) {
    return background;
  }

  // Map simple background names to gradients
  return backgroundMap[background.toLowerCase()] || backgroundMap['clear'];
}

// Helper function to validate current weather data
export function isValidCurrentWeatherData(data: any): data is CurrentWeatherData {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.location === 'string' &&
    typeof data.temperature === 'string' &&
    typeof data.feelsLike === 'string' &&
    typeof data.condition === 'string' &&
    typeof data.conditionImage === 'string' &&
    typeof data.humidity === 'string' &&
    typeof data.windSpeed === 'string' &&
    typeof data.windDirection === 'string' &&
    typeof data.pressure === 'string' &&
    typeof data.visibility === 'string' &&
    typeof data.uvIndex === 'string' &&
    typeof data.lastUpdated === 'string'
  );
}

// Helper function to validate forecast weather data
export function isValidForecastWeatherData(data: any): data is ForecastWeatherData {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.background === 'string' &&
    typeof data.conditionImage === 'string' &&
    typeof data.lowTemperature === 'string' &&
    typeof data.highTemperature === 'string' &&
    typeof data.location === 'string' &&
    typeof data.conditionDescription === 'string' &&
    Array.isArray(data.forecast) &&
    data.forecast.every((item: any) => 
      typeof item.conditionImage === 'string' && 
      typeof item.temperature === 'string'
    )
  );
}

// Helper function to validate weather data structure
export function isValidWeatherData(data: any, type: 'current' | 'forecast' = 'current'): data is WeatherData {
  if (type === 'current') {
    return isValidCurrentWeatherData(data);
  } else {
    return isValidForecastWeatherData(data);
  }
}

// Sample current weather data for testing
export const sampleCurrentWeatherData: CurrentWeatherData = {
  location: 'Swakopmund, Namibia',
  temperature: '21°C',
  feelsLike: '21°C',
  condition: 'Partly cloudy',
  conditionImage: 'https://cdn.weatherapi.com/weather/64x64/day/116.png',
  humidity: '64%',
  windSpeed: '15.5 km/h',
  windDirection: 'WNW',
  pressure: '1016 mb',
  visibility: '10 km',
  uvIndex: '11.4',
  lastUpdated: '2025-10-22 13:00',
  cloudCover: '50%',
  dewPoint: '13°C',
  airQuality: {
    usEpaIndex: 1,
    gbDefraIndex: 2,
    pm2_5: 14.45,
    pm10: 20.85
  }
};

// Sample forecast weather data for testing (legacy)
export const sampleForecastWeatherData: ForecastWeatherData = {
  background: 'linear-gradient(111deg, #1769C8 0%, #258AE3 56.92%, #31A3F8 100%)',
  conditionImage: 'https://cdn.openai.com/API/storybook/mixed-sun.png',
  lowTemperature: '47°',
  highTemperature: '69°',
  location: 'San Francisco, CA',
  conditionDescription: 'Partly sunny skies accompanied by some clouds',
  forecast: [
    {
      conditionImage: 'https://cdn.openai.com/API/storybook/mostly-sunny.png',
      temperature: '54°',
    },
    {
      conditionImage: 'https://cdn.openai.com/API/storybook/rain.png',
      temperature: '54°',
    },
    {
      conditionImage: 'https://cdn.openai.com/API/storybook/mixed-sun.png',
      temperature: '54°',
    },
    {
      conditionImage: 'https://cdn.openai.com/API/storybook/windy.png',
      temperature: '54°',
    },
    {
      conditionImage: 'https://cdn.openai.com/API/storybook/mostly-sunny.png',
      temperature: '54°',
    },
  ],
};
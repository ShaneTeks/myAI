export interface WeatherData {
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

export interface StructuredResponse {
  weather?: boolean;
  weatherData?: WeatherData;
  text: string;
}

export interface ParsedMessage {
  text: string;
  hasWeather: boolean;
  weatherData?: WeatherData;
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
        
        // Transform the weather data to match our expected format
        const transformedWeatherData: WeatherData = {
          background: transformBackground(weatherOutput.background),
          conditionImage: weatherOutput.conditionImage,
          lowTemperature: weatherOutput.lowTemperature,
          highTemperature: weatherOutput.highTemperature,
          location: weatherOutput.location,
          conditionDescription: weatherOutput.conditionDescription,
          forecast: weatherOutput.forecast || []
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

// Helper function to validate weather data structure
export function isValidWeatherData(data: any): data is WeatherData {
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

// Sample weather data for testing
export const sampleWeatherData: WeatherData = {
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
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

export interface FinanceStatItem {
  key: string;
  label: string;
  value: string;
  icon: string;
  accent: string;
}

export interface FinanceTransaction {
  id: string;
  merchant: string;
  typeLabel: string;
  fee: string;
  amount: string;
  icon: string;
  accent: string;
}

export interface MonthlyFinanceData {
  title: string;
  subtitle: string;
  monthLabel: string;
  stats: FinanceStatItem[];
  transactions: FinanceTransaction[];
  summary: string;
}

export interface WeatherWidgetData {
  weather: boolean;
  type: 'current' | 'forecast' | 'weatherAgent' | 'weather'; // Support multiple type formats
  widgetId?: string;
  output: CurrentWeatherData | ForecastWeatherData;
}

export interface FinanceWidgetData {
  financeWidget: boolean;
  type: 'monthly_summary' | 'monthly';
  widgetId?: string;
  output: MonthlyFinanceData;
}

export interface StructuredResponse {
  weather?: boolean;
  weatherData?: WeatherData;
  text: string;
}

export interface ParsedMessage {
  text: string;
  hasWeather: boolean;
  weatherData?: CurrentWeatherData;
  weatherType?: 'current' | 'forecast';
  hasFinance: boolean;
  financeData?: MonthlyFinanceData;
  financeType?: 'monthly';
  widgetId?: string;
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
        hasFinance: false,
      };
    }
  }

  // Handle n8n array response format
  if (Array.isArray(response) && response.length > 0) {
    const firstItem = response[0];
    if (firstItem.output) {
      const { AIResponse, weatherAgent, financeAgent } = firstItem.output;
      
      // Check if weather data exists
      if (weatherAgent && weatherAgent.weather === true && weatherAgent.output) {
        const weatherOutput = weatherAgent.output;
        
        // Determine weather type and widget ID
        let weatherType: 'current' | 'forecast' = 'current';
        let widgetId: string | undefined;
        
        // Check for new format with explicit type and widgetId
        if (weatherAgent.type && weatherAgent.type !== 'weatherAgent') {
          // Handle different type formats
          if (weatherAgent.type === 'current' || weatherAgent.type === 'forecast') {
            weatherType = weatherAgent.type as 'current' | 'forecast';
          } else if (weatherAgent.type === 'weather') {
            // Default "weather" type to current weather
            weatherType = 'current';
          } else {
            // Unknown type, detect from data structure
            weatherType = isValidForecastWeatherData(weatherOutput) ? 'forecast' : 'current';
          }
          widgetId = weatherAgent.widgetId;
        } else {
          // Backward compatibility: detect type from data structure
          if (isValidForecastWeatherData(weatherOutput)) {
            weatherType = 'forecast';
            widgetId = 'wig_5dafl1gl'; // Default forecast widget ID
          } else {
            weatherType = 'current';
            widgetId = 'wig_e79yqoni'; // Default current weather widget ID
          }
        }
        
        // Validate weather data based on type
        if (!isValidWeatherData(weatherOutput, weatherType)) {
          console.warn('Invalid weather data structure for type:', weatherType);
          return {
            text: AIResponse || 'Weather data received but could not be displayed properly.',
            hasWeather: false,
            hasFinance: false,
          };
        }
        
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

        // Process weather data based on type
        if (weatherType === 'current') {
          // Cast to current weather data for processing
          const currentWeatherOutput = weatherOutput as any;
          
          const transformedWeatherData: CurrentWeatherData = {
            location: currentWeatherOutput.location,
            temperature: convertToCelsius(currentWeatherOutput.temperature),
            feelsLike: convertToCelsius(currentWeatherOutput.feelsLike),
            condition: currentWeatherOutput.condition,
            conditionImage: currentWeatherOutput.conditionImage,
            humidity: addUnit(currentWeatherOutput.humidity, '%'),
            windSpeed: addUnit(currentWeatherOutput.windSpeed, ' km/h'),
            windDirection: currentWeatherOutput.windDirection,
            pressure: addUnit(currentWeatherOutput.pressure, ' mb'),
            visibility: addUnit(currentWeatherOutput.visibility, ' km'),
            uvIndex: currentWeatherOutput.uvIndex,
            lastUpdated: currentWeatherOutput.lastUpdated,
            cloudCover: currentWeatherOutput.cloudCover ? addUnit(currentWeatherOutput.cloudCover, '%') : undefined,
            dewPoint: currentWeatherOutput.dewPoint ? convertToCelsius(currentWeatherOutput.dewPoint) : undefined,
            airQuality: currentWeatherOutput.airQuality,
          };

          return {
            text: AIResponse || '',
            hasWeather: true,
            weatherData: transformedWeatherData,
            weatherType,
            widgetId,
            hasFinance: false,
          };
        } else {
          // Handle forecast weather data (for future implementation)
          return {
            text: AIResponse || '',
            hasWeather: true,
            weatherData: weatherOutput as CurrentWeatherData, // Temporary cast for compatibility
            weatherType,
            widgetId,
            hasFinance: false,
          };
        }
      }
      
      // Check if finance data exists
      if (financeAgent && financeAgent.financeWidget === true && financeAgent.output) {
        const financeOutput = financeAgent.output;
        
        // Determine finance type and widget ID
        let financeType: 'monthly' = 'monthly';
        let widgetId: string | undefined;
        
        // Check for explicit type and widgetId
        if (financeAgent.type === 'monthly_summary' || financeAgent.type === 'monthly') {
          financeType = 'monthly';
          widgetId = financeAgent.widgetId || 'finmonth';
        } else {
          // Default to monthly finance
          financeType = 'monthly';
          widgetId = 'finmonth';
        }
        
        // Validate finance data
        if (!isValidMonthlyFinanceData(financeOutput)) {
          console.warn('Invalid finance data structure for type:', financeType);
          return {
            text: AIResponse || 'Finance data received but could not be displayed properly.',
            hasWeather: false,
            hasFinance: false,
          };
        }
        
        return {
          text: AIResponse || '',
          hasWeather: false,
          hasFinance: true,
          financeData: financeOutput,
          financeType,
          widgetId,
        };
      }
      
      // No weather or finance data, just return the AI response
      return {
        text: AIResponse || '',
        hasWeather: false,
        hasFinance: false,
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
        hasFinance: false,
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
      hasFinance: false,
    };
  }

  // Fallback - avoid [object Object]
  return {
    text: typeof response === 'string' ? response : '',
    hasWeather: false,
    hasFinance: false,
  };
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

// Helper function to validate monthly finance data
export function isValidMonthlyFinanceData(data: any): data is MonthlyFinanceData {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.title === 'string' &&
    typeof data.subtitle === 'string' &&
    typeof data.monthLabel === 'string' &&
    Array.isArray(data.stats) &&
    Array.isArray(data.transactions) &&
    typeof data.summary === 'string' &&
    data.stats.every((stat: any) => 
      typeof stat.key === 'string' &&
      typeof stat.label === 'string' &&
      typeof stat.value === 'string' &&
      typeof stat.icon === 'string' &&
      typeof stat.accent === 'string'
    ) &&
    data.transactions.every((tx: any) =>
      typeof tx.id === 'string' &&
      typeof tx.merchant === 'string' &&
      typeof tx.typeLabel === 'string' &&
      typeof tx.fee === 'string' &&
      typeof tx.amount === 'string' &&
      typeof tx.icon === 'string' &&
      typeof tx.accent === 'string'
    )
  );
}

// Helper function to validate weather widget data structure
export function validateWeatherWidgetData(data: any): WeatherWidgetData | null {
  if (!data?.weatherAgent?.weather) return null;
  
  const { type, widgetId, output } = data.weatherAgent;
  
  // Support both new format and legacy format
  if (!type || !output) return null;
  
  // Validate type
  const validTypes = ['current', 'forecast', 'weatherAgent', 'weather'];
  if (!validTypes.includes(type)) return null;
  
  // Determine actual weather type
  let weatherType: 'current' | 'forecast' = 'current';
  if (type === 'forecast') {
    weatherType = 'forecast';
  } else if (type === 'weatherAgent' || type === 'current' || type === 'weather') {
    // For backward compatibility, detect from data structure
    weatherType = isValidForecastWeatherData(output) ? 'forecast' : 'current';
  }
  
  // Validate data structure matches type
  if (!isValidWeatherData(output, weatherType)) {
    return null;
  }
  
  return {
    weather: true,
    type: weatherType,
    widgetId: widgetId || (weatherType === 'current' ? 'wig_e79yqoni' : 'wig_5dafl1gl'),
    output
  };
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
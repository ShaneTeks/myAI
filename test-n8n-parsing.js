// Simple test to verify n8n response parsing
const testResponse = [{
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
}];

console.log('Test n8n response:');
console.log(JSON.stringify(testResponse, null, 2));

// Test JSON stringification (what would be stored in the database)
const stringified = JSON.stringify(testResponse);
console.log('\nStringified for database:');
console.log(stringified);

// Test parsing back
try {
  const parsed = JSON.parse(stringified);
  console.log('\nParsed back successfully:');
  console.log('Has weather:', parsed[0].output.weatherAgent.weather);
  console.log('Location:', parsed[0].output.weatherAgent.output.location);
  console.log('AI Response:', parsed[0].output.AIResponse);
} catch (error) {
  console.error('Parsing error:', error);
}
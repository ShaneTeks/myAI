// Quick test for temperature conversion
function convertToCelsius(tempString) {
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
}

// Test cases
console.log('Testing temperature conversion:');
console.log('88.6°F ->', convertToCelsius('88.6°F')); // Should be ~31.4°C
console.log('31.5°C ->', convertToCelsius('31.5°C')); // Should stay 31.5°C
console.log('25 ->', convertToCelsius('25')); // Should be 25°C (assume Celsius)
console.log('77°F ->', convertToCelsius('77°F')); // Should be 25°C
console.log('0°F ->', convertToCelsius('0°F')); // Should be -17.8°C
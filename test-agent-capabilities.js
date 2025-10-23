// Simple test script to verify agent capability synchronization
const { elevenLabsService } = require('./lib/elevenLabsService');

async function testAgentCapabilities() {
  console.log('=== Testing Agent Capability Synchronization ===\n');

  try {
    // Test 1: Check agent configuration
    console.log('1. Testing agent configuration...');
    const agentConfig = elevenLabsService.getAgentConfiguration();
    console.log('✓ Agent configuration loaded');
    console.log('  - Agent ID:', agentConfig.agentId || 'Not configured');
    console.log('  - Weather capability:', agentConfig.capabilities.weather.enabled);
    console.log('  - Structured responses:', agentConfig.capabilities.structuredResponses.enabled);
    console.log('  - Instructions length:', agentConfig.instructions.length, 'characters\n');

    // Test 2: Validate capabilities
    console.log('2. Testing capability validation...');
    const validation = elevenLabsService.validateAgentCapabilities();
    console.log('✓ Capability validation completed');
    console.log('  - Valid:', validation.valid);
    console.log('  - Weather:', validation.capabilities.weather);
    console.log('  - Structured responses:', validation.capabilities.structuredResponses);
    if (validation.errors.length > 0) {
      console.log('  - Errors:', validation.errors);
    }
    if (validation.warnings.length > 0) {
      console.log('  - Warnings:', validation.warnings);
    }
    console.log('');

    // Test 3: Test weather response parsing
    console.log('3. Testing weather response parsing...');
    const sampleWeatherResponse = {
      transcript: JSON.stringify({
        AIResponse: "Here's the current weather in Swakopmund:",
        weatherAgent: {
          weather: true,
          type: "current",
          output: {
            location: "Swakopmund, Namibia",
            temperature: "21°C",
            feelsLike: "21°C",
            condition: "Partly cloudy",
            conditionImage: "https://cdn.weatherapi.com/weather/64x64/day/116.png",
            humidity: "64%",
            windSpeed: "15.5 km/h",
            windDirection: "WNW",
            pressure: "1016 mb",
            visibility: "10 km",
            uvIndex: "11.4",
            lastUpdated: "2025-10-22 13:00"
          }
        }
      }),
      session_id: 'test'
    };

    const processedMessage = elevenLabsService.processVoiceResponseWithCapabilities(sampleWeatherResponse);
    const hasWeatherWidget = processedMessage.widgets?.some(w => w.type === 'weather') || false;
    
    console.log('✓ Weather response parsing completed');
    console.log('  - Weather widget extracted:', hasWeatherWidget);
    console.log('  - Widget count:', processedMessage.widgets?.length || 0);
    console.log('  - Content length:', processedMessage.content.length, 'characters\n');

    // Test 4: Run comprehensive capability tests
    console.log('4. Running comprehensive capability tests...');
    const capabilityTests = await elevenLabsService.runCapabilityTests();
    console.log('✓ Comprehensive tests completed');
    console.log('  - Overall success:', capabilityTests.success);
    console.log('  - Tests passed:', capabilityTests.summary.passed, '/', capabilityTests.summary.total);
    
    capabilityTests.results.forEach(result => {
      console.log(`  - ${result.capability}: ${result.success ? '✓' : '✗'}`);
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
    });
    console.log('');

    // Test 5: Test n8n synchronization
    console.log('5. Testing n8n synchronization...');
    const syncResult = await elevenLabsService.synchronizeWithN8nAgent();
    console.log('✓ N8n synchronization test completed');
    console.log('  - Success:', syncResult.success);
    console.log('  - Synchronized capabilities:', syncResult.synchronized.length);
    console.log('  - Missing capabilities:', syncResult.missing.length);
    console.log('  - Errors:', syncResult.errors.length);
    
    if (syncResult.synchronized.length > 0) {
      console.log('  - Synchronized:', syncResult.synchronized.join(', '));
    }
    if (syncResult.missing.length > 0) {
      console.log('  - Missing:', syncResult.missing.join(', '));
    }
    if (syncResult.errors.length > 0) {
      console.log('  - Errors:', syncResult.errors.join(', '));
    }

    console.log('\n=== Agent Capability Synchronization Test Complete ===');
    console.log('Overall Status:', capabilityTests.success && syncResult.success ? '✓ PASSED' : '✗ ISSUES DETECTED');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAgentCapabilities();
}

module.exports = { testAgentCapabilities };
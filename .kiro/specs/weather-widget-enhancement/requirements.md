# Requirements Document

## Introduction

The application currently uses a forecast widget for displaying current weather data, but should be using the dedicated current weather widget. Additionally, the system needs to support both current weather and forecast widgets simultaneously, requiring updates to the weather data structure and widget parsing logic.

## Glossary

- **Current Weather Widget**: ChatKit widget (wig_e79yqoni) designed specifically for displaying current weather conditions
- **Forecast Widget**: ChatKit widget (wig_5dafl1gl) designed for displaying weather forecasts over multiple days
- **Weather API**: WeatherAPI.com service providing both current and forecast weather data
- **N8N Agent**: The backend agent that processes weather requests and returns structured data
- **Widget Parser**: The application component that processes widget data and renders appropriate UI components

## Requirements

### Requirement 1

**User Story:** As a user, I want to see current weather information displayed using the appropriate current weather widget, so that I get the most relevant and properly formatted current conditions.

#### Acceptance Criteria

1. WHEN the N8N Agent receives a current weather request, THE Weather API SHALL return current weather data using the /current.json endpoint
2. WHEN current weather data is processed, THE Widget Parser SHALL use the current weather widget (wig_e79yqoni) for rendering
3. THE Current Weather Widget SHALL display temperature, condition, location, and weather icon from current weather data
4. THE Current Weather Widget SHALL show real-time weather conditions without forecast information

### Requirement 2

**User Story:** As a user, I want to see weather forecast information displayed using the forecast widget, so that I can plan for upcoming weather conditions.

#### Acceptance Criteria

1. WHEN the N8N Agent receives a forecast weather request, THE Weather API SHALL return forecast data using the /forecast.json endpoint with appropriate parameters
2. WHEN forecast weather data is processed, THE Widget Parser SHALL use the forecast widget (wig_5dafl1gl) for rendering
3. THE Forecast Widget SHALL display multi-day weather predictions with daily high/low temperatures
4. THE Forecast Widget SHALL show weather conditions for each forecasted day with appropriate icons

### Requirement 3

**User Story:** As a user, I want the system to automatically determine whether to show current weather or forecast based on my request, so that I get the most appropriate weather information.

#### Acceptance Criteria

1. WHEN a user asks for current weather conditions, THE N8N Agent SHALL process the request as current weather
2. WHEN a user asks for weather forecast or multi-day weather, THE N8N Agent SHALL process the request as forecast weather
3. THE Widget Parser SHALL automatically select the correct widget type based on the weather data structure received
4. THE System SHALL support both widget types simultaneously in the same conversation

### Requirement 4

**User Story:** As a developer, I want the weather data structure to be properly mapped to the correct widget format, so that both current and forecast widgets display accurate information.

#### Acceptance Criteria

1. THE N8N Agent SHALL structure current weather responses to match the current weather widget requirements
2. THE N8N Agent SHALL structure forecast weather responses to match the forecast widget requirements
3. THE Widget Parser SHALL validate weather data structure before rendering widgets
4. IF weather data structure is invalid, THEN THE Widget Parser SHALL display an error message to the user

### Requirement 5

**User Story:** As a user, I want weather widgets to handle different weather API response formats gracefully, so that I always receive weather information regardless of minor API changes.

#### Acceptance Criteria

1. THE Widget Parser SHALL handle both current weather API response format and forecast API response format
2. WHEN weather data contains both current and forecast information, THE Widget Parser SHALL extract the appropriate data for each widget type
3. THE System SHALL provide fallback display options when specific weather data fields are missing
4. THE Weather Data Processing SHALL maintain backward compatibility with existing weather responses
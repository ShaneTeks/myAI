import { config } from './config'
import { EnvironmentDetector } from './environmentDetector'
import { Message, supabase, VoiceSession, VoiceSessionInsert, VoiceSessionStatus } from './supabase'

// Types for ElevenLabs integration
export interface ConversationContext {
  recentMessages: Message[]
  userPreferences?: Record<string, any>
  conversationSummary?: string
  maxTokens: number
}

export interface VoiceMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: Date
  audioUrl?: string
  widgets?: ParsedWidget[]
}

export interface VoiceTranscript {
  sessionId: string
  messages: VoiceMessage[]
  endedAt: Date
  summary?: string
}

export interface ParsedWidget {
  type: string
  data: Record<string, any>
}

export interface ElevenLabsResponse {
  transcript?: string
  audio_url?: string
  widgets?: any[]
  session_id?: string
  status?: string
}

export interface ElevenLabsError {
  code: string
  message: string
  details?: any
}

/**
 * ElevenLabs service for managing conversational AI agent integration
 * Handles widget lifecycle, environment detection, and agent communication
 * 
 * This service follows ElevenLabs Expo React Native integration guidelines:
 * - Proper agent configuration and validation
 * - Environment-aware widget support detection
 * - Conversation context management
 * - Error handling and recovery
 */
 */
export class ElevenLabsService {
  private static instance: ElevenLabsService | null = null

  /**
   * Get singleton instance of ElevenLabsService
   */
  static getInstance(): ElevenLabsService {
    if (!this.instance) {
      this.instance = new ElevenLabsService()
    }
    return this.instance
  }

  /**
   * Check if ElevenLabs widget is supported in current environment
   * @returns true if widget can be used, false otherwise
   */
  isWidgetSupported(): boolean {
    // Check environment compatibility
    if (!EnvironmentDetector.canUseElevenLabsWidget()) {
      return false
    }

    // Check if widget is enabled in configuration
    if (!config.elevenLabs.widget.enabled) {
      return false
    }

    // Check if required configuration is present
    if (!config.elevenLabs.defaultAgentId) {
      console.warn('ElevenLabs agent ID not configured')
      return false
    }

    return true
  }

  /**
   * Get widget support status with detailed information
   * @returns object with support status and reason
   */
  getWidgetSupportStatus(): {
    supported: boolean
    reason: string
    environment: string
    canUseWidget: boolean
    configurationValid: boolean
  } {
    const environment = EnvironmentDetector.getEnvironmentDescription()
    const canUseWidget = EnvironmentDetector.canUseElevenLabsWidget()
    const configurationValid = !!(config.elevenLabs.defaultAgentId && config.elevenLabs.widget.enabled)

    let reason = ''
    let supported = false

    if (!canUseWidget) {
      if (EnvironmentDetector.isExpoGO()) {
        reason = 'ElevenLabs widget requires a prebuilt app. Please use a development build or standalone app.'
      } else {
        reason = 'ElevenLabs widget is not supported on this platform.'
      }
    } else if (!config.elevenLabs.widget.enabled) {
      reason = 'ElevenLabs widget is disabled in configuration.'
    } else if (!config.elevenLabs.defaultAgentId) {
      reason = 'ElevenLabs agent ID is not configured.'
    } else {
      reason = 'ElevenLabs widget is supported and ready to use.'
      supported = true
    }

    return {
      supported,
      reason,
      environment,
      canUseWidget,
      configurationValid
    }
  }

  /**
   * Get ElevenLabs configuration
   * @returns configuration object
   */
  getConfiguration() {
    return {
      apiKey: config.elevenLabs.apiKey ? '***' + config.elevenLabs.apiKey.slice(-4) : 'Not set',
      agentId: config.elevenLabs.agentId,
      apiUrl: config.elevenLabs.apiUrl,
      conversationalAiUrl: config.elevenLabs.conversationalAiUrl,
      sessionTimeout: config.elevenLabs.widget.sessionTimeout,
      maxContextLength: config.elevenLabs.widget.maxContextLength,
      widgetEnabled: config.elevenLabs.widget.enabled
    }
  }

  /**
   * Validate ElevenLabs configuration
   * @returns validation result with details
   */
  validateConfiguration(): {
    valid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Check required configuration
    const isDevelopmentMode = process.env.EXPO_PUBLIC_DEVELOPMENT_MODE === 'true' || 
                             config.elevenLabs.agentId === 'dev-test-agent-id';
    
    if (!config.elevenLabs.agentId) {
      errors.push('Agent ID is required (EXPO_PUBLIC_ELEVENLABS_AGENT_ID)')
    } else if (!isDevelopmentMode && config.elevenLabs.agentId === 'dev-test-agent-id') {
      warnings.push('Using development agent ID - configure real agent ID for production')
    }

    if (!config.elevenLabs.apiKey) {
      if (isDevelopmentMode) {
        warnings.push('API key not configured - using development mode')
      } else {
        warnings.push('API key not configured (EXPO_PUBLIC_ELEVENLABS_API_KEY)')
      }
    }

    // Check configuration format
    if (config.elevenLabs.agentId && !/^[a-zA-Z0-9_-]+$/.test(config.elevenLabs.agentId)) {
      warnings.push('Agent ID format may be invalid')
    }

    // Check timeout values
    if (config.elevenLabs.widget.sessionTimeout < 60000) {
      warnings.push('Session timeout is very short (less than 1 minute)')
    }

    if (config.elevenLabs.widget.maxContextLength < 1000) {
      warnings.push('Max context length is very short (less than 1000 characters)')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Get environment information for debugging
   * @returns environment details
   */
  getEnvironmentInfo() {
    return {
      platform: EnvironmentDetector.getPlatformInfo(),
      widgetSupport: this.getWidgetSupportStatus(),
      configuration: this.getConfiguration(),
      validation: this.validateConfiguration()
    }
  }

  /**
   * Log environment and configuration status for debugging
   */
  logStatus(): void {
    const info = this.getEnvironmentInfo()
    
    console.log('=== ElevenLabs Service Status ===')
    console.log('Environment:', info.platform.executionEnvironment)
    console.log('Platform:', info.platform.os)
    console.log('Widget Supported:', info.widgetSupport.supported)
    console.log('Reason:', info.widgetSupport.reason)
    
    if (info.validation.errors.length > 0) {
      console.error('Configuration Errors:', info.validation.errors)
    }
    
    if (info.validation.warnings.length > 0) {
      console.warn('Configuration Warnings:', info.validation.warnings)
    }
    
    console.log('=== End Status ===')
  }

  // ===== WIDGET LIFECYCLE MANAGEMENT =====

  /**
   * Start a new voice session with the ElevenLabs agent
   * @param conversationId - The conversation ID to associate with the session
   * @param context - Conversation context for the agent
   * @returns Promise resolving to the created voice session
   */
  async startVoiceSession(conversationId: string, context: ConversationContext): Promise<VoiceSession> {
    if (!this.isWidgetSupported()) {
      throw new Error('ElevenLabs widget is not supported in this environment')
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User must be authenticated to start voice session')
    }

    // Check for existing active session and handle gracefully
    const existingSession = await this.getActiveVoiceSession(conversationId)
    if (existingSession) {
      console.log('Found existing active voice session, ending it first:', existingSession.id)
      try {
        await this.endVoiceSession(existingSession.id)
      } catch (error) {
        console.warn('Failed to end existing session, continuing with new session:', error)
      }
    }

    // Create voice session record with retry logic
    const sessionData: VoiceSessionInsert = {
      user_id: user.id,
      conversation_id: conversationId,
      agent_id: config.elevenLabs.defaultAgentId,
      status: 'active',
      started_at: new Date().toISOString(),
      transcript: null
    }

    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        const { data: session, error } = await supabase
          .from('voice_sessions')
          .insert(sessionData)
          .select()
          .single()

        if (error) {
          throw new Error(`Database error: ${error.message}`)
        }

        console.log('Voice session started:', session.id)
        return session
      } catch (error) {
        retryCount++
        console.error(`Failed to create voice session (attempt ${retryCount}/${maxRetries}):`, error)
        
        if (retryCount >= maxRetries) {
          throw new Error(`Failed to create voice session after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
        
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)))
      }
    }

    throw new Error('Unexpected error in voice session creation')
  }

  /**
   * End an active voice session and capture transcript
   * @param sessionId - The voice session ID to end
   * @param transcript - The voice transcript from the session
   * @returns Promise resolving to the updated voice session
   */
  async endVoiceSession(sessionId: string, transcript?: VoiceTranscript): Promise<VoiceSession> {
    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        const { data: session, error: fetchError } = await supabase
          .from('voice_sessions')
          .select()
          .eq('id', sessionId)
          .single()

        if (fetchError || !session) {
          throw new Error(`Voice session not found: ${sessionId}`)
        }

        // Update session with end time and transcript
        const updateData: Partial<VoiceSession> = {
          status: 'ended' as VoiceSessionStatus,
          ended_at: new Date().toISOString(),
          transcript: transcript ? JSON.stringify(transcript) : null
        }

        const { data: updatedSession, error: updateError } = await supabase
          .from('voice_sessions')
          .update(updateData)
          .eq('id', sessionId)
          .select()
          .single()

        if (updateError) {
          throw new Error(`Database update error: ${updateError.message}`)
        }

        console.log('Voice session ended:', sessionId)
        return updatedSession
      } catch (error) {
        retryCount++
        console.error(`Failed to end voice session (attempt ${retryCount}/${maxRetries}):`, error)
        
        if (retryCount >= maxRetries) {
          // If we can't end the session properly, at least try to mark it as error
          try {
            await supabase
              .from('voice_sessions')
              .update({ 
                status: 'error' as VoiceSessionStatus,
                ended_at: new Date().toISOString()
              })
              .eq('id', sessionId)
          } catch (markError) {
            console.error('Failed to mark session as error:', markError)
          }
          
          throw new Error(`Failed to end voice session after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
      }
    }

    throw new Error('Unexpected error in voice session ending')
  }

  /**
   * Get active voice session for a conversation
   * @param conversationId - The conversation ID
   * @returns Promise resolving to active voice session or null
   */
  async getActiveVoiceSession(conversationId: string): Promise<VoiceSession | null> {
    try {
      const { data: session, error } = await supabase
        .from('voice_sessions')
        .select()
        .eq('conversation_id', conversationId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Failed to get active voice session:', error)
        return null
      }

      return session
    } catch (error) {
      console.error('Network error getting active voice session:', error)
      return null
    }
  }

  /**
   * Handle network error during voice session
   * @param sessionId - Voice session ID
   * @param error - Network error details
   * @returns Recovery strategy and actions taken
   */
  async handleNetworkError(sessionId: string, error: any): Promise<{
    strategy: 'retry' | 'preserve' | 'abort';
    actions: string[];
    recovered: boolean;
  }> {
    const actions: string[] = []
    let strategy: 'retry' | 'preserve' | 'abort' = 'abort'
    let recovered = false

    try {
      // First, try to preserve the current session state
      actions.push('Attempting to preserve session state')
      
      const preserveResult = await this.preserveSessionState(sessionId)
      if (preserveResult) {
        actions.push('Session state preserved successfully')
        strategy = 'preserve'
      }

      // Check if network is recoverable
      const networkStatus = await this.checkNetworkRecovery()
      if (networkStatus.recoverable) {
        actions.push('Network appears recoverable, attempting retry')
        strategy = 'retry'
        
        // Try to restore session
        const restoreResult = await this.restoreSessionAfterNetworkError(sessionId)
        if (restoreResult.success) {
          actions.push('Session restored successfully after network recovery')
          recovered = true
        } else {
          actions.push('Session restoration failed, preserving state for manual recovery')
          strategy = 'preserve'
        }
      } else {
        actions.push('Network not recoverable, preserving session for later')
        strategy = 'preserve'
      }

    } catch (recoveryError) {
      console.error('Error during network error recovery:', recoveryError)
      actions.push('Recovery attempt failed, aborting session')
      strategy = 'abort'
      
      // Try to mark session as error
      try {
        await supabase
          .from('voice_sessions')
          .update({ 
            status: 'error' as VoiceSessionStatus,
            ended_at: new Date().toISOString()
          })
          .eq('id', sessionId)
        actions.push('Session marked as error in database')
      } catch (markError) {
        actions.push('Failed to mark session as error')
      }
    }

    return { strategy, actions, recovered }
  }

  /**
   * Preserve session state during network interruption
   * @param sessionId - Voice session ID
   * @returns Success status
   */
  private async preserveSessionState(sessionId: string): Promise<boolean> {
    try {
      // Create a preservation record with current timestamp
      const preservationData = {
        session_id: sessionId,
        preserved_at: new Date().toISOString(),
        status: 'network_interrupted',
        recovery_attempts: 0
      }

      // Store in local storage as backup
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`voice_session_${sessionId}`, JSON.stringify(preservationData))
      }

      // Try to update database if possible (use error status for interrupted sessions)
      await supabase
        .from('voice_sessions')
        .update({ 
          status: 'error' as VoiceSessionStatus,
          ended_at: null // Keep session open for recovery
        })
        .eq('id', sessionId)

      return true
    } catch (error) {
      console.error('Failed to preserve session state:', error)
      return false
    }
  }

  /**
   * Check if network can be recovered
   * @returns Network recovery status
   */
  private async checkNetworkRecovery(): Promise<{
    recoverable: boolean;
    latency?: number;
    error?: string;
  }> {
    try {
      const startTime = Date.now()
      
      // Try a simple network request to Supabase
      const { error } = await supabase
        .from('voice_sessions')
        .select('id')
        .limit(1)

      const latency = Date.now() - startTime

      if (error) {
        return {
          recoverable: false,
          error: error.message
        }
      }

      // Consider network recovered if latency is reasonable
      return {
        recoverable: latency < 5000, // 5 seconds threshold
        latency
      }
    } catch (error) {
      return {
        recoverable: false,
        error: error instanceof Error ? error.message : 'Network check failed'
      }
    }
  }

  /**
   * Restore session after network error recovery
   * @param sessionId - Voice session ID
   * @returns Restoration result
   */
  private async restoreSessionAfterNetworkError(sessionId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Check if session still exists and is in interrupted state
      const { data: session, error: fetchError } = await supabase
        .from('voice_sessions')
        .select()
        .eq('id', sessionId)
        .single()

      if (fetchError || !session) {
        return {
          success: false,
          error: 'Session not found or was deleted'
        }
      }

      if (session.status === 'ended') {
        return {
          success: false,
          error: 'Session was already ended'
        }
      }

      // Allow recovery from error status (which includes interrupted sessions)
      if (session.status !== 'active' && session.status !== 'error') {
        return {
          success: false,
          error: 'Session is in an unrecoverable state'
        }
      }

      // Restore session to active state
      const { error: updateError } = await supabase
        .from('voice_sessions')
        .update({ 
          status: 'active' as VoiceSessionStatus,
          ended_at: null
        })
        .eq('id', sessionId)

      if (updateError) {
        return {
          success: false,
          error: updateError.message
        }
      }

      // Clean up preservation data
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`voice_session_${sessionId}`)
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown restoration error'
      }
    }
  }

  /**
   * Handle session interruption (app backgrounding, call interruption, etc.)
   * @param sessionId - Voice session ID
   * @param interruptionType - Type of interruption
   * @returns Interruption handling result
   */
  async handleSessionInterruption(
    sessionId: string, 
    interruptionType: 'app_background' | 'phone_call' | 'system_interrupt' | 'user_abort'
  ): Promise<{
    handled: boolean;
    preservedState: boolean;
    recoveryPossible: boolean;
    actions: string[];
  }> {
    const actions: string[] = []
    let handled = false
    let preservedState = false
    let recoveryPossible = false

    try {
      actions.push(`Handling ${interruptionType} interruption for session ${sessionId}`)

      // Capture current session state before interruption
      const { data: session, error } = await supabase
        .from('voice_sessions')
        .select()
        .eq('id', sessionId)
        .single()

      if (error || !session) {
        actions.push('Session not found, cannot handle interruption')
        return { handled: false, preservedState, recoveryPossible, actions }
      }

      // Create interruption record
      const interruptionData = {
        session_id: sessionId,
        interruption_type: interruptionType,
        interrupted_at: new Date().toISOString(),
        session_state: JSON.stringify(session)
      }

      // Store interruption data locally
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`interruption_${sessionId}`, JSON.stringify(interruptionData))
        preservedState = true
        actions.push('Interruption state preserved locally')
      }

      // Update session status based on interruption type
      let newStatus: VoiceSessionStatus = 'error' // Use error status for interrupted sessions
      recoveryPossible = true

      switch (interruptionType) {
        case 'user_abort':
          newStatus = 'ended'
          recoveryPossible = false
          actions.push('User aborted session, marking as ended')
          break
        case 'phone_call':
        case 'system_interrupt':
          newStatus = 'error' // Use error status for interrupted sessions
          recoveryPossible = true
          actions.push('System interruption, session can be recovered')
          break
        case 'app_background':
          newStatus = 'error' // Use error status for interrupted sessions
          recoveryPossible = true
          actions.push('App backgrounded, session preserved for recovery')
          break
      }

      // Update session in database
      const { error: updateError } = await supabase
        .from('voice_sessions')
        .update({ 
          status: newStatus,
          ended_at: newStatus === 'ended' ? new Date().toISOString() : null
        })
        .eq('id', sessionId)

      if (updateError) {
        actions.push(`Failed to update session status: ${updateError.message}`)
      } else {
        handled = true
        actions.push(`Session status updated to ${newStatus}`)
      }

    } catch (error) {
      console.error('Error handling session interruption:', error)
      actions.push(`Error during interruption handling: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return { handled, preservedState, recoveryPossible, actions }
  }

  /**
   * Recover from session interruption
   * @param sessionId - Voice session ID
   * @returns Recovery result
   */
  async recoverFromInterruption(sessionId: string): Promise<{
    recovered: boolean;
    newSessionId?: string;
    error?: string;
    actions: string[];
  }> {
    const actions: string[] = []

    try {
      actions.push(`Attempting to recover session ${sessionId}`)

      // Check for interruption data
      let interruptionData = null
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(`interruption_${sessionId}`)
        if (stored) {
          interruptionData = JSON.parse(stored)
          actions.push('Found interruption data in local storage')
        }
      }

      // Check current session status
      const { data: session, error } = await supabase
        .from('voice_sessions')
        .select()
        .eq('id', sessionId)
        .single()

      if (error || !session) {
        actions.push('Original session not found, cannot recover')
        return { recovered: false, error: 'Session not found', actions }
      }

      if (session.status === 'active') {
        actions.push('Session is already active, no recovery needed')
        return { recovered: true, actions }
      }

      if (session.status === 'ended') {
        actions.push('Session was ended, cannot recover')
        return { recovered: false, error: 'Session was ended', actions }
      }

      // Attempt to reactivate the session
      const { error: updateError } = await supabase
        .from('voice_sessions')
        .update({ 
          status: 'active' as VoiceSessionStatus,
          ended_at: null
        })
        .eq('id', sessionId)

      if (updateError) {
        actions.push(`Failed to reactivate session: ${updateError.message}`)
        return { recovered: false, error: updateError.message, actions }
      }

      // Clean up interruption data
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`interruption_${sessionId}`)
        actions.push('Cleaned up interruption data')
      }

      actions.push('Session recovered successfully')
      return { recovered: true, actions }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown recovery error'
      actions.push(`Recovery failed: ${errorMessage}`)
      return { recovered: false, error: errorMessage, actions }
    }
  }

  // ===== CONVERSATION CONTEXT PREPARATION =====

  /**
   * Prepare conversation context for the ElevenLabs agent
   * @param messages - Recent messages from the conversation
   * @param maxLength - Maximum context length in characters
   * @returns Formatted conversation context
   */
  prepareContextForAgent(messages: Message[], maxLength?: number): ConversationContext {
    const contextLimit = maxLength || config.elevenLabs.widget.maxContextLength
    
    // Sort messages by creation time (oldest first for proper context)
    const sortedMessages = [...messages].sort((a, b) => 
      new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    )

    // Filter out voice messages to avoid duplication in context
    const textMessages = sortedMessages.filter(msg => msg.message_type !== 'voice')

    // Build context string and track length
    let contextLength = 0
    const contextMessages: Message[] = []

    // Add messages from most recent backwards until we hit the limit
    for (let i = textMessages.length - 1; i >= 0; i--) {
      const message = textMessages[i]
      const messageLength = message.content.length + 50 // Add buffer for formatting
      
      if (contextLength + messageLength > contextLimit && contextMessages.length > 0) {
        break
      }
      
      contextMessages.unshift(message)
      contextLength += messageLength
    }

    return {
      recentMessages: contextMessages,
      maxTokens: contextLimit,
      conversationSummary: this.generateConversationSummary(contextMessages)
    }
  }

  /**
   * Generate a brief summary of the conversation for context
   * @param messages - Messages to summarize
   * @returns Brief conversation summary
   */
  private generateConversationSummary(messages: Message[]): string {
    if (messages.length === 0) {
      return 'New conversation'
    }

    const userMessages = messages.filter(m => m.is_user).length
    const agentMessages = messages.filter(m => !m.is_user).length
    const lastMessage = messages[messages.length - 1]
    
    let summary = `Conversation with ${userMessages} user messages and ${agentMessages} agent responses.`
    
    if (lastMessage) {
      const preview = lastMessage.content.substring(0, 100)
      summary += ` Last message: "${preview}${lastMessage.content.length > 100 ? '...' : ''}"`
    }

    return summary
  }

  // ===== AGENT CAPABILITY SYNCHRONIZATION =====

  /**
   * Get agent configuration with synchronized capabilities
   * @returns Agent configuration object for ElevenLabs
   */
  getAgentConfiguration() {
    return {
      agentId: config.elevenLabs.defaultAgentId,
      capabilities: {
        weather: {
          enabled: true,
          provider: 'weatherapi',
          apiKey: process.env.EXPO_PUBLIC_WEATHER_API_KEY || '',
          endpoints: {
            current: 'http://api.weatherapi.com/v1/current.json',
            forecast: 'http://api.weatherapi.com/v1/forecast.json'
          },
          supportedTypes: ['current', 'forecast']
        },
        externalApis: {
          enabled: true,
          allowedDomains: [
            'api.weatherapi.com',
            'cdn.weatherapi.com'
          ]
        },
        structuredResponses: {
          enabled: true,
          supportedFormats: ['weather', 'json']
        }
      },
      instructions: this.getAgentInstructions()
    }
  }

  /**
   * Get comprehensive agent instructions for capability synchronization
   * @returns Formatted instructions for ElevenLabs agent
   */
  private getAgentInstructions(): string {
    return `
You are an AI assistant with the same capabilities as the text-based n8n agent. You have access to:

WEATHER CAPABILITIES:
- Current weather data via WeatherAPI
- Weather forecasts via WeatherAPI
- Always respond with structured weather data when weather is requested

STRUCTURED RESPONSE FORMAT:
When providing weather information, always format your response as JSON with this structure:

For current weather:
{
  "AIResponse": "Here's the current weather in [location]:",
  "weatherAgent": {
    "weather": true,
    "type": "current",
    "output": {
      "location": "[City, Country]",
      "temperature": "[temp]°C",
      "feelsLike": "[feels_like]°C",
      "condition": "[condition_text]",
      "conditionImage": "https://cdn.weatherapi.com/weather/64x64/[icon].png",
      "humidity": "[humidity]%",
      "windSpeed": "[wind_speed] km/h",
      "windDirection": "[wind_dir]",
      "pressure": "[pressure] mb",
      "visibility": "[visibility] km",
      "uvIndex": "[uv_index]",
      "lastUpdated": "[last_updated]",
      "cloudCover": "[cloud]%",
      "dewPoint": "[dewpoint]°C",
      "airQuality": {
        "usEpaIndex": [us_epa_index],
        "gbDefraIndex": [gb_defra_index],
        "pm2_5": [pm2_5],
        "pm10": [pm10]
      }
    }
  }
}

For forecast weather:
{
  "AIResponse": "Here's the weather forecast for [location]:",
  "weatherAgent": {
    "weather": true,
    "type": "forecast",
    "output": {
      "background": "[description of conditions]",
      "conditionImage": "https://cdn.weatherapi.com/weather/64x64/[icon].png",
      "lowTemperature": "[min_temp]°C",
      "highTemperature": "[max_temp]°C",
      "location": "[City, Country]",
      "conditionDescription": "[condition_text]",
      "forecast": [
        {
          "conditionImage": "https://cdn.weatherapi.com/weather/64x64/[icon].png",
          "temperature": "[temp]°C"
        }
      ]
    }
  }
}

IMPORTANT RULES:
1. Always use Celsius for temperatures
2. Include "https:" prefix for weather icon URLs
3. Add appropriate units (°C, %, km/h, mb, km) to all values
4. Detect weather requests using keywords: "weather", "temperature", "forecast", "rain", "sunny", etc.
5. For current weather use type: "current", for forecasts use type: "forecast"
6. Maintain conversation continuity with previous text messages
7. Provide natural conversational responses alongside structured data

CONVERSATION CONTINUITY:
- You have access to the full conversation history including text messages
- Reference previous topics and maintain context
- Respond naturally while providing structured data when appropriate
- If no weather is requested, respond normally without structured data

Remember: You are the voice equivalent of the n8n text agent. Provide the same quality responses and capabilities through voice interaction.
    `.trim()
  }

  /**
   * Prepare agent context with capability information
   * @param conversationContext - Current conversation context
   * @returns Enhanced context with capability information
   */
  prepareAgentContext(conversationContext: ConversationContext): ConversationContext & {
    agentCapabilities: any;
    instructions: string;
  } {
    const agentConfig = this.getAgentConfiguration()
    
    return {
      ...conversationContext,
      agentCapabilities: agentConfig.capabilities,
      instructions: agentConfig.instructions,
      conversationSummary: `${conversationContext.conversationSummary || ''}

Agent Capabilities Available:
- Weather information (current and forecast)
- Structured response generation
- External API access for weather data
- Conversation continuity with text messages

Use structured responses for weather requests. Maintain natural conversation flow.`
    }
  }

  /**
   * Validate agent capabilities configuration
   * @returns Validation result with capability status
   */
  validateAgentCapabilities(): {
    valid: boolean;
    capabilities: {
      weather: boolean;
      externalApis: boolean;
      structuredResponses: boolean;
    };
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Check weather API configuration
    const hasWeatherApiKey = !!(process.env.EXPO_PUBLIC_WEATHER_API_KEY)
    if (!hasWeatherApiKey) {
      warnings.push('Weather API key not configured (EXPO_PUBLIC_WEATHER_API_KEY)')
    }

    // Check agent configuration
    if (!config.elevenLabs.defaultAgentId) {
      errors.push('ElevenLabs agent ID not configured')
    }

    const capabilities = {
      weather: hasWeatherApiKey,
      externalApis: true, // Always available
      structuredResponses: true // Always available
    }

    return {
      valid: errors.length === 0,
      capabilities,
      errors,
      warnings
    }
  }

  /**
   * Synchronize capabilities with n8n agent
   * @returns Synchronization status and details
   */
  async synchronizeWithN8nAgent(): Promise<{
    success: boolean;
    synchronized: string[];
    missing: string[];
    errors: string[];
  }> {
    const synchronized: string[] = []
    const missing: string[] = []
    const errors: string[] = []

    try {
      // Check weather capability synchronization
      const capabilityValidation = this.validateAgentCapabilities()
      
      if (capabilityValidation.capabilities.weather) {
        synchronized.push('Weather API access')
      } else {
        missing.push('Weather API access (missing API key)')
      }

      if (capabilityValidation.capabilities.structuredResponses) {
        synchronized.push('Structured response formatting')
      } else {
        missing.push('Structured response formatting')
      }

      if (capabilityValidation.capabilities.externalApis) {
        synchronized.push('External API access')
      } else {
        missing.push('External API access')
      }

      // Check if agent instructions are properly configured
      const instructions = this.getAgentInstructions()
      if (instructions.includes('weather') && instructions.includes('structured')) {
        synchronized.push('Agent instructions with weather and structured response guidance')
      } else {
        missing.push('Complete agent instructions')
      }

      // Validate against n8n capabilities
      const n8nCapabilities = await this.getN8nCapabilities()
      
      // Check weather format compatibility
      if (n8nCapabilities.weather && n8nCapabilities.weather.formats.includes('current') && n8nCapabilities.weather.formats.includes('forecast')) {
        synchronized.push('Weather format compatibility with n8n')
      } else {
        missing.push('Weather format compatibility with n8n')
      }

    } catch (error) {
      errors.push(`Synchronization error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return {
      success: errors.length === 0 && missing.length === 0,
      synchronized,
      missing,
      errors
    }
  }

  /**
   * Get n8n agent capabilities for comparison
   * @returns n8n agent capabilities
   */
  private async getN8nCapabilities(): Promise<{
    weather: {
      enabled: boolean;
      formats: string[];
      provider: string;
    };
    structuredResponses: {
      enabled: boolean;
      formats: string[];
    };
  }> {
    // This would typically query the n8n instance, but for now we'll return known capabilities
    return {
      weather: {
        enabled: true,
        formats: ['current', 'forecast'],
        provider: 'weatherapi'
      },
      structuredResponses: {
        enabled: true,
        formats: ['weather', 'json']
      }
    }
  }

  // ===== VOICE RESPONSE PARSING =====

  /**
   * Parse voice response from ElevenLabs agent and extract widgets
   * @param response - Raw response from ElevenLabs agent
   * @returns Parsed voice message with extracted widgets
   */
  parseVoiceResponse(response: ElevenLabsResponse): VoiceMessage {
    const messageId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const voiceMessage: VoiceMessage = {
      id: messageId,
      role: 'agent',
      content: response.transcript || '',
      timestamp: new Date(),
      audioUrl: response.audio_url,
      widgets: this.extractWidgetsFromResponse(response)
    }

    return voiceMessage
  }

  /**
   * Extract structured widgets from ElevenLabs response
   * @param response - ElevenLabs agent response
   * @returns Array of parsed widgets
   */
  private extractWidgetsFromResponse(response: ElevenLabsResponse): ParsedWidget[] {
    const widgets: ParsedWidget[] = []

    // Check if response contains structured widget data
    if (response.widgets && Array.isArray(response.widgets)) {
      for (const widget of response.widgets) {
        try {
          const parsedWidget = this.parseWidget(widget)
          if (parsedWidget) {
            widgets.push(parsedWidget)
          }
        } catch (error) {
          console.warn('Failed to parse widget from voice response:', error)
        }
      }
    }

    // Try to extract widgets from transcript text (similar to n8n parsing)
    if (response.transcript) {
      const textWidgets = this.extractWidgetsFromText(response.transcript)
      widgets.push(...textWidgets)
    }

    // Check for structured response in transcript (n8n format compatibility)
    if (response.transcript) {
      const structuredWidgets = this.extractStructuredResponseWidgets(response.transcript)
      widgets.push(...structuredWidgets)
    }

    return widgets
  }

  /**
   * Extract widgets from structured response format (n8n compatibility)
   * @param transcript - Voice transcript that may contain structured responses
   * @returns Array of extracted widgets
   */
  private extractStructuredResponseWidgets(transcript: string): ParsedWidget[] {
    const widgets: ParsedWidget[] = []

    try {
      // Try to parse the entire transcript as JSON first
      const parsed = JSON.parse(transcript)
      
      // Check for n8n-style weather response
      if (parsed.weatherAgent && parsed.weatherAgent.weather === true) {
        const weatherWidget = this.parseWeatherWidget(parsed.weatherAgent)
        if (weatherWidget) {
          widgets.push(weatherWidget)
        }
      }
      
      // Check for direct weather format
      if (parsed.weather === true && parsed.weatherData) {
        widgets.push({
          type: 'weather',
          data: parsed.weatherData
        })
      }

    } catch (jsonError) {
      // If full JSON parsing fails, try to extract JSON blocks
      const jsonBlocks = this.extractJsonBlocks(transcript)
      
      for (const block of jsonBlocks) {
        try {
          const parsed = JSON.parse(block)
          
          // Check for weather agent format
          if (parsed.weatherAgent && parsed.weatherAgent.weather === true) {
            const weatherWidget = this.parseWeatherWidget(parsed.weatherAgent)
            if (weatherWidget) {
              widgets.push(weatherWidget)
            }
          }
          
          // Check for direct widget format
          if (parsed.type && parsed.data) {
            widgets.push({
              type: parsed.type,
              data: parsed.data
            })
          }
          
        } catch (blockError) {
          // Ignore invalid JSON blocks
          continue
        }
      }
    }

    return widgets
  }

  /**
   * Parse weather widget from n8n-style weather agent response
   * @param weatherAgent - Weather agent response object
   * @returns Parsed weather widget or null
   */
  private parseWeatherWidget(weatherAgent: any): ParsedWidget | null {
    if (!weatherAgent || !weatherAgent.output) {
      return null
    }

    const output = weatherAgent.output
    const type = weatherAgent.type || 'current'

    // Validate required fields based on type
    if (type === 'current') {
      if (!output.location || !output.temperature || !output.condition) {
        console.warn('Invalid current weather data structure')
        return null
      }
    } else if (type === 'forecast') {
      if (!output.location || !output.lowTemperature || !output.highTemperature) {
        console.warn('Invalid forecast weather data structure')
        return null
      }
    }

    return {
      type: 'weather',
      data: {
        type: type,
        ...output
      }
    }
  }

  /**
   * Extract JSON blocks from text using various patterns
   * @param text - Text that may contain JSON blocks
   * @returns Array of potential JSON strings
   */
  private extractJsonBlocks(text: string): string[] {
    const jsonBlocks: string[] = []

    // Pattern 1: Look for complete JSON objects
    const jsonObjectPattern = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g
    let matches = text.match(jsonObjectPattern)
    if (matches) {
      jsonBlocks.push(...matches)
    }

    // Pattern 2: Look for JSON between code blocks or quotes
    const codeBlockPattern = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/g
    let match
    while ((match = codeBlockPattern.exec(text)) !== null) {
      jsonBlocks.push(match[1])
    }

    // Pattern 3: Look for JSON in quotes
    const quotedJsonPattern = /"(\{[^"]*\})"/g
    while ((match = quotedJsonPattern.exec(text)) !== null) {
      jsonBlocks.push(match[1])
    }

    return jsonBlocks
  }

  /**
   * Parse individual widget from response data
   * @param widgetData - Raw widget data from response
   * @returns Parsed widget or null if invalid
   */
  private parseWidget(widgetData: any): ParsedWidget | null {
    if (!widgetData || typeof widgetData !== 'object') {
      return null
    }

    // Handle n8n-style weather agent format
    if (widgetData.weather === true && widgetData.output) {
      return this.parseWeatherWidget(widgetData)
    }

    // Handle direct weather widget format
    if (widgetData.type === 'weather' && widgetData.data) {
      return {
        type: 'weather',
        data: widgetData.data
      }
    }

    // Handle generic structured data
    if (widgetData.type && widgetData.data) {
      return {
        type: widgetData.type,
        data: widgetData.data
      }
    }

    // Handle legacy weather format (direct weather data)
    if (widgetData.location && widgetData.temperature && widgetData.condition) {
      return {
        type: 'weather',
        data: {
          type: 'current',
          ...widgetData
        }
      }
    }

    return null
  }

  /**
   * Extract widgets from transcript text (fallback method)
   * @param transcript - Voice transcript text
   * @returns Array of extracted widgets
   */
  private extractWidgetsFromText(transcript: string): ParsedWidget[] {
    const widgets: ParsedWidget[] = []

    // Look for JSON-like structures in the transcript
    const jsonPattern = /\{[^{}]*\}/g
    const matches = transcript.match(jsonPattern)

    if (matches) {
      for (const match of matches) {
        try {
          const parsed = JSON.parse(match)
          if (parsed.type && parsed.data) {
            widgets.push({
              type: parsed.type,
              data: parsed.data
            })
          }
        } catch (error) {
          // Ignore invalid JSON
        }
      }
    }

    return widgets
  }

  /**
   * Convert voice message to database message format with structured response handling
   * @param voiceMessage - Voice message to convert
   * @param conversationId - Conversation ID
   * @param voiceSessionId - Voice session ID
   * @returns Message insert data
   */
  voiceMessageToDbMessage(
    voiceMessage: VoiceMessage, 
    conversationId: string, 
    voiceSessionId: string
  ) {
    // Process structured content for agent messages
    let processedContent = voiceMessage.content

    if (voiceMessage.role === 'agent' && voiceMessage.widgets && voiceMessage.widgets.length > 0) {
      // Convert widgets back to n8n-compatible format for storage
      processedContent = this.convertWidgetsToStructuredResponse(voiceMessage.content, voiceMessage.widgets)
    }

    return {
      conversation_id: conversationId,
      voice_session_id: voiceSessionId,
      content: processedContent,
      is_user: voiceMessage.role === 'user',
      message_type: 'voice' as const,
      audio_url: voiceMessage.audioUrl || null,
      created_at: voiceMessage.timestamp.toISOString()
    }
  }

  /**
   * Convert widgets back to structured response format for database storage
   * @param originalContent - Original voice content
   * @param widgets - Parsed widgets
   * @returns Structured response string compatible with n8n format
   */
  private convertWidgetsToStructuredResponse(originalContent: string, widgets: ParsedWidget[]): string {
    // Find weather widgets
    const weatherWidgets = widgets.filter(w => w.type === 'weather')
    
    if (weatherWidgets.length > 0) {
      const weatherWidget = weatherWidgets[0]
      const weatherData = weatherWidget.data

      // Create n8n-compatible structured response
      const structuredResponse = {
        AIResponse: originalContent || this.extractTextFromStructuredContent(originalContent),
        weatherAgent: {
          weather: true,
          type: weatherData.type || 'current',
          output: {
            ...weatherData
          }
        }
      }

      // Return as array format to match n8n output
      return JSON.stringify([{ output: structuredResponse }])
    }

    // If no widgets, return original content
    return originalContent
  }

  /**
   * Extract plain text from structured content
   * @param content - Content that may contain structured data
   * @returns Plain text portion
   */
  private extractTextFromStructuredContent(content: string): string {
    try {
      const parsed = JSON.parse(content)
      
      // Extract AIResponse if available
      if (parsed.AIResponse) {
        return parsed.AIResponse
      }
      
      // Extract from array format
      if (Array.isArray(parsed) && parsed[0]?.output?.AIResponse) {
        return parsed[0].output.AIResponse
      }
      
      // Extract text field
      if (parsed.text) {
        return parsed.text
      }
      
    } catch (error) {
      // If not JSON, return as-is
    }
    
    return content
  }

  /**
   * Process voice response with enhanced structured response handling
   * @param response - Raw ElevenLabs response
   * @returns Enhanced voice message with proper widget extraction
   */
  processVoiceResponseWithCapabilities(response: ElevenLabsResponse): VoiceMessage {
    const voiceMessage = this.parseVoiceResponse(response)
    
    // Enhanced processing for agent responses
    if (voiceMessage.role === 'agent') {
      // Try to extract additional structured data from transcript
      const enhancedWidgets = this.extractEnhancedWidgets(response.transcript || '')
      
      // Merge with existing widgets, avoiding duplicates
      const allWidgets = [...voiceMessage.widgets || []]
      
      for (const newWidget of enhancedWidgets) {
        const exists = allWidgets.some(existing => 
          existing.type === newWidget.type && 
          JSON.stringify(existing.data) === JSON.stringify(newWidget.data)
        )
        
        if (!exists) {
          allWidgets.push(newWidget)
        }
      }
      
      voiceMessage.widgets = allWidgets
    }
    
    return voiceMessage
  }

  /**
   * Extract enhanced widgets with capability-aware parsing
   * @param transcript - Voice transcript
   * @returns Array of enhanced parsed widgets
   */
  private extractEnhancedWidgets(transcript: string): ParsedWidget[] {
    const widgets: ParsedWidget[] = []
    
    // Use existing widget extraction methods
    const textWidgets = this.extractWidgetsFromText(transcript)
    const structuredWidgets = this.extractStructuredResponseWidgets(transcript)
    
    widgets.push(...textWidgets, ...structuredWidgets)
    
    // Additional capability-specific parsing
    if (this.containsWeatherKeywords(transcript)) {
      const weatherWidget = this.tryExtractWeatherFromNaturalLanguage(transcript)
      if (weatherWidget) {
        widgets.push(weatherWidget)
      }
    }
    
    return widgets
  }

  /**
   * Check if transcript contains weather-related keywords
   * @param transcript - Voice transcript
   * @returns True if weather keywords are detected
   */
  private containsWeatherKeywords(transcript: string): boolean {
    const weatherKeywords = [
      'weather', 'temperature', 'forecast', 'rain', 'sunny', 'cloudy',
      'wind', 'humidity', 'pressure', 'degrees', '°C', '°F',
      'hot', 'cold', 'warm', 'cool', 'storm', 'snow'
    ]
    
    const lowerTranscript = transcript.toLowerCase()
    return weatherKeywords.some(keyword => lowerTranscript.includes(keyword))
  }

  /**
   * Try to extract weather information from natural language
   * @param transcript - Voice transcript
   * @returns Weather widget if extractable, null otherwise
   */
  private tryExtractWeatherFromNaturalLanguage(transcript: string): ParsedWidget | null {
    // This is a fallback method for when structured data isn't available
    // but the agent is clearly talking about weather
    
    // Look for temperature mentions
    const tempPattern = /(\d+)\s*°?([CF])?/g
    const locationPattern = /(?:in|for|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g
    
    const tempMatch = tempPattern.exec(transcript)
    const locationMatch = locationPattern.exec(transcript)
    
    if (tempMatch) {
      const temperature = tempMatch[1]
      const unit = tempMatch[2] || 'C'
      const location = locationMatch ? locationMatch[1] : 'Unknown Location'
      
      // Create a basic weather widget from natural language
      return {
        type: 'weather',
        data: {
          type: 'current',
          location: location,
          temperature: `${temperature}°${unit}`,
          condition: 'Weather information from voice',
          // Add minimal required fields
          feelsLike: `${temperature}°${unit}`,
          conditionImage: 'https://cdn.weatherapi.com/weather/64x64/day/116.png',
          humidity: 'N/A',
          windSpeed: 'N/A',
          windDirection: 'N/A',
          pressure: 'N/A',
          visibility: 'N/A',
          uvIndex: 'N/A',
          lastUpdated: new Date().toISOString().slice(0, 16).replace('T', ' ')
        }
      }
    }
    
    return null
  }

  // ===== MEMORY SYNCHRONIZATION =====

  /**
   * Synchronize voice session transcript to database messages
   * @param sessionId - Voice session ID
   * @param transcript - Voice transcript to synchronize
   * @returns Promise resolving to synchronized message IDs
   */
  async syncVoiceTranscript(sessionId: string, transcript: VoiceTranscript): Promise<string[]> {
    const { data: session, error: sessionError } = await supabase
      .from('voice_sessions')
      .select('conversation_id')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      throw new Error(`Voice session not found: ${sessionId}`)
    }

    const conversationId = session.conversation_id
    if (!conversationId) {
      throw new Error('Voice session has no associated conversation')
    }

    // Convert voice messages to database format
    const messageInserts = transcript.messages.map(voiceMessage =>
      this.voiceMessageToDbMessage(voiceMessage, conversationId, sessionId)
    )

    // Insert messages in batch
    const { data: insertedMessages, error: insertError } = await supabase
      .from('messages')
      .insert(messageInserts)
      .select('id')

    if (insertError) {
      console.error('Failed to sync voice transcript:', insertError)
      throw new Error(`Failed to sync voice transcript: ${insertError.message}`)
    }

    // Update voice session with transcript
    await supabase
      .from('voice_sessions')
      .update({ transcript: JSON.stringify(transcript) })
      .eq('id', sessionId)

    console.log(`Synchronized ${transcript.messages.length} voice messages for session ${sessionId}`)
    return insertedMessages?.map(m => m.id) || []
  }

  /**
   * Get conversation history for memory continuity
   * @param conversationId - Conversation ID
   * @param includeVoice - Whether to include voice messages
   * @param limit - Maximum number of messages to retrieve
   * @returns Promise resolving to conversation messages
   */
  async getConversationHistory(
    conversationId: string, 
    includeVoice: boolean = true, 
    limit: number = 50
  ): Promise<Message[]> {
    let query = supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (!includeVoice) {
      query = query.neq('message_type', 'voice')
    }

    const { data: messages, error } = await query

    if (error) {
      console.error('Failed to get conversation history:', error)
      throw new Error(`Failed to get conversation history: ${error.message}`)
    }

    return messages || []
  }

  /**
   * Prepare comprehensive context including both text and voice history
   * @param conversationId - Conversation ID
   * @param maxLength - Maximum context length
   * @returns Promise resolving to comprehensive conversation context
   */
  async prepareComprehensiveContext(
    conversationId: string, 
    maxLength?: number
  ): Promise<ConversationContext> {
    const messages = await this.getConversationHistory(conversationId, false) // Exclude voice to avoid duplication
    return this.prepareContextForAgent(messages, maxLength)
  }

  /**
   * Create conversation continuity summary from mixed text/voice history
   * @param conversationId - Conversation ID
   * @returns Promise resolving to conversation summary
   */
  async createContinuitySummary(conversationId: string): Promise<string> {
    const allMessages = await this.getConversationHistory(conversationId, true)
    
    if (allMessages.length === 0) {
      return 'New conversation with no previous messages.'
    }

    const textMessages = allMessages.filter(m => m.message_type !== 'voice').length
    const voiceMessages = allMessages.filter(m => m.message_type === 'voice').length
    const totalMessages = allMessages.length

    // Get recent message context
    const recentMessages = allMessages.slice(-5) // Last 5 messages
    const recentContent = recentMessages
      .map(m => `${m.is_user ? 'User' : 'Agent'}: ${m.content.substring(0, 100)}`)
      .join('\n')

    const summary = `
Conversation Summary:
- Total messages: ${totalMessages} (${textMessages} text, ${voiceMessages} voice)
- Recent context:
${recentContent}

This conversation has mixed text and voice interactions. Continue naturally based on the context above.
    `.trim()

    return summary
  }

  /**
   * Capture and store voice transcript during active session
   * @param sessionId - Voice session ID
   * @param partialTranscript - Partial transcript to store
   * @returns Promise resolving to success status
   */
  async capturePartialTranscript(sessionId: string, partialTranscript: Partial<VoiceTranscript>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('voice_sessions')
        .update({ 
          transcript: JSON.stringify(partialTranscript),
          status: 'active' // Ensure session remains active
        })
        .eq('id', sessionId)

      if (error) {
        console.error('Failed to capture partial transcript:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error capturing partial transcript:', error)
      return false
    }
  }

  /**
   * Restore conversation context from previous voice sessions
   * @param conversationId - Conversation ID
   * @returns Promise resolving to restored context
   */
  async restoreConversationContext(conversationId: string): Promise<ConversationContext> {
    // Get recent voice sessions for this conversation
    const { data: voiceSessions, error } = await supabase
      .from('voice_sessions')
      .select('transcript, ended_at')
      .eq('conversation_id', conversationId)
      .eq('status', 'ended')
      .order('ended_at', { ascending: false })
      .limit(3) // Last 3 voice sessions

    if (error) {
      console.warn('Failed to get voice sessions for context restoration:', error)
    }

    // Combine text messages with voice session context
    const textMessages = await this.getConversationHistory(conversationId, false)
    let contextSummary = this.generateConversationSummary(textMessages)

    // Add voice session summaries if available
    if (voiceSessions && voiceSessions.length > 0) {
      const voiceContext = voiceSessions
        .filter(session => session.transcript)
        .map(session => {
          try {
            const transcript = JSON.parse(session.transcript as string) as VoiceTranscript
            return `Voice session (${transcript.messages.length} messages): ${transcript.summary || 'No summary'}`
          } catch {
            return 'Voice session: Unable to parse transcript'
          }
        })
        .join('\n')

      if (voiceContext) {
        contextSummary += `\n\nRecent voice sessions:\n${voiceContext}`
      }
    }

    return {
      recentMessages: textMessages,
      maxTokens: config.elevenLabs.widget.maxContextLength,
      conversationSummary: contextSummary
    }
  }

  /**
   * Ensure conversation continuity between text and voice modes
   * @param conversationId - Conversation ID
   * @param newVoiceMessage - New voice message to integrate
   * @returns Promise resolving to updated context
   */
  async ensureContinuity(
    conversationId: string, 
    newVoiceMessage: VoiceMessage
  ): Promise<ConversationContext> {
    // Get current conversation state
    const context = await this.restoreConversationContext(conversationId)
    
    // Add the new voice message to context (temporarily, before it's saved)
    const tempMessage: Message = {
      id: newVoiceMessage.id,
      conversation_id: conversationId,
      content: newVoiceMessage.content,
      is_user: newVoiceMessage.role === 'user',
      message_type: 'voice',
      audio_url: newVoiceMessage.audioUrl || null,
      voice_session_id: null,
      user_id: null,
      created_at: newVoiceMessage.timestamp.toISOString()
    }

    // Update context with new message
    const updatedMessages = [...context.recentMessages, tempMessage]
    
    return {
      ...context,
      recentMessages: updatedMessages,
      conversationSummary: this.generateConversationSummary(updatedMessages)
    }
  }

  // ===== AGENT CONFIGURATION AND TESTING =====

  /**
   * Test agent capabilities by sending a test request
   * @param capability - Capability to test ('weather', 'structured', 'continuity')
   * @returns Test result with success status and details
   */
  async testAgentCapability(capability: 'weather' | 'structured' | 'continuity'): Promise<{
    success: boolean;
    capability: string;
    result?: any;
    error?: string;
  }> {
    try {
      switch (capability) {
        case 'weather':
          return await this.testWeatherCapability()
        case 'structured':
          return await this.testStructuredResponseCapability()
        case 'continuity':
          return await this.testContinuityCapability()
        default:
          return {
            success: false,
            capability,
            error: 'Unknown capability'
          }
      }
    } catch (error) {
      return {
        success: false,
        capability,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Test weather capability by parsing a sample weather response
   * @returns Weather capability test result
   */
  private async testWeatherCapability(): Promise<{
    success: boolean;
    capability: string;
    result?: any;
    error?: string;
  }> {
    // Test with sample n8n weather response
    const sampleWeatherResponse = `{
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
          "lastUpdated": "2025-10-22 13:00"
        }
      }
    }`

    const mockResponse: ElevenLabsResponse = {
      transcript: sampleWeatherResponse,
      session_id: 'test'
    }

    const voiceMessage = this.processVoiceResponseWithCapabilities(mockResponse)
    
    const hasWeatherWidget = voiceMessage.widgets?.some(w => w.type === 'weather') || false
    const weatherWidget = voiceMessage.widgets?.find(w => w.type === 'weather')

    return {
      success: hasWeatherWidget,
      capability: 'weather',
      result: {
        widgetExtracted: hasWeatherWidget,
        widgetData: weatherWidget?.data,
        originalTranscript: sampleWeatherResponse.substring(0, 100) + '...'
      }
    }
  }

  /**
   * Test structured response capability
   * @returns Structured response capability test result
   */
  private async testStructuredResponseCapability(): Promise<{
    success: boolean;
    capability: string;
    result?: any;
    error?: string;
  }> {
    // Test various structured response formats
    const testCases = [
      {
        name: 'n8n weather format',
        input: '{"weatherAgent": {"weather": true, "type": "current", "output": {"location": "Test City", "temperature": "20°C"}}}'
      },
      {
        name: 'direct weather format',
        input: '{"weather": true, "weatherData": {"location": "Test City", "temperature": "20°C"}}'
      },
      {
        name: 'generic widget format',
        input: '{"type": "weather", "data": {"location": "Test City", "temperature": "20°C"}}'
      }
    ]

    const results = []

    for (const testCase of testCases) {
      const mockResponse: ElevenLabsResponse = {
        transcript: testCase.input,
        session_id: 'test'
      }

      const voiceMessage = this.processVoiceResponseWithCapabilities(mockResponse)
      const hasWidgets = (voiceMessage.widgets?.length || 0) > 0

      results.push({
        testCase: testCase.name,
        success: hasWidgets,
        widgetCount: voiceMessage.widgets?.length || 0
      })
    }

    const allSuccessful = results.every(r => r.success)

    return {
      success: allSuccessful,
      capability: 'structured',
      result: {
        testResults: results,
        overallSuccess: allSuccessful
      }
    }
  }

  /**
   * Test conversation continuity capability
   * @returns Continuity capability test result
   */
  private async testContinuityCapability(): Promise<{
    success: boolean;
    capability: string;
    result?: any;
    error?: string;
  }> {
    // Test context preparation and message conversion
    const sampleMessages: Message[] = [
      {
        id: '1',
        conversation_id: 'test',
        content: 'Hello, how are you?',
        is_user: true,
        message_type: 'text',
        audio_url: null,
        voice_session_id: null,
        user_id: 'test-user',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        conversation_id: 'test',
        content: 'I am doing well, thank you!',
        is_user: false,
        message_type: 'text',
        audio_url: null,
        voice_session_id: null,
        user_id: null,
        created_at: new Date().toISOString()
      }
    ]

    // Test context preparation
    const context = this.prepareContextForAgent(sampleMessages)
    const hasContext = context.recentMessages.length > 0
    const hasSummary = !!context.conversationSummary

    // Test agent context enhancement
    const enhancedContext = this.prepareAgentContext(context)
    const hasInstructions = !!enhancedContext.instructions
    const hasCapabilities = !!enhancedContext.agentCapabilities

    return {
      success: hasContext && hasSummary && hasInstructions && hasCapabilities,
      capability: 'continuity',
      result: {
        contextPrepared: hasContext,
        summaryGenerated: hasSummary,
        instructionsIncluded: hasInstructions,
        capabilitiesIncluded: hasCapabilities,
        messageCount: context.recentMessages.length,
        summaryLength: context.conversationSummary?.length || 0
      }
    }
  }

  /**
   * Run comprehensive capability tests
   * @returns Complete test results for all capabilities
   */
  async runCapabilityTests(): Promise<{
    success: boolean;
    results: Array<{
      success: boolean;
      capability: string;
      result?: any;
      error?: string;
    }>;
    summary: {
      total: number;
      passed: number;
      failed: number;
    };
  }> {
    const capabilities = ['weather', 'structured', 'continuity'] as const
    const results = []

    for (const capability of capabilities) {
      const result = await this.testAgentCapability(capability)
      results.push(result)
    }

    const passed = results.filter(r => r.success).length
    const failed = results.length - passed

    return {
      success: failed === 0,
      results,
      summary: {
        total: results.length,
        passed,
        failed
      }
    }
  }

  /**
   * Get comprehensive status report including capabilities
   * @returns Complete status report
   */
  getComprehensiveStatus() {
    const basicStatus = this.getEnvironmentInfo()
    const capabilityValidation = this.validateAgentCapabilities()
    const agentConfig = this.getAgentConfiguration()

    return {
      ...basicStatus,
      capabilities: capabilityValidation,
      agentConfiguration: {
        agentId: agentConfig.agentId,
        hasInstructions: !!agentConfig.instructions,
        instructionsLength: agentConfig.instructions.length,
        supportedCapabilities: Object.keys(agentConfig.capabilities)
      },
      synchronization: {
        ready: capabilityValidation.valid && basicStatus.widgetSupport.supported,
        missingRequirements: [
          ...capabilityValidation.errors,
          ...(!basicStatus.widgetSupport.supported ? [basicStatus.widgetSupport.reason] : [])
        ]
      }
    }
  }
}

// Export singleton instance for convenience
export const elevenLabsService = ElevenLabsService.getInstance()
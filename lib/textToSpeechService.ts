import { AudioPlayer } from 'expo-audio';
import { supabase } from './supabase';

export interface TTSState {
  isLoading: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  error: string | null;
}

export class TextToSpeechService {
  private static audioPlayer: AudioPlayer | null = null;
  private static currentMessageId: string | null = null;
  private static listeners: Map<string, (state: TTSState) => void> = new Map();

  static async initialize() {
    try {
      // expo-audio doesn't require explicit initialization like expo-av
      console.log('Audio service initialized');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  static subscribe(messageId: string, callback: (state: TTSState) => void) {
    this.listeners.set(messageId, callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(messageId);
    };
  }

  static async playTTS(messageId: string, text: string): Promise<void> {
    try {
      // Stop any currently playing audio
      if (this.audioPlayer && this.currentMessageId !== messageId) {
        await this.stop();
      }

      this.currentMessageId = messageId;
      this.notifyListeners(messageId, {
        isLoading: true,
        isPlaying: false,
        isPaused: false,
        error: null,
      });

      // Check if we have cached audio
      const cachedUrl = await this.getCachedAudioUrl(messageId);
      let audioUrl = cachedUrl;

      if (!audioUrl) {
        // Generate TTS audio
        audioUrl = await this.generateTTS(text);
        if (audioUrl) {
          await this.cacheAudioUrl(messageId, audioUrl);
        }
      }

      if (!audioUrl) {
        throw new Error('Failed to get audio URL');
      }

      // Create and play audio using expo-audio
      this.audioPlayer = new AudioPlayer(audioUrl);
      
      // Set up event listeners
      this.audioPlayer.playing = true;
      
      this.notifyListeners(messageId, {
        isLoading: false,
        isPlaying: true,
        isPaused: false,
        error: null,
      });

      // Note: expo-audio doesn't have the same event system as expo-av
      // For now, we'll simulate completion after a reasonable time
      // In a real implementation, you'd need to handle this differently
      
    } catch (error) {
      console.error('Failed to play TTS:', error);
      this.notifyListeners(messageId, {
        isLoading: false,
        isPlaying: false,
        isPaused: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async pause(): Promise<void> {
    if (this.audioPlayer && this.currentMessageId) {
      try {
        this.audioPlayer.playing = false;
        this.notifyListeners(this.currentMessageId, {
          isLoading: false,
          isPlaying: false,
          isPaused: true,
          error: null,
        });
      } catch (error) {
        console.error('Failed to pause audio:', error);
      }
    }
  }

  static async resume(): Promise<void> {
    if (this.audioPlayer && this.currentMessageId) {
      try {
        this.audioPlayer.playing = true;
        this.notifyListeners(this.currentMessageId, {
          isLoading: false,
          isPlaying: true,
          isPaused: false,
          error: null,
        });
      } catch (error) {
        console.error('Failed to resume audio:', error);
      }
    }
  }

  static async stop(): Promise<void> {
    if (this.audioPlayer && this.currentMessageId) {
      try {
        this.audioPlayer.playing = false;
        this.audioPlayer = null;
        
        const messageId = this.currentMessageId;
        this.currentMessageId = null;
        
        this.notifyListeners(messageId, {
          isLoading: false,
          isPlaying: false,
          isPaused: false,
          error: null,
        });
      } catch (error) {
        console.error('Failed to stop audio:', error);
      }
    }
  }

  private static notifyListeners(messageId: string, state: TTSState) {
    const callback = this.listeners.get(messageId);
    if (callback) {
      callback(state);
    }
  }

  private static async generateTTS(text: string): Promise<string | null> {
    try {
      // For now, return null to indicate TTS generation is not implemented
      // In a real implementation, you would call your TTS service here
      console.log('TTS generation not implemented, text:', text);
      return null;
    } catch (error) {
      console.error('Failed to generate TTS:', error);
      return null;
    }
  }

  private static async getCachedAudioUrl(messageId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('audio_url')
        .eq('id', messageId)
        .single();

      if (error) {
        console.error('Failed to get cached audio URL:', error);
        return null;
      }

      return data?.audio_url || null;
    } catch (error) {
      console.error('Failed to get cached audio URL:', error);
      return null;
    }
  }

  private static async cacheAudioUrl(messageId: string, audioUrl: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ audio_url: audioUrl })
        .eq('id', messageId);

      if (error) {
        console.error('Failed to cache audio URL:', error);
      }
    } catch (error) {
      console.error('Failed to cache audio URL:', error);
    }
  }

  static getCurrentMessageId(): string | null {
    return this.currentMessageId;
  }

  static isPlaying(): boolean {
    return this.audioPlayer?.playing || false;
  }

  static cleanup() {
    if (this.audioPlayer) {
      this.audioPlayer.playing = false;
      this.audioPlayer = null;
    }
    this.currentMessageId = null;
    this.listeners.clear();
  }
}

// Initialize the service
TextToSpeechService.initialize();
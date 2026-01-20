/**
 * Speech-to-Text Module for Access Nature
 * Uses Web Speech API for voice input
 * 
 * File: src/features/speechToText.js
 * Version: 1.1 - Added continuous mode with auto-restart
 */

class SpeechToTextManager {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.isSupported = false;
    this.shouldContinue = false;  // Track if we should auto-restart
    this.currentCallback = null;
    this.currentErrorCallback = null;
    this.restartTimeout = null;
    
    this.init();
  }
  
  init() {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.isSupported = true;
      this.recognition = new SpeechRecognition();
      
      // Configure recognition
      this.recognition.continuous = false;  // We handle continuity ourselves
      this.recognition.interimResults = true;
      this.recognition.lang = this.getLanguage();
      this.recognition.maxAlternatives = 1;
      
      // Event handlers
      this.recognition.onresult = (event) => this.handleResult(event);
      this.recognition.onerror = (event) => this.handleError(event);
      this.recognition.onend = () => this.handleEnd();
      this.recognition.onstart = () => this.handleStart();
      
      console.log('🎤 Speech recognition initialized');
    } else {
      console.warn('🎤 Speech recognition not supported in this browser');
    }
  }
  
  /**
   * Get current language based on i18n setting
   */
  getLanguage() {
    const currentLang = localStorage.getItem('accessNature_language') || 'en';
    // Map to BCP 47 language tags
    const langMap = {
      'en': 'en-US',
      'he': 'he-IL',
      'ar': 'ar-SA',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE'
    };
    return langMap[currentLang] || 'en-US';
  }
  
  /**
   * Start listening for speech
   * @param {Function} onResult - Callback with transcript (interim and final)
   * @param {Function} onError - Error callback
   * @param {boolean} continuous - Whether to auto-restart after each result (default: true)
   * @returns {boolean} - Whether listening started successfully
   */
  start(onResult, onError, continuous = true) {
    if (!this.isSupported) {
      onError?.({ error: 'not-supported', message: 'Speech recognition is not supported in this browser' });
      return false;
    }
    
    if (this.isListening) {
      this.stop();
    }
    
    // Update language in case it changed
    this.recognition.lang = this.getLanguage();
    
    this.currentCallback = onResult;
    this.currentErrorCallback = onError;
    this.shouldContinue = continuous;  // Set continuous mode
    
    // Clear any pending restart
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    
    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('🎤 Failed to start recognition:', error);
      onError?.({ error: 'start-failed', message: error.message });
      return false;
    }
  }
  
  /**
   * Stop listening
   */
  stop() {
    this.shouldContinue = false;  // Prevent auto-restart
    
    // Clear any pending restart
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
    }
    this.isListening = false;
  }
  
  /**
   * Abort listening (discard results)
   */
  abort() {
    this.shouldContinue = false;  // Prevent auto-restart
    
    // Clear any pending restart
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {
        // Ignore errors when aborting
      }
    }
    this.isListening = false;
  }
  
  /**
   * Handle speech recognition result
   */
  handleResult(event) {
    let interimTranscript = '';
    let finalTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;
      
      if (result.isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }
    
    this.currentCallback?.({
      interim: interimTranscript,
      final: finalTranscript,
      isFinal: finalTranscript.length > 0
    });
  }
  
  /**
   * Handle speech recognition error
   */
  handleError(event) {
    console.error('🎤 Speech recognition error:', event.error);
    
    const errorMessages = {
      'no-speech': 'No speech detected. Please try again.',
      'audio-capture': 'No microphone found. Please check your device.',
      'not-allowed': 'Microphone access denied. Please allow microphone access.',
      'network': 'Network error. Please check your connection.',
      'aborted': 'Speech recognition aborted.',
      'language-not-supported': 'Language not supported.',
      'service-not-allowed': 'Speech service not allowed.'
    };
    
    // For 'no-speech' error in continuous mode, just restart silently
    if (event.error === 'no-speech' && this.shouldContinue) {
      console.log('🎤 No speech detected, continuing to listen...');
      // handleEnd will auto-restart
      return;
    }
    
    // For 'aborted' error, don't report if we're stopping intentionally
    if (event.error === 'aborted' && !this.shouldContinue) {
      this.isListening = false;
      return;
    }
    
    // Fatal errors - stop continuous mode
    if (['not-allowed', 'audio-capture', 'service-not-allowed'].includes(event.error)) {
      this.shouldContinue = false;
    }
    
    this.currentErrorCallback?.({
      error: event.error,
      message: errorMessages[event.error] || `Error: ${event.error}`
    });
    
    this.isListening = false;
  }
  
  /**
   * Handle recognition start
   */
  handleStart() {
    this.isListening = true;
    console.log('🎤 Listening...');
  }
  
  /**
   * Handle recognition end
   */
  handleEnd() {
    console.log('🎤 Recognition ended, shouldContinue:', this.shouldContinue);
    
    // Auto-restart if in continuous mode
    if (this.shouldContinue) {
      // Brief delay before restart to avoid rapid restarts
      this.restartTimeout = setTimeout(() => {
        if (this.shouldContinue) {
          console.log('🎤 Auto-restarting...');
          try {
            this.recognition.start();
          } catch (e) {
            console.error('🎤 Auto-restart failed:', e);
            this.isListening = false;
            this.shouldContinue = false;
          }
        }
      }, 100);
    } else {
      this.isListening = false;
      console.log('🎤 Stopped listening');
    }
  }
  
  /**
   * Check if speech recognition is supported
   */
  checkSupport() {
    return this.isSupported;
  }
  
  /**
   * Check if currently listening
   */
  checkListening() {
    return this.isListening;
  }
}

// Create singleton instance
const speechToText = new SpeechToTextManager();

// Export
export { speechToText };
export default speechToText;

// Make globally available
if (typeof window !== 'undefined') {
  window.speechToText = speechToText;
}

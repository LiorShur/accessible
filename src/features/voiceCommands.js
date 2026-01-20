/**
 * Voice Commands Module for Access Nature
 * Provides hands-free control for accessibility
 * 
 * File: src/features/voiceCommands.js
 * Version: 1.0
 * 
 * Commands supported:
 * - "Start tracking" / "Start" / "Begin tracking"
 * - "Stop tracking" / "Stop" / "End tracking" / "Finish"
 * - "Pause" / "Pause tracking"
 * - "Resume" / "Continue"
 * - "Take photo" / "Photo" / "Camera" / "Picture"
 * - "Add note" / "Note" / "New note"
 * - "Survey" / "Accessibility survey" / "Add survey"
 * - "Emergency" / "SOS" / "Help"
 * - "Where am I" / "Location" / "My location"
 * - "Zoom in" / "Zoom out"
 * - "Center map" / "Center"
 * - "Weather" / "What's the weather"
 * - "Stop listening" / "Cancel" / "Close"
 */

class VoiceCommandsManager {
  constructor() {
    this.isSupported = false;
    this.isListening = false;
    this.isPaused = false;  // Track if paused for modal
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.overlay = null;
    this.feedbackTimeout = null;
    
    // Command definitions with aliases
    this.commands = [
      {
        id: 'start_tracking',
        phrases: ['start tracking', 'start', 'begin tracking', 'begin', 'go', 'record'],
        action: () => this.executeStartTracking(),
        feedback: 'Starting tracking'
      },
      {
        id: 'stop_tracking',
        phrases: ['stop tracking', 'stop', 'end tracking', 'end', 'finish', 'done'],
        action: () => this.executeStopTracking(),
        feedback: 'Stopping tracking'
      },
      {
        id: 'pause_tracking',
        phrases: ['pause', 'pause tracking', 'wait', 'hold'],
        action: () => this.executePauseTracking(),
        feedback: 'Pausing tracking'
      },
      {
        id: 'resume_tracking',
        phrases: ['resume', 'resume tracking', 'continue', 'unpause'],
        action: () => this.executeResumeTracking(),
        feedback: 'Resuming tracking'
      },
      {
        id: 'take_photo',
        phrases: ['take photo', 'photo', 'camera', 'picture', 'take picture', 'snap', 'capture'],
        action: () => this.executeTakePhoto(),
        feedback: 'Opening camera'
      },
      {
        id: 'add_note',
        phrases: ['add note', 'note', 'new note', 'add a note', 'take note'],
        action: () => this.executeAddNote(),
        feedback: 'Opening note'
      },
      {
        id: 'survey',
        phrases: ['survey', 'accessibility survey', 'add survey', 'accessibility', 'report accessibility'],
        action: () => this.executeSurvey(),
        feedback: 'Opening accessibility survey'
      },
      {
        id: 'emergency',
        phrases: ['emergency', 'sos', 'help', 'help me', 'call for help'],
        action: () => this.executeEmergency(),
        feedback: 'Opening emergency options'
      },
      {
        id: 'location',
        phrases: ['where am i', 'location', 'my location', 'current location', 'where is this'],
        action: () => this.executeWhereAmI(),
        feedback: null // Will speak location instead
      },
      {
        id: 'zoom_in',
        phrases: ['zoom in', 'closer', 'magnify'],
        action: () => this.executeZoomIn(),
        feedback: 'Zooming in'
      },
      {
        id: 'zoom_out',
        phrases: ['zoom out', 'further', 'farther'],
        action: () => this.executeZoomOut(),
        feedback: 'Zooming out'
      },
      {
        id: 'center_map',
        phrases: ['center', 'center map', 'recenter', 're-center', 'find me', 'my position'],
        action: () => this.executeCenterMap(),
        feedback: 'Centering map'
      },
      {
        id: 'weather',
        phrases: ['weather', 'whats the weather', 'weather report', 'temperature'],
        action: () => this.executeWeather(),
        feedback: 'Checking weather'
      },
      {
        id: 'stop_listening',
        phrases: ['stop listening', 'cancel', 'close', 'never mind', 'nevermind', 'exit'],
        action: () => this.stopListening(),
        feedback: 'Voice control off'
      }
    ];
    
    // Hebrew command translations
    this.hebrewCommands = {
      'התחל': 'start_tracking',
      'התחל מעקב': 'start_tracking',
      'עצור': 'stop_tracking',
      'עצור מעקב': 'stop_tracking',
      'סיים': 'stop_tracking',
      'השהה': 'pause_tracking',
      'המשך': 'resume_tracking',
      'צלם': 'take_photo',
      'תמונה': 'take_photo',
      'הערה': 'add_note',
      'הוסף הערה': 'add_note',
      'סקר': 'survey',
      'נגישות': 'survey',
      'חירום': 'emergency',
      'עזרה': 'emergency',
      'איפה אני': 'location',
      'מיקום': 'location',
      'קרב': 'zoom_in',
      'הרחק': 'zoom_out',
      'מרכז': 'center_map',
      'מזג אוויר': 'weather',
      'בטל': 'stop_listening'
    };
    
    this.init();
  }
  
  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.isSupported = true;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.getLanguage();
      this.recognition.maxAlternatives = 3;
      
      this.recognition.onresult = (event) => this.handleResult(event);
      this.recognition.onerror = (event) => this.handleError(event);
      this.recognition.onend = () => this.handleEnd();
      this.recognition.onstart = () => this.handleStart();
      
      console.log('🎙️ Voice commands initialized');
    } else {
      console.warn('🎙️ Voice commands not supported');
    }
    
    // Create UI
    this.createUI();
    
    // Expose globally
    window.voiceCommands = this;
  }
  
  getLanguage() {
    const currentLang = localStorage.getItem('accessNature_language') || 'en';
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
   * Create floating voice control button and overlay
   */
  createUI() {
    // Inject styles
    if (!document.getElementById('voice-commands-styles')) {
      const style = document.createElement('style');
      style.id = 'voice-commands-styles';
      style.textContent = `
        /* Voice Control Floating Button */
        .voice-control-fab {
          position: fixed;
          bottom: 160px;
          left: 12px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        
        .voice-control-fab:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }
        
        .voice-control-fab.listening {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
          animation: voice-pulse 1.5s infinite;
        }
        
        .voice-control-fab.hidden {
          display: none;
        }
        
        @keyframes voice-pulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
          }
          50% { 
            transform: scale(1.1);
            box-shadow: 0 0 0 15px rgba(239, 68, 68, 0);
          }
        }
        
        /* Voice Command Overlay */
        .voice-overlay {
          position: fixed;
          top: 185px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 16px 24px;
          color: white;
          z-index: 700;
          min-width: 260px;
          max-width: 90vw;
          text-align: center;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          pointer-events: none;
        }
        
        .voice-overlay.visible {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }
        
        .voice-overlay-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        
        .voice-indicator {
          width: 16px;
          height: 16px;
          background: #ef4444;
          border-radius: 50%;
          animation: voice-blink 1s infinite;
        }
        
        @keyframes voice-blink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        
        .voice-overlay-title {
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #ef4444;
        }
        
        .voice-overlay-text {
          font-size: 20px;
          font-weight: 500;
          margin: 8px 0;
          min-height: 28px;
        }
        
        .voice-overlay-hint {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 8px;
        }
        
        .voice-overlay-commands {
          display: none;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: center;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .voice-overlay.show-hints .voice-overlay-commands {
          display: flex;
        }
        
        .voice-cmd-chip {
          background: rgba(255,255,255,0.1);
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          color: #d1d5db;
        }
        
        /* Feedback Toast */
        .voice-feedback {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0.8);
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 24px 40px;
          border-radius: 16px;
          font-size: 18px;
          font-weight: 600;
          z-index: 10002;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
          text-align: center;
        }
        
        .voice-feedback.visible {
          opacity: 1;
          visibility: visible;
          transform: translate(-50%, -50%) scale(1);
        }
        
        .voice-feedback-icon {
          font-size: 48px;
          margin-bottom: 12px;
          display: block;
        }
        
        /* Mobile adjustments */
        @media (max-width: 480px) {
          .voice-control-fab {
            bottom: 180px;
            width: 52px;
            height: 52px;
            font-size: 22px;
          }
          
          .voice-overlay {
            top: 185px;
            padding: 12px 16px;
            min-width: 240px;
          }
          
          .voice-overlay-text {
            font-size: 16px;
          }
        }
        
        /* Fullscreen mode adjustment */
        body.fullscreen-mode .voice-control-fab {
          bottom: 100px;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Create floating button (only on tracker page)
    if (window.location.pathname.includes('tracker')) {
      this.createFloatingButton();
      this.createOverlay();
      this.createFeedbackElement();
    }
  }
  
  createFloatingButton() {
    if (document.getElementById('voiceControlFab')) return;
    
    const fab = document.createElement('button');
    fab.id = 'voiceControlFab';
    fab.className = 'voice-control-fab';
    fab.innerHTML = '🎙️';
    fab.title = 'Voice Commands';
    fab.setAttribute('aria-label', 'Activate voice commands');
    
    if (!this.isSupported) {
      fab.classList.add('hidden');
    }
    
    fab.addEventListener('click', () => {
      if (this.isListening) {
        this.stopListening();
      } else {
        this.startListening();
      }
    });
    
    document.body.appendChild(fab);
    this.fab = fab;
  }
  
  createOverlay() {
    if (document.getElementById('voiceOverlay')) return;
    
    const overlay = document.createElement('div');
    overlay.id = 'voiceOverlay';
    overlay.className = 'voice-overlay';
    overlay.innerHTML = `
      <div class="voice-overlay-status">
        <div class="voice-indicator"></div>
        <span class="voice-overlay-title">Listening...</span>
      </div>
      <div class="voice-overlay-text" id="voiceOverlayText">Say a command</div>
      <div class="voice-overlay-hint">Try: "Start tracking", "Take photo", "Add note"</div>
      <div class="voice-overlay-commands">
        <span class="voice-cmd-chip">Start</span>
        <span class="voice-cmd-chip">Stop</span>
        <span class="voice-cmd-chip">Photo</span>
        <span class="voice-cmd-chip">Note</span>
        <span class="voice-cmd-chip">Survey</span>
        <span class="voice-cmd-chip">SOS</span>
      </div>
    `;
    
    document.body.appendChild(overlay);
    this.overlay = overlay;
    this.overlayText = overlay.querySelector('#voiceOverlayText');
  }
  
  createFeedbackElement() {
    if (document.getElementById('voiceFeedback')) return;
    
    const feedback = document.createElement('div');
    feedback.id = 'voiceFeedback';
    feedback.className = 'voice-feedback';
    feedback.innerHTML = `
      <span class="voice-feedback-icon">✓</span>
      <span class="voice-feedback-text"></span>
    `;
    
    document.body.appendChild(feedback);
    this.feedbackEl = feedback;
  }
  
  /**
   * Start listening for voice commands
   */
  startListening() {
    if (!this.isSupported) {
      this.showFeedback('❌', 'Voice not supported');
      return;
    }
    
    if (this.isListening) return;
    
    // Update language setting
    this.recognition.lang = this.getLanguage();
    
    try {
      this.recognition.start();
    } catch (e) {
      console.error('🎙️ Failed to start:', e);
    }
  }
  
  /**
   * Stop listening
   */
  stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore
      }
    }
    this.isListening = false;
    this.isPaused = false;
    this.updateUI(false);
  }
  
  /**
   * Pause listening temporarily (for modals that need mic)
   */
  pauseListening() {
    if (!this.isListening) return;
    
    this.isPaused = true;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore
      }
    }
    this.updateUI(false, true); // Show paused state
    console.log('🎙️ Voice commands paused');
  }
  
  /**
   * Resume listening after pause
   */
  resumeListening() {
    if (!this.isPaused) return;
    
    this.isPaused = false;
    this.isListening = true;
    
    try {
      this.recognition.start();
    } catch (e) {
      console.error('🎙️ Failed to resume:', e);
      this.isListening = false;
    }
    
    this.updateUI(this.isListening);
    console.log('🎙️ Voice commands resumed');
  }
  
  handleStart() {
    this.isListening = true;
    this.updateUI(true);
    console.log('🎙️ Voice commands active');
  }
  
  handleEnd() {
    // Don't auto-restart if paused (for modal use)
    if (this.isPaused) {
      return;
    }
    
    // Auto-restart if still supposed to be listening
    if (this.isListening) {
      try {
        this.recognition.start();
      } catch (e) {
        this.isListening = false;
        this.updateUI(false);
      }
    } else {
      this.updateUI(false);
    }
  }
  
  handleError(event) {
    console.error('🎙️ Error:', event.error);
    
    if (event.error === 'not-allowed') {
      this.showFeedback('🎤', 'Microphone access denied');
      this.stopListening();
    } else if (event.error === 'no-speech') {
      // Just continue listening
      this.overlayText.textContent = 'Say a command...';
    }
  }
  
  handleResult(event) {
    let finalTranscript = '';
    let interimTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript.toLowerCase().trim();
      
      if (result.isFinal) {
        finalTranscript = transcript;
      } else {
        interimTranscript = transcript;
      }
    }
    
    // Show what was heard
    if (interimTranscript) {
      this.overlayText.textContent = `"${interimTranscript}"`;
    }
    
    // Process final result
    if (finalTranscript) {
      this.overlayText.textContent = `"${finalTranscript}"`;
      this.processCommand(finalTranscript);
    }
  }
  
  /**
   * Match spoken text to a command
   */
  processCommand(text) {
    const normalizedText = text.toLowerCase().trim();
    console.log('🎙️ Processing:', normalizedText);
    
    // Check Hebrew commands first
    const hebrewMatch = this.hebrewCommands[normalizedText];
    if (hebrewMatch) {
      const cmd = this.commands.find(c => c.id === hebrewMatch);
      if (cmd) {
        this.executeCommand(cmd);
        return;
      }
    }
    
    // Check English commands with fuzzy matching
    for (const cmd of this.commands) {
      for (const phrase of cmd.phrases) {
        // Exact match
        if (normalizedText === phrase) {
          this.executeCommand(cmd);
          return;
        }
        
        // Contains match (for phrases within longer sentences)
        if (normalizedText.includes(phrase)) {
          this.executeCommand(cmd);
          return;
        }
        
        // Fuzzy match using Levenshtein distance for accessibility
        if (this.fuzzyMatch(normalizedText, phrase)) {
          this.executeCommand(cmd);
          return;
        }
      }
    }
    
    // No match found
    this.overlayText.textContent = `"${text}" - Command not recognized`;
    this.speak('Sorry, I didn\'t understand. Try saying start, stop, photo, or note.');
  }
  
  /**
   * Simple fuzzy matching for accessibility
   */
  fuzzyMatch(input, target) {
    // Allow up to 2 character differences for words > 4 chars
    if (target.length < 4) return false;
    
    const maxDistance = Math.min(2, Math.floor(target.length / 3));
    const distance = this.levenshteinDistance(input, target);
    
    return distance <= maxDistance;
  }
  
  levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    
    const matrix = [];
    
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  }
  
  /**
   * Execute a matched command
   */
  executeCommand(cmd) {
    console.log('🎙️ Executing:', cmd.id);
    
    // Visual and audio feedback
    if (cmd.feedback) {
      this.showFeedback('✓', cmd.feedback);
      this.speak(cmd.feedback);
    }
    
    // Execute the action
    try {
      cmd.action();
    } catch (e) {
      console.error('🎙️ Command failed:', e);
      this.speak('Sorry, that action failed.');
    }
    
    // Keep listening unless it's the stop command
    if (cmd.id !== 'stop_listening') {
      // Brief pause then show ready state
      setTimeout(() => {
        if (this.isListening && this.overlayText) {
          this.overlayText.textContent = 'Say a command...';
        }
      }, 1500);
    }
  }
  
  /**
   * Update UI state
   */
  updateUI(isActive, isPaused = false) {
    if (this.fab) {
      this.fab.classList.toggle('listening', isActive);
      this.fab.innerHTML = isActive ? '⏹️' : (isPaused ? '⏸️' : '🎙️');
      this.fab.title = isActive ? 'Stop Voice Commands' : (isPaused ? 'Voice Commands Paused' : 'Voice Commands');
    }
    
    if (this.overlay) {
      this.overlay.classList.toggle('visible', isActive);
      if (isActive) {
        this.overlayText.textContent = 'Say a command...';
      }
    }
  }
  
  /**
   * Show visual feedback
   */
  showFeedback(icon, text) {
    if (!this.feedbackEl) return;
    
    this.feedbackEl.querySelector('.voice-feedback-icon').textContent = icon;
    this.feedbackEl.querySelector('.voice-feedback-text').textContent = text;
    this.feedbackEl.classList.add('visible');
    
    clearTimeout(this.feedbackTimeout);
    this.feedbackTimeout = setTimeout(() => {
      this.feedbackEl.classList.remove('visible');
    }, 1500);
  }
  
  /**
   * Text-to-speech feedback
   */
  speak(text) {
    if (!this.synthesis) return;
    
    // Cancel any ongoing speech
    this.synthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.getLanguage();
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    this.synthesis.speak(utterance);
  }
  
  // ============================================
  // COMMAND IMPLEMENTATIONS
  // ============================================
  
  executeStartTracking() {
    const startBtn = document.getElementById('startBtn');
    if (startBtn && !startBtn.disabled) {
      startBtn.click();
    } else {
      this.speak('Tracking is already active or cannot be started.');
    }
  }
  
  executeStopTracking() {
    const stopBtn = document.getElementById('stopBtn');
    if (stopBtn && !stopBtn.classList.contains('hidden')) {
      stopBtn.click();
    } else {
      this.speak('No active tracking to stop.');
    }
  }
  
  executePauseTracking() {
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn && !pauseBtn.classList.contains('hidden')) {
      pauseBtn.click();
    } else {
      this.speak('Cannot pause right now.');
    }
  }
  
  executeResumeTracking() {
    const resumeBtn = document.getElementById('resumeBtn');
    if (resumeBtn && !resumeBtn.classList.contains('hidden')) {
      resumeBtn.click();
    } else {
      // Try start button as fallback
      this.executeStartTracking();
    }
  }
  
  executeTakePhoto() {
    const photoBtn = document.getElementById('takePhotoBtn');
    if (photoBtn) {
      photoBtn.click();
    } else {
      // Try triggering the function directly
      if (window.takePhoto) {
        window.takePhoto();
      } else {
        this.speak('Photo function not available.');
      }
    }
  }
  
  executeAddNote() {
    // Pause voice commands so note's speech-to-text can use mic
    const wasListening = this.isListening;
    if (wasListening) {
      this.pauseListening();
    }
    
    const noteBtn = document.getElementById('addNoteBtn');
    if (noteBtn) {
      noteBtn.click();
      
      // Resume voice commands after modal closes
      if (wasListening) {
        this.waitForModalClose().then(() => {
          this.resumeListening();
        });
      }
    } else if (window.addTextNote) {
      window.addTextNote();
      
      if (wasListening) {
        this.waitForModalClose().then(() => {
          this.resumeListening();
        });
      }
    } else {
      this.speak('Note function not available.');
      if (wasListening) {
        this.resumeListening();
      }
    }
  }
  
  /**
   * Wait for modal to close before resuming
   */
  waitForModalClose() {
    return new Promise((resolve) => {
      const checkModal = () => {
        const modalBackdrop = document.querySelector('.modal-backdrop.active');
        if (!modalBackdrop) {
          resolve();
        } else {
          setTimeout(checkModal, 200);
        }
      };
      // Start checking after a brief delay to let modal open
      setTimeout(checkModal, 500);
    });
  }
  
  executeSurvey() {
    const surveyBtn = document.getElementById('accessibilitySurveyBtn');
    if (surveyBtn) {
      surveyBtn.click();
    } else if (window.openAccessibilitySurvey) {
      window.openAccessibilitySurvey();
    } else {
      this.speak('Survey not available.');
    }
  }
  
  executeEmergency() {
    const sosBtn = document.getElementById('sosBtn');
    if (sosBtn) {
      sosBtn.click();
    } else if (window.triggerSOS) {
      window.triggerSOS();
    } else {
      this.speak('Emergency function not available.');
    }
  }
  
  async executeWhereAmI() {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000
        });
      });
      
      const lat = position.coords.latitude.toFixed(5);
      const lng = position.coords.longitude.toFixed(5);
      
      // Try reverse geocoding
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        );
        const data = await response.json();
        
        if (data.display_name) {
          const shortAddress = data.display_name.split(',').slice(0, 3).join(',');
          this.speak(`You are at ${shortAddress}`);
          this.showFeedback('📍', shortAddress);
        } else {
          this.speak(`Your coordinates are ${lat}, ${lng}`);
        }
      } catch (e) {
        this.speak(`Your coordinates are ${lat}, ${lng}`);
      }
    } catch (e) {
      this.speak('Unable to get your location.');
    }
  }
  
  executeZoomIn() {
    const zoomInBtn = document.getElementById('zoomInBtn');
    if (zoomInBtn) {
      zoomInBtn.click();
    } else if (window.map) {
      window.map.zoomIn();
    }
  }
  
  executeZoomOut() {
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    if (zoomOutBtn) {
      zoomOutBtn.click();
    } else if (window.map) {
      window.map.zoomOut();
    }
  }
  
  executeCenterMap() {
    const centerBtn = document.getElementById('centerBtn');
    if (centerBtn) {
      centerBtn.click();
    } else if (window.centerOnUser) {
      window.centerOnUser();
    }
  }
  
  executeWeather() {
    const weatherWidget = document.querySelector('.weather-widget');
    if (weatherWidget) {
      weatherWidget.click();
    } else {
      this.speak('Weather information not available.');
    }
  }
  
  /**
   * Check if voice commands are supported
   */
  checkSupport() {
    return this.isSupported;
  }
  
  /**
   * Toggle listening state
   */
  toggle() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }
}

// Create singleton instance
const voiceCommands = new VoiceCommandsManager();

// Export
export { voiceCommands };
export default voiceCommands;

/**
 * Tutorial System for Access Nature App
 * Provides animated slideshow tutorials for each screen
 * Features: first-time detection, replay capability, notification integration
 */

export class TutorialSystem {
  constructor() {
    this.currentSlide = 0;
    this.currentTutorial = null;
    this.isOpen = false;
    this.autoPlayInterval = null;
    
    // Storage keys
    this.STORAGE_KEY = 'accessNature_tutorials';
    
    // Tutorial definitions for each page
    this.tutorials = {
      index: {
        id: 'index',
        title: 'Welcome to Access Nature',
        slides: [
          {
            title: 'Welcome! 👋',
            content: 'Access Nature helps you discover and track accessible outdoor routes. Let\'s take a quick tour!',
            icon: '🌿',
            highlight: null
          },
          {
            title: 'Discover Accessible Trails',
            content: 'Browse community-contributed trail guides with detailed accessibility information like surface type, slope, and obstacles.',
            icon: '🗺️',
            highlight: '.trail-guide-card, .featured-guides'
          },
          {
            title: 'Track Your Adventures',
            content: 'Start tracking your own routes with GPS, then contribute accessibility data to help others.',
            icon: '📍',
            highlight: '.cta-button, [href*="tracker"]'
          },
          {
            title: 'View Your Reports',
            content: 'See all your tracked routes, stats, and contributions in the Reports section.',
            icon: '📊',
            highlight: '[href*="reports"]'
          },
          {
            title: 'Sign In to Sync',
            content: 'Create an account to save your routes to the cloud and access them from any device.',
            icon: '☁️',
            highlight: '#navAuthBtn, .auth-btn'
          },
          {
            title: 'You\'re Ready!',
            content: 'Tap "Start Tracking" to begin your first accessible adventure. You can replay this tutorial anytime from the menu.',
            icon: '🎉',
            highlight: null
          }
        ]
      },
      tracker: {
        id: 'tracker',
        title: 'Tracker Tutorial',
        slides: [
          {
            title: 'The Tracker Map 🗺️',
            content: 'This is your tracking screen. You\'ll see your location on the map and can record your route as you move.',
            icon: '🗺️',
            highlight: '#map'
          },
          {
            title: 'Start Tracking',
            content: 'Tap the green START button to begin recording your route. GPS will track your position.',
            icon: '▶️',
            highlight: '#startBtn'
          },
          {
            title: 'Pause & Stop',
            content: 'Use PAUSE to temporarily stop tracking, or STOP to finish and save your route.',
            icon: '⏹️',
            highlight: '#pauseBtn, #stopBtn'
          },
          {
            title: 'Add Photos & Notes',
            content: 'Document your journey! Take photos of interesting spots or potential obstacles.',
            icon: '📷',
            highlight: '#takePhotoBtn, #addNoteBtn'
          },
          {
            title: 'Accessibility Survey',
            content: 'The purple clipboard button lets you record accessibility details like surface type, slope, and obstacles.',
            icon: '♿',
            highlight: '#accessibilitySurveyBtn'
          },
          {
            title: 'Map Controls',
            content: 'Zoom in/out, center on your location, change map layers, and toggle rotation using these buttons.',
            icon: '🧭',
            highlight: '#zoomInBtn, #centerBtn, #mapLayersBtn'
          },
          {
            title: 'Safety Features',
            content: 'Access emergency SOS, weather info, and lifeline features from the Safety panel.',
            icon: '🛡️',
            highlight: '#safetyPanelBtn'
          },
          {
            title: 'Save to Cloud',
            content: 'Sign in to save your routes to the cloud and access them from any device.',
            icon: '☁️',
            highlight: '#saveToCloudBtn'
          },
          {
            title: 'Ready to Explore!',
            content: 'You\'re all set! Start tracking to begin mapping accessible routes. Replay this tutorial anytime from More Options.',
            icon: '🎯',
            highlight: null
          }
        ]
      },
      reports: {
        id: 'reports',
        title: 'Reports Tutorial',
        slides: [
          {
            title: 'Your Reports 📊',
            content: 'This screen shows all your tracked routes, statistics, and contributions to the accessibility database.',
            icon: '📊',
            highlight: null
          },
          {
            title: 'Route List',
            content: 'Browse all your recorded routes. Tap any route to view details, replay on map, or export.',
            icon: '📋',
            highlight: '.route-card, .route-list'
          },
          {
            title: 'Route Statistics',
            content: 'See distance, duration, elevation gain, and accessibility scores for each route.',
            icon: '📈',
            highlight: '.stats-card, .route-stats'
          },
          {
            title: 'Export Options',
            content: 'Export your routes as GPX files, PDFs, or shareable Trail Guides.',
            icon: '📤',
            highlight: '.export-btn, [data-action="export"]'
          },
          {
            title: 'Trail Guides',
            content: 'Generate beautiful trail guides with maps, photos, and accessibility info to share with others.',
            icon: '🌐',
            highlight: '.trail-guide-btn'
          },
          {
            title: 'Cloud Sync',
            content: 'Your routes sync automatically when signed in. Load routes from any device.',
            icon: '☁️',
            highlight: '.cloud-btn'
          },
          {
            title: 'That\'s It!',
            content: 'Explore your reports and share your accessible routes with the community!',
            icon: '✨',
            highlight: null
          }
        ]
      }
    };
    
    this.injectStyles();
  }
  
  /**
   * Initialize tutorial system
   */
  init() {
    console.log('📚 Tutorial system initialized');
    
    // Check for first-time visit
    const page = this.getCurrentPage();
    if (page && !this.hasSeenTutorial(page)) {
      // Show tutorial after a short delay to let page load
      setTimeout(() => {
        this.promptFirstTimeTutorial(page);
      }, 1500);
    }
    
    // Expose global functions
    window.showTutorial = (page) => this.show(page || this.getCurrentPage());
    window.tutorialSystem = this;
  }
  
  /**
   * Get current page identifier
   */
  getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('tracker')) return 'tracker';
    if (path.includes('reports')) return 'reports';
    if (path.includes('index') || path === '/' || path.endsWith('/')) return 'index';
    return null;
  }
  
  /**
   * Check if user has seen tutorial for a page
   */
  hasSeenTutorial(pageId) {
    try {
      const data = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
      return data[pageId]?.seen === true;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Mark tutorial as seen
   */
  markAsSeen(pageId) {
    try {
      const data = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
      data[pageId] = { seen: true, seenAt: new Date().toISOString() };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save tutorial state');
    }
  }
  
  /**
   * Reset all tutorials (for testing or user request)
   */
  resetAll() {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('📚 All tutorials reset');
  }
  
  /**
   * Prompt first-time tutorial
   */
  promptFirstTimeTutorial(pageId) {
    const tutorial = this.tutorials[pageId];
    if (!tutorial) return;
    
    this.showPrompt(tutorial);
  }
  
  /**
   * Show tutorial prompt modal
   */
  showPrompt(tutorial) {
    const overlay = document.createElement('div');
    overlay.className = 'tutorial-prompt-overlay';
    overlay.innerHTML = `
      <div class="tutorial-prompt-modal">
        <div class="tutorial-prompt-icon">📚</div>
        <h2 class="tutorial-prompt-title">Quick Tutorial?</h2>
        <p class="tutorial-prompt-text">Would you like a quick tour of ${tutorial.title.toLowerCase()}?</p>
        <div class="tutorial-prompt-buttons">
          <button class="tutorial-prompt-btn tutorial-prompt-skip" id="tutorialSkip">Skip</button>
          <button class="tutorial-prompt-btn tutorial-prompt-start" id="tutorialStart">Yes, Show Me!</button>
        </div>
        <label class="tutorial-prompt-remember">
          <input type="checkbox" id="tutorialDontAsk" checked>
          <span>Don't ask again for this page</span>
        </label>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Animate in
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
    });
    
    // Button handlers
    overlay.querySelector('#tutorialSkip').addEventListener('click', () => {
      if (overlay.querySelector('#tutorialDontAsk').checked) {
        this.markAsSeen(tutorial.id);
      }
      this.closePrompt(overlay);
    });
    
    overlay.querySelector('#tutorialStart').addEventListener('click', () => {
      this.markAsSeen(tutorial.id);
      this.closePrompt(overlay);
      setTimeout(() => this.show(tutorial.id), 300);
    });
    
    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closePrompt(overlay);
      }
    });
  }
  
  /**
   * Close prompt modal
   */
  closePrompt(overlay) {
    overlay.classList.remove('visible');
    setTimeout(() => overlay.remove(), 300);
  }
  
  /**
   * Show tutorial for a specific page
   */
  show(pageId) {
    const tutorial = this.tutorials[pageId];
    if (!tutorial) {
      console.warn(`Tutorial not found for: ${pageId}`);
      return;
    }
    
    this.currentTutorial = tutorial;
    this.currentSlide = 0;
    this.isOpen = true;
    
    this.createOverlay();
    this.renderSlide();
    
    // Keyboard navigation
    this.keyHandler = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') this.nextSlide();
      if (e.key === 'ArrowLeft') this.prevSlide();
      if (e.key === 'Escape') this.close();
    };
    document.addEventListener('keydown', this.keyHandler);
  }
  
  /**
   * Create tutorial overlay
   */
  createOverlay() {
    // Remove any existing overlay
    document.querySelector('.tutorial-overlay')?.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'tutorial-overlay';
    overlay.innerHTML = `
      <div class="tutorial-backdrop"></div>
      <div class="tutorial-container">
        <button class="tutorial-close" aria-label="Close tutorial">✕</button>
        <div class="tutorial-content">
          <div class="tutorial-icon"></div>
          <h2 class="tutorial-title"></h2>
          <p class="tutorial-text"></p>
        </div>
        <div class="tutorial-progress">
          <div class="tutorial-dots"></div>
        </div>
        <div class="tutorial-nav">
          <button class="tutorial-btn tutorial-prev" disabled>← Back</button>
          <button class="tutorial-btn tutorial-next">Next →</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Event listeners
    overlay.querySelector('.tutorial-close').addEventListener('click', () => this.close());
    overlay.querySelector('.tutorial-prev').addEventListener('click', () => this.prevSlide());
    overlay.querySelector('.tutorial-next').addEventListener('click', () => this.nextSlide());
    overlay.querySelector('.tutorial-backdrop').addEventListener('click', () => this.close());
    
    // Animate in
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
    });
    
    this.overlay = overlay;
  }
  
  /**
   * Render current slide
   */
  renderSlide() {
    const slide = this.currentTutorial.slides[this.currentSlide];
    const total = this.currentTutorial.slides.length;
    
    // Update content with animation
    const content = this.overlay.querySelector('.tutorial-content');
    content.classList.add('slide-out');
    
    setTimeout(() => {
      this.overlay.querySelector('.tutorial-icon').textContent = slide.icon;
      this.overlay.querySelector('.tutorial-title').textContent = slide.title;
      this.overlay.querySelector('.tutorial-text').textContent = slide.content;
      
      content.classList.remove('slide-out');
      content.classList.add('slide-in');
      
      setTimeout(() => content.classList.remove('slide-in'), 300);
    }, 150);
    
    // Update dots
    const dotsContainer = this.overlay.querySelector('.tutorial-dots');
    dotsContainer.innerHTML = this.currentTutorial.slides.map((_, i) => 
      `<span class="tutorial-dot ${i === this.currentSlide ? 'active' : ''}" data-slide="${i}"></span>`
    ).join('');
    
    // Add dot click handlers
    dotsContainer.querySelectorAll('.tutorial-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        this.goToSlide(parseInt(dot.dataset.slide));
      });
    });
    
    // Update navigation buttons
    const prevBtn = this.overlay.querySelector('.tutorial-prev');
    const nextBtn = this.overlay.querySelector('.tutorial-next');
    
    prevBtn.disabled = this.currentSlide === 0;
    
    if (this.currentSlide === total - 1) {
      nextBtn.textContent = 'Done ✓';
      nextBtn.classList.add('done');
    } else {
      nextBtn.textContent = 'Next →';
      nextBtn.classList.remove('done');
    }
    
    // Handle element highlighting
    this.updateHighlight(slide.highlight);
  }
  
  /**
   * Highlight specific elements on the page
   */
  updateHighlight(selector) {
    // Remove previous highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });
    
    if (!selector) return;
    
    // Add highlight to matching elements
    const selectors = selector.split(',').map(s => s.trim());
    selectors.forEach(sel => {
      try {
        const element = document.querySelector(sel);
        if (element) {
          element.classList.add('tutorial-highlight');
          // Scroll element into view if needed
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } catch (e) {
        // Invalid selector, ignore
      }
    });
  }
  
  /**
   * Navigate to next slide
   */
  nextSlide() {
    if (this.currentSlide < this.currentTutorial.slides.length - 1) {
      this.currentSlide++;
      this.renderSlide();
    } else {
      this.close();
    }
  }
  
  /**
   * Navigate to previous slide
   */
  prevSlide() {
    if (this.currentSlide > 0) {
      this.currentSlide--;
      this.renderSlide();
    }
  }
  
  /**
   * Go to specific slide
   */
  goToSlide(index) {
    if (index >= 0 && index < this.currentTutorial.slides.length) {
      this.currentSlide = index;
      this.renderSlide();
    }
  }
  
  /**
   * Close tutorial
   */
  close() {
    if (!this.overlay) return;
    
    this.isOpen = false;
    
    // Remove highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });
    
    // Animate out
    this.overlay.classList.remove('visible');
    
    setTimeout(() => {
      this.overlay.remove();
      this.overlay = null;
    }, 300);
    
    // Remove keyboard handler
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
    }
    
    // Clear auto-play
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }
  
  /**
   * Generate shareable tutorial link
   */
  getShareableLink(pageId) {
    const baseUrl = window.location.origin;
    const page = pageId || this.getCurrentPage();
    
    switch(page) {
      case 'index':
        return `${baseUrl}/?tutorial=1`;
      case 'tracker':
        return `${baseUrl}/tracker.html?tutorial=1`;
      case 'reports':
        return `${baseUrl}/reports.html?tutorial=1`;
      default:
        return `${baseUrl}/?tutorial=1`;
    }
  }
  
  /**
   * Check URL for tutorial parameter
   */
  checkUrlForTutorial() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tutorial') === '1') {
      const page = this.getCurrentPage();
      if (page) {
        setTimeout(() => this.show(page), 1000);
      }
      // Clean URL
      params.delete('tutorial');
      const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState({}, '', newUrl);
    }
  }
  
  /**
   * Create notification message with tutorial link
   */
  createNotificationContent(pageId) {
    const tutorial = this.tutorials[pageId];
    if (!tutorial) return null;
    
    return {
      title: `📚 ${tutorial.title}`,
      message: 'Tap to learn how to use this feature with a quick interactive tutorial.',
      action: () => this.show(pageId),
      link: this.getShareableLink(pageId)
    };
  }
  
  /**
   * Inject tutorial styles
   */
  injectStyles() {
    if (document.getElementById('tutorial-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'tutorial-styles';
    styles.textContent = `
      /* Tutorial Prompt Modal */
      .tutorial-prompt-overlay {
        position: fixed;
        inset: 0;
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0);
        backdrop-filter: blur(0);
        transition: all 0.3s ease;
        padding: 20px;
      }
      
      .tutorial-prompt-overlay.visible {
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(8px);
      }
      
      .tutorial-prompt-modal {
        background: white;
        border-radius: 24px;
        padding: 32px;
        max-width: 380px;
        width: 100%;
        text-align: center;
        transform: scale(0.9) translateY(20px);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
      }
      
      .tutorial-prompt-overlay.visible .tutorial-prompt-modal {
        transform: scale(1) translateY(0);
        opacity: 1;
      }
      
      .tutorial-prompt-icon {
        font-size: 3rem;
        margin-bottom: 16px;
      }
      
      .tutorial-prompt-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1a1a2e;
        margin: 0 0 12px 0;
      }
      
      .tutorial-prompt-text {
        color: #666;
        margin: 0 0 24px 0;
        line-height: 1.5;
      }
      
      .tutorial-prompt-buttons {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
      }
      
      .tutorial-prompt-btn {
        flex: 1;
        padding: 14px 24px;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
      }
      
      .tutorial-prompt-skip {
        background: #f0f0f0;
        color: #666;
      }
      
      .tutorial-prompt-skip:hover {
        background: #e0e0e0;
      }
      
      .tutorial-prompt-start {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
      
      .tutorial-prompt-start:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
      }
      
      .tutorial-prompt-remember {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 0.85rem;
        color: #888;
        cursor: pointer;
      }
      
      .tutorial-prompt-remember input {
        width: 16px;
        height: 16px;
        cursor: pointer;
      }
      
      /* Tutorial Overlay */
      .tutorial-overlay {
        position: fixed;
        inset: 0;
        z-index: 100001;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
        padding: 20px;
      }
      
      .tutorial-overlay.visible {
        opacity: 1;
      }
      
      .tutorial-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(10px);
      }
      
      .tutorial-container {
        position: relative;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border-radius: 24px;
        padding: 40px;
        max-width: 480px;
        width: 100%;
        color: white;
        transform: scale(0.9) translateY(30px);
        transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .tutorial-overlay.visible .tutorial-container {
        transform: scale(1) translateY(0);
      }
      
      .tutorial-close {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .tutorial-close:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: rotate(90deg);
      }
      
      .tutorial-content {
        text-align: center;
        margin-bottom: 32px;
        transition: all 0.15s ease;
      }
      
      .tutorial-content.slide-out {
        opacity: 0;
        transform: translateX(-20px);
      }
      
      .tutorial-content.slide-in {
        animation: slideIn 0.3s ease forwards;
      }
      
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      .tutorial-icon {
        font-size: 4rem;
        margin-bottom: 20px;
        display: block;
      }
      
      .tutorial-title {
        font-size: 1.6rem;
        font-weight: 700;
        margin: 0 0 16px 0;
        background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .tutorial-text {
        font-size: 1.05rem;
        line-height: 1.6;
        color: rgba(255, 255, 255, 0.85);
        margin: 0;
      }
      
      .tutorial-progress {
        display: flex;
        justify-content: center;
        margin-bottom: 24px;
      }
      
      .tutorial-dots {
        display: flex;
        gap: 10px;
      }
      
      .tutorial-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .tutorial-dot:hover {
        background: rgba(255, 255, 255, 0.5);
        transform: scale(1.2);
      }
      
      .tutorial-dot.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        transform: scale(1.3);
        box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
      }
      
      .tutorial-nav {
        display: flex;
        gap: 16px;
      }
      
      .tutorial-btn {
        flex: 1;
        padding: 14px 24px;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
      }
      
      .tutorial-prev {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.8);
      }
      
      .tutorial-prev:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .tutorial-prev:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      
      .tutorial-next {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
      
      .tutorial-next:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
      }
      
      .tutorial-next.done {
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      }
      
      .tutorial-next.done:hover {
        box-shadow: 0 5px 20px rgba(34, 197, 94, 0.4);
      }
      
      /* Element Highlight */
      .tutorial-highlight {
        position: relative;
        z-index: 99999 !important;
        animation: tutorialPulse 2s ease-in-out infinite;
        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.5), 0 0 20px rgba(102, 126, 234, 0.3) !important;
        border-radius: 8px;
      }
      
      @keyframes tutorialPulse {
        0%, 100% {
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.5), 0 0 20px rgba(102, 126, 234, 0.3);
        }
        50% {
          box-shadow: 0 0 0 8px rgba(102, 126, 234, 0.3), 0 0 40px rgba(102, 126, 234, 0.2);
        }
      }
      
      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .tutorial-prompt-modal {
          background: #1e1e1e;
        }
        
        .tutorial-prompt-title {
          color: white;
        }
        
        .tutorial-prompt-text {
          color: #aaa;
        }
        
        .tutorial-prompt-skip {
          background: #333;
          color: #ccc;
        }
        
        .tutorial-prompt-skip:hover {
          background: #444;
        }
      }
      
      /* Mobile responsive */
      @media (max-width: 480px) {
        .tutorial-container {
          padding: 28px 24px;
          margin: 10px;
          border-radius: 20px;
        }
        
        .tutorial-icon {
          font-size: 3rem;
        }
        
        .tutorial-title {
          font-size: 1.3rem;
        }
        
        .tutorial-text {
          font-size: 0.95rem;
        }
        
        .tutorial-nav {
          flex-direction: column;
        }
        
        .tutorial-btn {
          width: 100%;
        }
        
        .tutorial-prompt-modal {
          padding: 24px;
        }
        
        .tutorial-prompt-buttons {
          flex-direction: column;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }
}

// Create and export singleton instance
export const tutorialSystem = new TutorialSystem();

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      tutorialSystem.init();
      tutorialSystem.checkUrlForTutorial();
    });
  } else {
    tutorialSystem.init();
    tutorialSystem.checkUrlForTutorial();
  }
}

export default tutorialSystem;

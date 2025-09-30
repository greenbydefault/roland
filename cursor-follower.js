<script>
// Universal Cursor Follower - Standalone Script
(function() {
  'use strict';
  
  // ==================== KONFIGURATION ====================
  const CONFIG = {
    // Data Attribute für Container
    containerAttribute: 'data-cursor-area',
    
    // Data Attribute für Button
    buttonAttribute: 'data-cursor-button',
    
    // Animation Settings
    smoothness: 0.15,                         // Wie smooth der Button folgt (0.1 = langsam, 0.3 = schnell)
    throttleDelay: 16,                        // 60fps throttling
    
    // Fade Animationen
    fadeInDuration: 300,                      // Fade-In Zeit in ms
    fadeOutDuration: 200,                     // Fade-Out Zeit in ms
    fadeInEasing: 'ease-out',                 // Fade-In Easing
    fadeOutEasing: 'ease-in',                 // Fade-Out Easing
  };
  
  // ==================== HAUPT KLASSE ====================
  class CursorFollower {
    constructor() {
      this.areas = [];
      this.activeFollowers = new Map();
      this.buttonManager = new GlobalButtonManager();
      this.init();
    }
    
    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    }
    
    setup() {
      this.areas = Array.from(document.querySelectorAll(`[${CONFIG.containerAttribute}]`));
      
      if (this.areas.length === 0) {
        return;
      }
      
      this.injectCSS();
      this.areas.forEach(area => this.initArea(area));
    }
    
    initArea(area) {
      // Skip auf Touch Devices
      if ('ontouchstart' in window && navigator.maxTouchPoints > 0) {
        return;
      }
      
      const button = this.findOrCreateButton(area);
      if (!button) return;
      
      // Button dem globalen Manager zuweisen
      this.buttonManager.setButton(button);
      
      const follower = new AreaFollower(area, this.buttonManager);
      this.activeFollowers.set(area, follower);
    }
    
    findOrCreateButton(area) {
      // 1. Globalen Button suchen (erster gefundener wird für alle Areas verwendet)
      let button = document.querySelector(`[${CONFIG.buttonAttribute}]`);
      if (button) return button;
      
      // 2. Button im Area suchen
      button = area.querySelector(`[${CONFIG.buttonAttribute}]`);
      if (button) return button;
      
      // 3. Button als direktes Kind suchen
      button = Array.from(area.children).find(child => 
        child.hasAttribute(CONFIG.buttonAttribute)
      );
      if (button) return button;
      
      // 4. Default Button erstellen (nur einmal, global)
      if (!document.querySelector('.cursor-follower-button')) {
        button = this.createDefaultButton();
        document.body.appendChild(button); // An body anhängen statt an Area
        return button;
      }
      
      return document.querySelector('.cursor-follower-button');
    }
    
    createDefaultButton() {
      const button = document.createElement('div');
      button.setAttribute(CONFIG.buttonAttribute, '');
      button.className = 'cursor-follower-button';
      
      // Nur funktionale Styles (Position und Verhalten)
      Object.assign(button.style, {
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: '9999',
        opacity: '0'
      });
      
      return button;
    }
    
    injectCSS() {
      const style = document.createElement('style');
      style.textContent = `
        [${CONFIG.containerAttribute}].cursor-active {
          cursor: none !important;
        }
        [${CONFIG.containerAttribute}].cursor-active * {
          cursor: none !important;
        }
        [${CONFIG.buttonAttribute}] {
          position: fixed !important;
          pointer-events: none !important;
          z-index: 9999 !important;
          transform: translate(-50%, -50%);
        }
      `;
      document.head.appendChild(style);
    }
    
    // Public API
    refresh() {
      // Neue Areas suchen und initialisieren
      const newAreas = Array.from(document.querySelectorAll(`[${CONFIG.containerAttribute}]`));
      newAreas.forEach(area => {
        if (!this.activeFollowers.has(area)) {
          this.initArea(area);
        }
      });
    }
    
    destroy() {
      this.activeFollowers.forEach(follower => follower.destroy());
      this.activeFollowers.clear();
    }
  }
  
  // ==================== GLOBALER BUTTON MANAGER ====================
  class GlobalButtonManager {
    constructor() {
      this.button = null;
      this.activeAreas = new Set();
      this.targetX = 0;
      this.targetY = 0;
      this.currentX = 0;
      this.currentY = 0;
      this.rafId = 0;
      this.isVisible = false;
    }
    
    setButton(button) {
      this.button = button;
    }
    
    addActiveArea(area) {
      this.activeAreas.add(area);
      if (!this.isVisible) {
        this.show();
      }
    }
    
    removeActiveArea(area) {
      this.activeAreas.delete(area);
      if (this.activeAreas.size === 0) {
        this.hide();
      }
    }
    
    updatePosition(x, y) {
      this.targetX = x;
      this.targetY = y;
    }
    
    show() {
      if (!this.button) return;
      this.isVisible = true;
      
      // Fade-In Animation
      this.button.style.transition = `opacity ${CONFIG.fadeInDuration}ms ${CONFIG.fadeInEasing}`;
      this.button.style.opacity = '1';
      
      document.body.classList.add('cursor-active');
      this.startAnimation();
    }
    
    hide() {
      if (!this.button) return;
      this.isVisible = false;
      
      // Fade-Out Animation
      this.button.style.transition = `opacity ${CONFIG.fadeOutDuration}ms ${CONFIG.fadeOutEasing}`;
      this.button.style.opacity = '0';
      
      document.body.classList.remove('cursor-active');
      this.stopAnimation();
    }
    
    startAnimation() {
      if (!this.rafId) {
        this.animate();
      }
    }
    
    stopAnimation() {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = 0;
      }
    }
    
    animate() {
      if (!this.isVisible || !this.button) return;
      
      // Smooth interpolation
      this.currentX += (this.targetX - this.currentX) * CONFIG.smoothness;
      this.currentY += (this.targetY - this.currentY) * CONFIG.smoothness;
      
      // Button Position setzen
      this.button.style.left = `${this.currentX}px`;
      this.button.style.top = `${this.currentY}px`;
      
      // Nächsten Frame anfordern
      this.rafId = requestAnimationFrame(() => this.animate());
    }
  }
  
  // ==================== EINZELNER AREA FOLLOWER ====================
  class AreaFollower {
    constructor(area, buttonManager) {
      this.area = area;
      this.buttonManager = buttonManager;
      
      this.boundMove = this.throttle(this.onMouseMove.bind(this), CONFIG.throttleDelay);
      this.boundEnter = this.onMouseEnter.bind(this);
      this.boundLeave = this.onMouseLeave.bind(this);
      
      this.attachEvents();
    }
    
    attachEvents() {
      this.area.addEventListener('mouseenter', this.boundEnter);
      this.area.addEventListener('mousemove', this.boundMove);
      this.area.addEventListener('mouseleave', this.boundLeave);
    }
    
    onMouseEnter() {
      this.area.classList.add('cursor-active');
      this.buttonManager.addActiveArea(this.area);
    }
    
    onMouseMove(e) {
      // Position an globalen Button Manager weiterleiten
      this.buttonManager.updatePosition(e.clientX, e.clientY);
    }
    
    onMouseLeave() {
      this.area.classList.remove('cursor-active');
      this.buttonManager.removeActiveArea(this.area);
    }
    
    
    throttle(func, delay) {
      let timeoutId;
      let lastExecTime = 0;
      return function (...args) {
        const currentTime = Date.now();
        
        if (currentTime - lastExecTime > delay) {
          func.apply(this, args);
          lastExecTime = currentTime;
        } else {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            func.apply(this, args);
            lastExecTime = Date.now();
          }, delay - (currentTime - lastExecTime));
        }
      };
    }
    
    destroy() {
      this.area.removeEventListener('mouseenter', this.boundEnter);
      this.area.removeEventListener('mousemove', this.boundMove);
      this.area.removeEventListener('mouseleave', this.boundLeave);
      this.area.classList.remove('cursor-active');
      this.buttonManager.removeActiveArea(this.area);
    }
  }
  
  // ==================== INITIALISIERUNG ====================
  
  // Auto-Init
  const cursorFollower = new CursorFollower();
  
  // Global API verfügbar machen
  window.CursorFollower = {
    instance: cursorFollower,
    config: CONFIG,
    refresh: () => cursorFollower.refresh(),
    destroy: () => cursorFollower.destroy(),
    
    // Utility Funktionen
    addArea: (element) => {
      element.setAttribute(CONFIG.containerAttribute, '');
      cursorFollower.initArea(element);
    },
    
    removeArea: (element) => {
      const follower = cursorFollower.activeFollowers.get(element);
      if (follower) {
        follower.destroy();
        cursorFollower.activeFollowers.delete(element);
      }
      element.removeAttribute(CONFIG.containerAttribute);
    }
  };
  
})();
</script>

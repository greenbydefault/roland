(function() {
  'use strict';
  
  const CFG = {
    area: 'data-cursor-area',
    btn: 'data-cursor-button',
    btnText: 'data-cursor-button-text',
    link: 'data-cursor-link',
    linkPrefix: 'data-cursor-link-prefix',
    text: 'data-cursor-text',
    smoothness: 0.15,
    throttle: 16,
    fadeIn: 300,
    fadeOut: 200,
    // Overlay Extension
    overlay: 'data-overlay',
    overlayTrigger: 'data-overlay-trigger',
    overlayContent: 'data-overlay-content',
    overlayBgFade: 400,
    overlayContentSlide: 500,
    overlayContentDelay: 200
  };
  
  class CursorFollower {
    constructor() {
      this.areas = [];
      this.followers = new Map();
      this.btn = null;
      this.btnTextEl = null;
      this.activeAreas = new Set();
      this.tx = 0; this.ty = 0; this.cx = 0; this.cy = 0;
      this.raf = 0;
      this.visible = false;
      this.currentClickableArea = null;
      this.defaultText = '';
      this.overlayManager = null;
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
      if ('ontouchstart' in window && navigator.maxTouchPoints > 0) return;
      
      this.areas = [...document.querySelectorAll(`[${CFG.area}]`)];
      if (!this.areas.length) return;
      
      this.btn = this.findOrCreateBtn();
      this.btnTextEl = this.btn.querySelector(`[${CFG.btnText}]`);
      this.defaultText = this.btnTextEl ? this.btnTextEl.textContent : '';
      
      this.injectCSS();
      this.areas.forEach(a => this.initArea(a));
      
      this.btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.currentClickableArea) {
          this.handleClick(this.currentClickableArea);
        }
      });
      
      // Overlay-System initialisieren
      this.overlayManager = new OverlayManager(this);
      
      // ESC-Handler für Overlays
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.overlayManager?.closeAll();
      });
    }
    
    findOrCreateBtn() {
      let b = document.querySelector(`[${CFG.btn}]`);
      if (b) return b;
      
      b = document.createElement('div');
      b.setAttribute(CFG.btn, '');
      b.className = 'cursor-follower-button';
      b.textContent = '';
      document.body.appendChild(b);
      return b;
    }
    
    initArea(a) {
      const f = new AreaFollower(a, this);
      this.followers.set(a, f);
    }
    
    addActive(a) {
      this.activeAreas.add(a);
      const wasVisible = this.visible;
      if (!wasVisible) {
        this.cx = this.tx;
        this.cy = this.ty;
        this.show();
      }
    }
    
    removeActive(a) {
      this.activeAreas.delete(a);
      if (!this.activeAreas.size) this.hide();
    }
    
    updatePos(x, y) {
      this.tx = x;
      this.ty = y;
    }
    
    setClickable(clickableArea) {
      this.currentClickableArea = clickableArea;
      if (clickableArea) {
        this.btn.classList.add('clickable');
        const customText = clickableArea.getAttribute(CFG.text);
        if (this.btnTextEl) {
          if (customText) {
            this.btnTextEl.textContent = customText;
          } else if (this.defaultText) {
            this.btnTextEl.textContent = this.defaultText;
          }
        }
      } else {
        this.btn.classList.remove('clickable');
        if (this.btnTextEl && this.defaultText) {
          this.btnTextEl.textContent = this.defaultText;
        }
      }
    }
    
    show() {
      if (!this.btn) return;
      this.visible = true;
      this.btn.classList.add('visible');
      document.body.classList.add('cursor-active');
      if (!this.raf) this.animate();
    }
    
    hide() {
      if (!this.btn) return;
      this.visible = false;
      this.btn.classList.remove('visible', 'clickable');
      this.currentClickableArea = null;
      if (this.btnTextEl && this.defaultText) {
        this.btnTextEl.textContent = this.defaultText;
      }
      document.body.classList.remove('cursor-active');
      if (this.raf) {
        cancelAnimationFrame(this.raf);
        this.raf = 0;
      }
    }
    
    handleClick(el) {
      console.log('[Cursor] handleClick called on:', el);
      
      // 1. Link-Handling hat PRIORITÄT (für Listings etc.)
      let href = (el.getAttribute('href') || el.getAttribute(CFG.link) || '').trim();
      console.log('[Cursor] href:', href);
      
      // Special: Overlay schließen
      if (href === 'close') {
        console.log('[Cursor] Closing overlay');
        this.overlayManager?.closeAll();
        return;
      }
      
      // Wenn Link vorhanden → öffnen
      if (href) {
        console.log('[Cursor] Opening link:', href);
        if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('/') && !href.startsWith('#')) {
          const prefix = el.getAttribute(CFG.linkPrefix) || el.closest(`[${CFG.linkPrefix}]`)?.getAttribute(CFG.linkPrefix) || '';
          if (prefix) {
            href = prefix + href;
          } else {
            href = '/' + href;
          }
        }
        window.open(href, '_blank', 'noopener,noreferrer');
        return;
      }
      
      // 2. Kein Link → prüfe ob Overlay existiert
      const areaId = el.getAttribute(CFG.area);
      console.log('[Cursor] areaId:', areaId);
      
      if (areaId && areaId !== '' && areaId !== 'true') {
        const overlayExists = document.querySelector(`[${CFG.overlay}="${areaId}"]`);
        console.log('[Cursor] overlayExists:', overlayExists);
        
        if (overlayExists) {
          console.log('[Cursor] Opening overlay:', areaId);
          this.overlayManager?.open(areaId);
          return;
        }
      }
      
      // 3. Fallback: normaler Click
      console.log('[Cursor] Fallback click');
      if (el.tagName === 'A') el.click();
    }
    
    animate() {
      if (!this.visible || !this.btn) return;
      
      this.cx += (this.tx - this.cx) * CFG.smoothness;
      this.cy += (this.ty - this.cy) * CFG.smoothness;
      
      this.btn.style.left = `${this.cx}px`;
      this.btn.style.top = `${this.cy}px`;
      
      this.raf = requestAnimationFrame(() => this.animate());
    }
    
    injectCSS() {
      const style = document.createElement('style');
      style.textContent = `
        [${CFG.area}].cursor-active{cursor:none!important}
        [${CFG.area}].cursor-active *{cursor:none!important}
        
        [${CFG.btn}]{
          position:fixed!important;
          z-index:2147483647!important;
          transform:translate(-50%,-50%) scale(0.5);
          pointer-events:none!important;
          opacity:0;
          transition:opacity ${CFG.fadeOut}ms ease, transform ${CFG.fadeIn}ms ease;
          will-change:transform,opacity;
        }
        
        [${CFG.btn}].visible{
          opacity:1!important;
          transform:translate(-50%,-50%) scale(1)!important;
        }
        
        [${CFG.btn}].clickable{
          pointer-events:auto!important;
          cursor:pointer!important;
        }
        
        /* Overlay Extension Styles */
        [${CFG.overlay}] {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 9999;
          pointer-events: none;
          opacity: 0;
          transition: opacity ${CFG.overlayBgFade}ms ease;
        }
        
        [${CFG.overlay}][data-state="open"] {
          pointer-events: auto;
          opacity: 1;
        }
        
        [${CFG.overlayContent}] {
          position: absolute;
          top: 0;
          right: 0;
          height: 100%;
          transform: translateX(100%);
          transition: transform ${CFG.overlayContentSlide}ms cubic-bezier(0.4, 0, 0.2, 1) ${CFG.overlayContentDelay}ms;
          pointer-events: auto;
        }
        
        [${CFG.overlay}][data-state="open"] [${CFG.overlayContent}] {
          transform: translateX(0);
        }
        
        [${CFG.overlay}][data-state="open"][${CFG.area}] {
          cursor: none;
        }
      `;
      document.head.appendChild(style);
    }
    
    refresh() {
      [...document.querySelectorAll(`[${CFG.area}]`)].forEach(a => {
        if (!this.followers.has(a)) this.initArea(a);
      });
      this.overlayManager?.refresh();
    }
    
    destroy() {
      this.followers.forEach(f => f.destroy());
      this.followers.clear();
      this.overlayManager?.destroy();
      if (this.raf) cancelAnimationFrame(this.raf);
    }
  }
  
  class AreaFollower {
    constructor(area, manager) {
      this.area = area;
      this.mgr = manager;
      this.lastClickableArea = null;
      
      this.throttledMove = this.throttle(e => {
        this.mgr.updatePos(e.clientX, e.clientY);
        
        const target = document.elementFromPoint(e.clientX, e.clientY);
        let clickableArea = target?.closest(`[${CFG.link}]`);
        
        // Wenn kein Link gefunden, prüfe auf Link oder Overlay in der Area
        if (!clickableArea) {
          const hasLink = this.area.hasAttribute(CFG.link);
          const areaId = this.area.getAttribute(CFG.area);
          const hasOverlay = areaId && areaId !== '' && areaId !== 'true' && 
                            document.querySelector(`[${CFG.overlay}="${areaId}"]`);
          
          if (hasLink || hasOverlay) {
            clickableArea = this.area;
          }
        }
        
        if (clickableArea !== this.lastClickableArea) {
          this.lastClickableArea = clickableArea;
          this.mgr.setClickable(clickableArea);
        }
      }, CFG.throttle);
      
      this.onEnter = (e) => {
        this.area.classList.add('cursor-active');
        this.mgr.updatePos(e.clientX, e.clientY);
        this.mgr.addActive(this.area);
        
        // Clickable wenn Link ODER Overlay existiert
        const hasLink = this.area.hasAttribute(CFG.link);
        const areaId = this.area.getAttribute(CFG.area);
        const hasOverlay = areaId && areaId !== '' && areaId !== 'true' && 
                          document.querySelector(`[${CFG.overlay}="${areaId}"]`);
        
        if (hasLink || hasOverlay) {
          this.lastClickableArea = this.area;
          this.mgr.setClickable(this.area);
        }
      };
      
      this.onLeave = () => {
        this.area.classList.remove('cursor-active');
        this.mgr.removeActive(this.area);
        this.mgr.setClickable(null);
        this.lastClickableArea = null;
      };
      
      this.area.addEventListener('mouseenter', this.onEnter);
      this.area.addEventListener('mousemove', this.throttledMove);
      this.area.addEventListener('mouseleave', this.onLeave);
    }
    
    throttle(fn, delay) {
      let timer, last = 0;
      return function(...args) {
        const now = Date.now();
        if (now - last > delay) {
          fn.apply(this, args);
          last = now;
        } else {
          clearTimeout(timer);
          timer = setTimeout(() => {
            fn.apply(this, args);
            last = Date.now();
          }, delay - (now - last));
        }
      };
    }
    
    destroy() {
      this.area.removeEventListener('mouseenter', this.onEnter);
      this.area.removeEventListener('mousemove', this.throttledMove);
      this.area.removeEventListener('mouseleave', this.onLeave);
      this.area.classList.remove('cursor-active');
      this.mgr.removeActive(this.area);
    }
  }
  
  // === OVERLAY EXTENSION ===
  
  class OverlayManager {
    constructor(cursorFollower) {
      this.cursor = cursorFollower;
      this.overlays = new Map();
      this.setup();
    }
    
    setup() {
      // Alle Overlays registrieren
      document.querySelectorAll(`[${CFG.overlay}]`).forEach(overlay => {
        const id = overlay.getAttribute(CFG.overlay);
        this.overlays.set(id, new OverlayInstance(overlay, id, this));
      });
      
      // Trigger-Buttons einrichten
      document.querySelectorAll(`[${CFG.overlayTrigger}]`).forEach(trigger => {
        const targetId = trigger.getAttribute(CFG.overlayTrigger);
        trigger.addEventListener('click', (e) => {
          e.preventDefault();
          this.open(targetId);
        });
      });
    }
    
    open(id) {
      console.log('[Overlay] Trying to open:', id);
      
      // Falls Overlay noch nicht registriert, jetzt suchen und registrieren
      if (!this.overlays.has(id)) {
        console.log('[Overlay] Not registered yet, searching for:', `[${CFG.overlay}="${id}"]`);
        const overlayEl = document.querySelector(`[${CFG.overlay}="${id}"]`);
        if (overlayEl) {
          console.log('[Overlay] Found and registering:', overlayEl);
          this.overlays.set(id, new OverlayInstance(overlayEl, id, this));
        } else {
          console.error('[Overlay] Not found in DOM:', id);
          return;
        }
      }
      
      const overlay = this.overlays.get(id);
      console.log('[Overlay] Opening instance:', overlay);
      overlay?.open();
    }
    
    close(id) {
      this.overlays.get(id)?.close();
    }
    
    closeAll() {
      this.overlays.forEach(o => o.close());
    }
    
    refresh() {
      // Neue Overlays registrieren
      document.querySelectorAll(`[${CFG.overlay}]`).forEach(overlay => {
        const id = overlay.getAttribute(CFG.overlay);
        if (!this.overlays.has(id)) {
          this.overlays.set(id, new OverlayInstance(overlay, id, this));
        }
      });
    }
    
    destroy() {
      this.overlays.forEach(o => o.destroy());
      this.overlays.clear();
    }
  }
  
  class OverlayInstance {
    constructor(element, id, manager) {
      this.el = element;
      this.id = id;
      this.mgr = manager;
      this.content = element.querySelector(`[${CFG.overlayContent}]`);
      this.isOpen = false;
      
      this.setupCursorArea();
      this.setupClickOutside();
    }
    
    setupCursorArea() {
      // Content-Bereich blockiert die Cursor-Area
      if (this.content) {
        this.content.addEventListener('mouseenter', () => {
          this.el.removeAttribute(CFG.area);
        });
        
        this.content.addEventListener('mouseleave', () => {
          if (this.isOpen) {
            this.el.setAttribute(CFG.area, '');
            this.el.setAttribute(CFG.link, 'close');
            const customText = this.el.getAttribute(CFG.text);
            if (!customText) {
              this.el.setAttribute(CFG.text, 'Close');
            }
            this.mgr.cursor.refresh();
          }
        });
      }
    }
    
    setupClickOutside() {
      this.el.addEventListener('click', (e) => {
        // Nur schließen wenn auf Background geklickt
        if (e.target === this.el) {
          this.close();
        }
      });
    }
    
    open() {
      console.log('[OverlayInstance] open() called, isOpen:', this.isOpen, 'element:', this.el);
      
      if (this.isOpen) {
        console.log('[OverlayInstance] Already open, skipping');
        return;
      }
      
      this.isOpen = true;
      
      console.log('[OverlayInstance] Setting data-state to open');
      this.el.setAttribute('data-state', 'open');
      this.el.setAttribute(CFG.area, '');
      this.el.setAttribute(CFG.link, 'close');
      const customText = this.el.getAttribute(CFG.text);
      if (!customText) {
        this.el.setAttribute(CFG.text, 'Close');
      }
      document.body.style.overflow = 'hidden';
      
      console.log('[OverlayInstance] Refreshing cursor');
      this.mgr.cursor.refresh();
      
      console.log('[OverlayInstance] Overlay opened successfully');
    }
    
    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      
      this.el.setAttribute('data-state', 'closed');
      this.el.removeAttribute(CFG.area);
      this.el.removeAttribute(CFG.link);
      document.body.style.overflow = '';
      
      this.mgr.cursor.refresh();
    }
    
    destroy() {
      this.close();
    }
  }
  
  // === PUBLIC API ===
  
  const instance = new CursorFollower();
  
  window.CursorFollower = {
    instance,
    config: CFG,
    refresh: () => instance.refresh(),
    destroy: () => instance.destroy(),
    addArea: el => {
      el.setAttribute(CFG.area, '');
      instance.initArea(el);
    },
    removeArea: el => {
      instance.followers.get(el)?.destroy();
      instance.followers.delete(el);
      el.removeAttribute(CFG.area);
    },
    // Overlay API
    overlay: {
      open: (id) => instance.overlayManager?.open(id),
      close: (id) => instance.overlayManager?.close(id),
      closeAll: () => instance.overlayManager?.closeAll()
    }
  };
  
})();


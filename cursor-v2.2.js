(function() {
  'use strict';
  
  const CFG = {
    area: 'data-cursor-area',
    btn: 'data-cursor-button',
    btnText: 'data-cursor-button-text',
    link: 'data-cursor-link',
    text: 'data-cursor-text',
    smoothness: 0.15,
    throttle: 16,
    fadeIn: 300,
    fadeOut: 200
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
      const href = (el.getAttribute('href') || el.getAttribute(CFG.link) || '').trim();
      
      if (!href) {
        if (el.tagName === 'A') el.click();
        return;
      }
      
      window.open(href, '_blank', 'noopener,noreferrer');
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
      `;
      document.head.appendChild(style);
    }
    
    refresh() {
      [...document.querySelectorAll(`[${CFG.area}]`)].forEach(a => {
        if (!this.followers.has(a)) this.initArea(a);
      });
    }
    
    destroy() {
      this.followers.forEach(f => f.destroy());
      this.followers.clear();
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
        
        if (!clickableArea && this.area.hasAttribute(CFG.link)) {
          clickableArea = this.area;
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
        
        if (this.area.hasAttribute(CFG.link)) {
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
    }
  };
  
})();


(function() {
  'use strict';
  
  const CFG = {
    area: 'data-cursor-area',
    btn: 'data-cursor-button',
    link: 'data-cursor-link',
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
      this.activeAreas = new Set();
      this.tx = 0; this.ty = 0; this.cx = 0; this.cy = 0;
      this.raf = 0;
      this.visible = false;
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
      this.injectCSS();
      this.areas.forEach(a => this.initArea(a));
    }
    
    findOrCreateBtn() {
      let b = document.querySelector(`[${CFG.btn}]`);
      if (b) return b;
      
      b = document.createElement('div');
      b.setAttribute(CFG.btn, '');
      b.className = 'cursor-follower-button';
      b.style.cssText = 'position:fixed;pointer-events:none;z-index:9999;opacity:0';
      document.body.appendChild(b);
      return b;
    }
    
    initArea(a) {
      const f = new AreaFollower(a, this);
      this.followers.set(a, f);
    }
    
    addActive(a) {
      this.activeAreas.add(a);
      if (!this.visible) this.show();
    }
    
    removeActive(a) {
      this.activeAreas.delete(a);
      if (!this.activeAreas.size) this.hide();
    }
    
    updatePos(x, y) {
      this.tx = x;
      this.ty = y;
    }
    
    hideButton() {
      if (!this.btn) return;
      this.btn.style.opacity = '0';
    }
    
    showButton() {
      if (!this.btn || !this.visible) return;
      this.btn.style.opacity = '1';
    }
    
    show() {
      if (!this.btn) return;
      this.visible = true;
      this.btn.style.transition = `opacity ${CFG.fadeIn}ms ease-out`;
      this.btn.style.opacity = '1';
      document.body.classList.add('cursor-active');
      if (!this.raf) this.animate();
    }
    
    hide() {
      if (!this.btn) return;
      this.visible = false;
      this.btn.style.transition = `opacity ${CFG.fadeOut}ms ease-in`;
      this.btn.style.opacity = '0';
      document.body.classList.remove('cursor-active');
      if (this.raf) {
        cancelAnimationFrame(this.raf);
        this.raf = 0;
      }
    }
    
    animate() {
      if (!this.visible || !this.btn) return;
      
      this.cx += (this.tx - this.cx) * CFG.smoothness;
      this.cy += (this.ty - this.cy) * CFG.smoothness;
      
      this.btn.style.left = `${this.cx}px`;
      this.btn.style.top = `${this.cy}px`;
      this.btn.style.transform = 'translate(-50%,-50%)';
      
      this.raf = requestAnimationFrame(() => this.animate());
    }
    
    injectCSS() {
      const style = document.createElement('style');
      style.textContent = `
        [${CFG.area}].cursor-active{cursor:none!important}
        [${CFG.area}].cursor-active.over-link{cursor:default!important}
        [${CFG.area}].cursor-active *:not(a):not(button):not(input):not(select):not(textarea){cursor:none!important}
        [${CFG.area}].cursor-active a,[${CFG.area}].cursor-active button,[${CFG.area}].cursor-active input,[${CFG.area}].cursor-active select,[${CFG.area}].cursor-active textarea{cursor:pointer!important}
        [${CFG.btn}]{position:fixed!important;z-index:9999!important;transform:translate(-50%,-50%);transition:opacity ${CFG.fadeOut}ms}
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
      this.overInteractive = false;
      this.clickableArea = null;
      
      this.throttledMove = this.throttle(e => {
        this.mgr.updatePos(e.clientX, e.clientY);
        
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const interactiveEl = target?.closest('a, button, input, select, textarea');
        const clickableArea = target?.closest(`[${CFG.link}]`);
        
        if (interactiveEl) {
          if (!this.overInteractive) {
            this.overInteractive = true;
            this.area.classList.add('over-link');
            this.mgr.hideButton();
          }
        } else {
          if (this.overInteractive) {
            this.overInteractive = false;
            this.area.classList.remove('over-link');
            this.mgr.showButton();
          }
          
          if (clickableArea && clickableArea !== this.clickableArea) {
            this.clickableArea = clickableArea;
            this.mgr.btn.style.pointerEvents = 'auto';
            this.mgr.btn.style.cursor = 'pointer';
            this.mgr.btn.onclick = () => this.handleClick(clickableArea);
          } else if (!clickableArea && this.clickableArea) {
            this.clickableArea = null;
            this.mgr.btn.style.pointerEvents = 'none';
            this.mgr.btn.style.cursor = 'default';
            this.mgr.btn.onclick = null;
          }
        }
      }, CFG.throttle);
      
      this.area.addEventListener('mouseenter', () => {
        this.area.classList.add('cursor-active');
        this.mgr.addActive(this.area);
      });
      
      this.area.addEventListener('mousemove', this.throttledMove);
      
      this.area.addEventListener('mouseleave', () => {
        this.area.classList.remove('cursor-active', 'over-link');
        this.mgr.removeActive(this.area);
        this.overInteractive = false;
        this.clickableArea = null;
        this.mgr.btn.style.pointerEvents = 'none';
        this.mgr.btn.onclick = null;
      });
    }
    
    handleClick(el) {
      const href = el.getAttribute('href') || el.getAttribute(CFG.link);
      if (href) {
        if (href.startsWith('http') || href.startsWith('/')) {
          window.location.href = href;
        }
      }
      
      const clickEvent = el.getAttribute('onclick');
      if (clickEvent) {
        el.click();
      }
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
      this.area.classList.remove('cursor-active', 'over-link');
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

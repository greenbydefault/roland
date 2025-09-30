<script>
(function() {
  'use strict';
  
  const CFG = {
    container: '.grid-list',
    item: '.openup__item',
    panel: '.openup__panel',
    content: '.openup__text',
    wrapper: '.openup__wrapper',
    duration: 600,
    textDelayIn: 300,
    textDelayOut: 0,
    activeWidth: '50em',
    activeClass: 'is-active',
    animatingClass: 'is-animating',
    throttleDelay: 16
  };
  
  class OpenUp {
    constructor() {
      this.containers = [];
      this.active = new Map();
      this.animating = new Set();
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
      this.containers = [...document.querySelectorAll(CFG.container)];
      if (!this.containers.length) return;
      
      this.containers.forEach(c => this.initContainer(c));
      this.injectStyles();
      window.addEventListener('resize', () => this.onResize(), { passive: true });
    }
    
    initContainer(c) {
      const items = [...c.querySelectorAll(CFG.item)];
      if (!items.length) return;
      
      this.applyWidths(c, 0, items);
      
      items.forEach((item, i) => {
        const panel = item.querySelector(CFG.panel);
        const content = item.querySelector(CFG.content);
        if (!panel) return;
        
        panel.setAttribute('role', 'button');
        panel.setAttribute('tabindex', '0');
        panel.setAttribute('aria-expanded', i === 0 ? 'true' : 'false');
        
        panel.addEventListener('click', (e) => {
          e.preventDefault();
          this.toggle(c, i);
        });
        
        panel.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.toggle(c, i);
          } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            this.nav(c, 1);
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            this.nav(c, -1);
          }
        });
        
        if (content) {
          content.style.opacity = i === 0 ? '1' : '0';
          content.style.pointerEvents = i === 0 ? 'auto' : 'none';
          content.style.transition = 'none';
        }
      });
      
      this.activate(c, 0, false);
      this.initCursor(c);
    }
    
    toggle(c, idx) {
      if (this.active.get(c) !== idx) this.activate(c, idx);
    }
    
    activate(c, idx, anim = true) {
      if (this.animating.has(c) && anim) return;
      
      const items = [...c.querySelectorAll(CFG.item)];
      const target = items[idx];
      if (!target) return;
      
      this.active.set(c, idx);
      if (anim) this.animating.add(c);
      
      this.applyWidths(c, idx, items);
      
      items.forEach((item, i) => {
        const content = item.querySelector(CFG.content);
        const panel = item.querySelector(CFG.panel);
        const isActive = i === idx;
        
        item.classList.toggle(CFG.activeClass, isActive);
        if (anim) item.classList.add(CFG.animatingClass);
        panel?.setAttribute('aria-expanded', isActive ? 'true' : 'false');
        
        if (content) {
          if (isActive) {
            content.style.transition = anim ? `opacity ${CFG.duration}ms ease ${CFG.textDelayIn}ms` : 'none';
            content.style.opacity = '1';
            content.style.pointerEvents = 'auto';
          } else {
            content.style.transition = anim ? `opacity ${CFG.duration / 2}ms ease ${CFG.textDelayOut}ms` : 'none';
            content.style.opacity = '0';
            content.style.pointerEvents = 'none';
          }
        }
      });
      
      if (anim) {
        setTimeout(() => {
          this.animating.delete(c);
          items.forEach(item => item.classList.remove(CFG.animatingClass));
        }, CFG.duration + CFG.textDelayIn);
      }
    }
    
    applyWidths(c, activeIdx, itemsList) {
      const items = itemsList || [...c.querySelectorAll(CFG.item)];
      const cw = c.clientWidth;
      if (!cw || !items.length) return;
      
      const aw = Math.min(this.resolveWidth(CFG.activeWidth, c), cw);
      const iw = items.length > 1 ? (cw - aw) / (items.length - 1) : cw / items.length;
      
      items.forEach((item, i) => {
        item.style.minWidth = '0';
        if (i === activeIdx) {
          item.style.flex = `0 1 ${aw}px`;
          item.style.maxWidth = `${aw}px`;
        } else {
          item.style.flex = '1 1 0px';
          item.style.maxWidth = 'none';
        }
      });
    }
    
    resolveWidth(val, c) {
      if (typeof val === 'number') return val;
      const str = String(val).trim();
      const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const cw = c.clientWidth || 0;
      
      if (str.endsWith('em') || str.endsWith('rem')) return parseFloat(str) * root;
      if (str.endsWith('%')) return cw * (parseFloat(str) / 100);
      if (str.endsWith('vw')) return window.innerWidth * (parseFloat(str) / 100);
      if (str.endsWith('vh')) return window.innerHeight * (parseFloat(str) / 100);
      if (str.endsWith('px')) return parseFloat(str);
      
      const num = parseFloat(str);
      return !isNaN(num) ? num : cw;
    }
    
    onResize() {
      this.containers.forEach(c => {
        const idx = this.active.get(c) ?? 0;
        this.applyWidths(c, idx);
      });
    }
    
    nav(c, dir) {
      const items = [...c.querySelectorAll(CFG.item)];
      const curr = this.active.get(c) || 0;
      const next = (curr + dir + items.length) % items.length;
      
      this.activate(c, next);
      items[next]?.querySelector(CFG.panel)?.focus();
    }
    
    injectStyles() {
      const style = document.createElement('style');
      style.textContent = `
        .openup__item {
          transition: all ${CFG.duration}ms cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .openup__item.${CFG.activeClass} {
          width: ${CFG.activeWidth} !important;
          flex: 0 0 ${CFG.activeWidth} !important;
        }
        .openup__item ${CFG.content} {
          opacity: 0 !important;
          color: var(--korall--asphalt--asphalt-400) !important;
          transition: opacity ${CFG.duration}ms ease-out ${CFG.textDelayOut}ms !important;
        }
        .openup__item.${CFG.activeClass} ${CFG.content} {
          opacity: 1 !important;
          color: inherit !important;
          transition: opacity ${CFG.duration}ms ease-out ${CFG.textDelayIn}ms !important;
        }
        .openup__item.${CFG.activeClass} ${CFG.content} .counter-step {
          color: var(--korall--korall-orange-900) !important;
        }
        .grid-list.hide-cursor, .grid-list.hide-cursor * {
          cursor: none !important;
        }
        .button-open-up {
          position: absolute !important;
          pointer-events: none !important;
          z-index: 9999 !important;
          opacity: 0 !important;
          transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .grid-list.hide-cursor .button-open-up {
          opacity: 1 !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    initCursor(c) {
      if ('ontouchstart' in window && navigator.maxTouchPoints > 0) return;
      
      const btn = c.querySelector(`${CFG.wrapper} [data-open-up-button]`) ||
                  c.querySelector(`${CFG.wrapper} .button-open-up`) ||
                  c.querySelector('[data-open-up-button]') ||
                  c.querySelector('.button-open-up') ||
                  [...c.children].find(el => el.hasAttribute?.('data-open-up-button')) ||
                  [...c.children].find(el => el.classList?.contains('button-open-up')) ||
                  [...document.querySelectorAll('[data-open-up-button]')].find(el => el.closest(CFG.container) === c) ||
                  [...document.querySelectorAll('.button-open-up')].find(el => el.closest(CFG.container) === c);
      
      if (!btn) return;
      
      let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, vis = false;
      
      const throttledMove = this.throttle((e) => {
        const rect = c.getBoundingClientRect();
        tx = e.clientX - rect.left;
        ty = e.clientY - rect.top;
      }, CFG.throttleDelay);
      
      const loop = () => {
        cx += (tx - cx) * 0.1;
        cy += (ty - cy) * 0.1;
        btn.style.cssText = `left:${cx}px;top:${cy}px;transform:translate(-50%,-50%)`;
        if (vis) raf = requestAnimationFrame(loop);
      };
      
      const start = () => {
        vis = true;
        c.classList.add('hide-cursor');
        if (!raf) raf = requestAnimationFrame(loop);
      };
      
      const stop = () => {
        vis = false;
        c.classList.remove('hide-cursor');
        if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      };
      
      c.addEventListener('mouseenter', start);
      c.addEventListener('mousemove', throttledMove);
      c.addEventListener('mouseleave', stop);
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
  }
  
  const instance = new OpenUp();
  window.OpenUpHandler = OpenUp;
  window.OpenUpConfig = CFG;
  window.openUpInstance = instance;
  
})();
</script>
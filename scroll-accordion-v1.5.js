(function() {
  'use strict';
  
  const CFG = {
    container: '[data-scroll-accordion]',
    item: '[data-acc-step]',
    content: '[data-acc-body]',
    number: '[data-acc-number]',
    inactiveColor: '#D9D6D1',
    animDuration: 800,
    scrollThrottle: 100,
    minScrollDistance: 0.3
  };
  
  class ScrollAccordion {
    constructor() {
      this.instances = [];
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
      const containers = document.querySelectorAll(CFG.container);
      if (!containers.length) return;
      
      this.injectCSS();
      containers.forEach(c => this.instances.push(new AccordionInstance(c)));
    }
    
    injectCSS() {
      if (document.getElementById('scroll-accordion-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'scroll-accordion-styles';
      style.textContent = `
        ${CFG.item} {
          transition: opacity 0.5s ease;
        }
        
        ${CFG.item}[data-state="closed"] {
          opacity: 0.5;
        }
        
        ${CFG.item}[data-state="open"] {
          opacity: 1;
        }
        
        ${CFG.item}[data-state="closed"] ${CFG.number} {
          color: ${CFG.inactiveColor} !important;
          transition: color 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        ${CFG.item}[data-state="open"] ${CFG.number} {
          transition: color 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        ${CFG.content} {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        ${CFG.item}[data-state="open"] ${CFG.content} {
          grid-template-rows: 1fr;
        }
        
        ${CFG.content} > * {
          overflow: hidden;
        }
      `;
      document.head.appendChild(style);
    }
    
    destroy() {
      this.instances.forEach(i => i.destroy());
    }
  }
  
  class AccordionInstance {
    constructor(container) {
      this.container = container;
      this.deck = container.closest('[data-acc-sticky]');
      this.items = [];
      this.currentIndex = -1;
      this.targetIndex = -1;
      this.isAnimating = false;
      this.scrollTimeout = null;
      this.lastScrollTime = 0;
      this.setup();
    }
    
    setup() {
      this.items = Array.from(this.container.querySelectorAll(CFG.item));
      if (!this.items.length) return;
      
      this.closeAll();
      this.setDeckHeight();
      this.handleScroll();
      
      window.addEventListener('scroll', () => this.throttledScroll(), { passive: true });
      window.addEventListener('resize', () => {
        this.setDeckHeight();
        this.handleScroll();
      });
    }
    
    throttledScroll() {
      const now = Date.now();
      if (now - this.lastScrollTime < CFG.scrollThrottle) return;
      this.lastScrollTime = now;
      this.handleScroll();
    }
    
    setDeckHeight() {
      if (!this.deck) return;
      
      const vh = window.innerHeight;
      const steps = this.items.length;
      const totalHeight = vh * (steps + 1.5);
      
      this.deck.style.height = totalHeight + 'px';
    }
    
    handleScroll() {
      if (!this.deck) {
        this.fallbackScroll();
        return;
      }
      
      const rect = this.deck.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const bottom = top + this.deck.offsetHeight - window.innerHeight;
      const range = Math.max(1, bottom - top);
      const scrollY = window.scrollY;
      
      const progress = Math.min(Math.max(scrollY - top, 0), range);
      const stepHeight = range / this.items.length;
      const rawIndex = progress / stepHeight;
      
      let index = Math.floor(rawIndex);
      const stepProgress = rawIndex - index;
      
      if (stepProgress < CFG.minScrollDistance && index > 0) {
        index = index - 1;
      } else if (stepProgress > (1 - CFG.minScrollDistance) && index < this.items.length - 1) {
        index = index + 1;
      }
      
      index = Math.min(this.items.length - 1, Math.max(0, index));
      
      if (index !== this.targetIndex) {
        this.targetIndex = index;
        this.scheduleActivation(index);
      }
    }
    
    scheduleActivation(index) {
      if (this.isAnimating) return;
      
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        this.setActive(index);
      }, 150);
    }
    
    fallbackScroll() {
      let closestIndex = -1;
      let closestDistance = Infinity;
      
      this.items.forEach((item, idx) => {
        const rect = item.getBoundingClientRect();
        const distance = Math.abs(rect.top - window.innerHeight / 2);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = idx;
        }
      });
      
      if (closestIndex >= 0 && closestIndex !== this.targetIndex) {
        this.targetIndex = closestIndex;
        this.scheduleActivation(closestIndex);
      }
    }
    
    setActive(index) {
      if (index === this.currentIndex) return;
      if (index < 0 || index >= this.items.length) return;
      
      this.isAnimating = true;
      this.currentIndex = index;
      
      this.items.forEach((item, idx) => {
        const isActive = idx === index;
        const num = item.querySelector(CFG.number);
        
        item.setAttribute('data-state', isActive ? 'open' : 'closed');
        
        if (num) {
          if (isActive) {
            num.style.color = '';
          } else {
            num.style.color = CFG.inactiveColor;
          }
        }
      });
      
      setTimeout(() => {
        this.isAnimating = false;
      }, CFG.animDuration);
    }
    
    closeAll() {
      this.items.forEach(item => {
        const num = item.querySelector(CFG.number);
        
        item.setAttribute('data-state', 'closed');
        
        if (num) {
          num.style.color = CFG.inactiveColor;
        }
      });
    }
    
    destroy() {
      clearTimeout(this.scrollTimeout);
    }
  }
  
  const instance = new ScrollAccordion();
  
  window.ScrollAccordion = {
    instance,
    destroy: () => instance.destroy()
  };
  
})();

(function() {
  'use strict';
  
  const CFG = {
    container: '[data-scroll-accordion]',
    item: '[data-acc-step]',
    content: '[data-acc-body]',
    number: '[data-acc-number]',
    inactiveColor: '#D9D6D1',
    deckHeightMultiplier: 1
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
      
      this.fixBodyOverflow();
      this.injectCSS();
      containers.forEach(c => this.instances.push(new AccordionInstance(c)));
    }
    
    fixBodyOverflow() {
      document.body.style.overflow = 'visible';
      const html = document.documentElement;
      if (html) html.style.overflow = 'visible';
    }
    
    injectCSS() {
      if (document.getElementById('scroll-accordion-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'scroll-accordion-styles';
      style.textContent = `
        body, html {
          overflow: visible !important;
        }
        
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
      this.setup();
    }
    
    setup() {
      this.items = Array.from(this.container.querySelectorAll(CFG.item));
      if (!this.items.length) return;
      
      this.closeAll();
      this.setDeckHeight();
      this.handleScroll();
      
      window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
      window.addEventListener('resize', () => {
        this.setDeckHeight();
        this.handleScroll();
      });
    }
    
    setDeckHeight() {
      if (!this.deck) return;
      
      const vh = window.innerHeight;
      const steps = this.items.length;
      const totalHeight = vh * (steps + CFG.deckHeightMultiplier);
      
      this.deck.style.height = totalHeight + 'px';
    }
    
    handleScroll() {
      if (!this.deck) return;
      
      try {
        const rect = this.deck.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        const bottom = top + this.deck.offsetHeight - window.innerHeight;
        const range = Math.max(1, bottom - top);
        const y = window.scrollY;
        
        const progress = Math.min(Math.max(y - top, 0), range);
        const stepHeight = range / this.items.length;
        const index = Math.min(this.items.length - 1, Math.floor(progress / stepHeight));
        
        this.setActive(index);
      } catch (e) {
        console.error('[ScrollAccordion] scroll failed', e);
      }
    }
    
    setActive(index) {
      if (index === this.currentIndex) return;
      if (index < 0 || index >= this.items.length) return;
      
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
      // Passive listeners, no cleanup needed
    }
  }
  
  const instance = new ScrollAccordion();
  
  window.ScrollAccordion = {
    instance,
    config: CFG,
    destroy: () => instance.destroy()
  };
  
})();

(function() {
  'use strict';
  
  const CFG = {
    container: 'data-scroll-accordion',
    item: '[data-acc-step]',
    content: '.accordion-content',
    number: '[data-acc-number]',
    threshold: 0.4,
    animDuration: 400,
    inactiveColor: '#D9D6D1'
  };
  
  class ScrollAccordion {
    constructor() {
      this.containers = [];
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
      this.containers = [...document.querySelectorAll(`[${CFG.container}]`)];
      if (!this.containers.length) return;
      
      this.injectCSS();
      this.containers.forEach(c => this.initContainer(c));
    }
    
    initContainer(container) {
      const instance = new AccordionInstance(container);
      this.instances.push(instance);
    }
    
    injectCSS() {
      const style = document.createElement('style');
      style.textContent = `
        ${CFG.item} {
          transition: opacity 0.3s ease;
          padding: 2rem 0;
        }
        
        ${CFG.item}[data-state="closed"] {
          opacity: 0.6;
        }
        
        ${CFG.item}[data-state="open"] {
          opacity: 1;
        }
        
        ${CFG.item}[data-state="closed"] ${CFG.number} {
          color: ${CFG.inactiveColor} !important;
          transition: color 0.3s ease;
        }
        
        ${CFG.item}[data-state="open"] ${CFG.number} {
          transition: color 0.3s ease;
        }
        
        ${CFG.content} {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transition: max-height ${CFG.animDuration}ms cubic-bezier(0.4, 0, 0.2, 1),
                      opacity ${CFG.animDuration}ms ease;
        }
        
        ${CFG.item}[data-state="open"] ${CFG.content} {
          opacity: 1;
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
      this.items = [];
      this.currentIndex = -1;
      this.isAnimating = false;
      this.observer = null;
      this.setup();
    }
    
    setup() {
      this.items = [...this.container.querySelectorAll(CFG.item)];
      if (!this.items.length) return;
      
      this.closeAll();
      this.setupObserver();
    }
    
    closeAll() {
      this.items.forEach(item => {
        const content = item.querySelector(CFG.content);
        const num = item.querySelector(CFG.number);
        
        if (content) {
          content.style.maxHeight = '0';
          content.style.opacity = '0';
        }
        
        if (num) {
          num.style.color = CFG.inactiveColor;
        }
        
        item.setAttribute('data-state', 'closed');
      });
    }
    
    open(index) {
      if (index < 0 || index >= this.items.length || this.isAnimating) return;
      if (this.currentIndex === index) return;
      
      this.isAnimating = true;
      
      if (this.currentIndex >= 0 && this.currentIndex < this.items.length) {
        this.close(this.currentIndex);
      }
      
      const item = this.items[index];
      const content = item.querySelector(CFG.content);
      const num = item.querySelector(CFG.number);
      
      if (content) {
        item.setAttribute('data-state', 'open');
        
        const inner = content.querySelector('.accordion-inner');
        const height = inner ? inner.scrollHeight : content.scrollHeight;
        
        requestAnimationFrame(() => {
          content.style.maxHeight = height + 'px';
          content.style.opacity = '1';
        });
      }
      
      if (num) {
        num.style.color = '';
      }
      
      this.currentIndex = index;
      
      setTimeout(() => {
        this.isAnimating = false;
      }, CFG.animDuration);
    }
    
    close(index) {
      if (index < 0 || index >= this.items.length) return;
      
      const item = this.items[index];
      const content = item.querySelector(CFG.content);
      const num = item.querySelector(CFG.number);
      
      if (content) {
        content.style.maxHeight = '0';
        content.style.opacity = '0';
      }
      
      if (num) {
        num.style.color = CFG.inactiveColor;
      }
      
      item.setAttribute('data-state', 'closed');
    }
    
    setupObserver() {
      const options = {
        root: null,
        rootMargin: '-30% 0px -30% 0px',
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
      };
      
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= CFG.threshold) {
            const index = this.items.indexOf(entry.target);
            if (index !== -1) {
              this.open(index);
            }
          }
        });
      }, options);
      
      this.items.forEach(item => this.observer.observe(item));
    }
    
    destroy() {
      if (this.observer) {
        this.items.forEach(item => this.observer.unobserve(item));
        this.observer.disconnect();
      }
    }
  }
  
  const instance = new ScrollAccordion();
  
  window.ScrollAccordion = {
    instance,
    config: CFG,
    destroy: () => instance.destroy()
  };
  
})();

(function() {
  'use strict';
  
  const CFG = {
    container: '[data-scroll-accordion]',
    item: '[data-acc-step]',
    content: '[data-acc-body]',
    number: '[data-acc-number]',
    inactiveColor: '#D9D6D1',
    deckHeightMultiplier: 1,
    debug: true
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
      
      if (CFG.debug) {
        console.log('🔍 [ScrollAccordion] Setup:', {
          containers: containers.length,
          foundContainers: Array.from(containers).map(c => c.id || c.className)
        });
      }
      
      if (!containers.length) {
        console.error('❌ [ScrollAccordion] NO containers found with [data-scroll-accordion]!');
        console.log('💡 Add data-scroll-accordion attribute to your <ul id="accordion">');
        return;
      }
      
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
        
        /* STUFE 1: Farbwechsel (sofort, schnell) */
        ${CFG.item} ${CFG.number} {
          transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        ${CFG.item}[data-state="closed"] ${CFG.number} {
          color: ${CFG.inactiveColor} !important;
        }
        
        /* STUFE 2: Content-Bereich öffnen (0.3s delay) */
        ${CFG.content} {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s;
        }
        
        ${CFG.item}[data-state="open"] ${CFG.content} {
          grid-template-rows: 1fr;
        }
        
        /* STUFE 3: Inhalt fade-in (0.5s delay) */
        ${CFG.content} > * {
          overflow: hidden;
          opacity: 0;
          transition: opacity 0.4s ease 0.5s;
        }
        
        ${CFG.item}[data-state="open"] ${CFG.content} > * {
          opacity: 1;
        }
      `;
      document.head.appendChild(style);
      
      if (CFG.debug) console.log('✅ [ScrollAccordion] CSS injected (gestuftes Timing)');
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
      this.scrollCount = 0;
      this.setup();
    }
    
    setup() {
      this.items = Array.from(this.container.querySelectorAll(CFG.item));
      
      if (CFG.debug) {
        console.log('🔍 [AccordionInstance] Setup:', {
          container: this.container.id || this.container.className,
          deck: this.deck ? (this.deck.id || this.deck.className) : 'NOT FOUND',
          items: this.items.length,
          itemsFound: this.items.map((item, i) => {
            const num = item.querySelector(CFG.number);
            const content = item.querySelector(CFG.content);
            return {
              index: i,
              hasNumber: !!num,
              hasContent: !!content,
              numberText: num?.textContent,
              state: item.getAttribute('data-state')
            };
          })
        });
      }
      
      if (!this.items.length) {
        console.error('❌ [AccordionInstance] NO items found with [data-acc-step]!');
        return;
      }
      
      if (!this.deck) {
        console.error('❌ [AccordionInstance] NO deck found with [data-acc-sticky]!');
        console.log('💡 Add data-acc-sticky attribute to parent container (e.g., #deck or .accordion-deck)');
        return;
      }
      
      this.closeAll();
      this.setDeckHeight();
      this.handleScroll();
      
      window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
      window.addEventListener('resize', () => {
        this.setDeckHeight();
        this.handleScroll();
      });
      
      if (CFG.debug) console.log('✅ [AccordionInstance] Initialized');
    }
    
    setDeckHeight() {
      if (!this.deck) return;
      
      const vh = window.innerHeight;
      const steps = this.items.length;
      const totalHeight = vh * (steps + CFG.deckHeightMultiplier);
      
      this.deck.style.height = totalHeight + 'px';
      
      if (CFG.debug) {
        console.log('📏 [Deck Height]:', {
          vh,
          steps,
          multiplier: CFG.deckHeightMultiplier,
          totalHeight: totalHeight + 'px',
          deckElement: this.deck.id || this.deck.className
        });
      }
    }
    
    handleScroll() {
      if (!this.deck) return;
      
      this.scrollCount++;
      
      try {
        const rect = this.deck.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        const bottom = top + this.deck.offsetHeight - window.innerHeight;
        const range = Math.max(1, bottom - top);
        const y = window.scrollY;
        
        const progress = Math.min(Math.max(y - top, 0), range);
        const stepHeight = range / this.items.length;
        const index = Math.min(this.items.length - 1, Math.floor(progress / stepHeight));
        
        if (CFG.debug && this.scrollCount % 30 === 0) {
          console.log('📜 [Scroll]:', {
            scrollY: y,
            deckTop: top,
            deckBottom: bottom,
            range,
            progress,
            stepHeight,
            calculatedIndex: index,
            currentIndex: this.currentIndex
          });
        }
        
        this.setActive(index);
      } catch (e) {
        console.error('❌ [ScrollAccordion] scroll failed', e);
      }
    }
    
    setActive(index) {
      if (index === this.currentIndex) return;
      if (index < 0 || index >= this.items.length) return;
      
      const wasIndex = this.currentIndex;
      this.currentIndex = index;
      
      if (CFG.debug) {
        console.log('🎯 [Activate]:', {
          from: wasIndex,
          to: index,
          item: this.items[index]
        });
      }
      
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
      
      if (CFG.debug) console.log('🔒 [CloseAll] All items closed');
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
  
  if (CFG.debug) {
    console.log('✅ [ScrollAccordion v2.0] Ready with staged animation timing!');
    console.log('🎬 Animation Flow: Color (0ms) → Expand (+300ms) → Content (+500ms)');
  }
  
})();


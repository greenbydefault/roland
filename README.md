# Roland Lodr - Interactive Scripts

Optimierte JavaScript-Komponenten für Roland Lodr's Webflow-Website.

## 📦 Scripts

### 1. 3D Cube (`cube-v1.4.js`)
Interaktiver 3D-Würfel mit Three.js für die Hero-Section.

**Features:**
- Drag-to-rotate (horizontal)
- Click-Navigation zu Listings
- Responsive Sizing (4:3 Ratio)
- Canvas-Texturen aus HTML-Elementen
- Dynamische Items mit Nummern (beliebig viele)
- **Echte Infinity-Rotation** (auch mit 1-2 Items: 1-2-1-2-1-2...)
- **Automatisches `/listings/` Prefix** für Links
- **KEINE Schattierung** (MeshBasicMaterial statt Lambert)
- 3D-Rahmen mit Zylinder-Geometrie

**Usage in Webflow:**
```html
<!-- In Webflow: Page Settings > Custom Code > Before </body> -->
<div class="cube-container">
  <div class="cube-texture-sources">
    <!-- Nur Slug angeben, /listings/ wird automatisch hinzugefügt -->
    <div data-cube-item="1" class="cube-texture-content" data-link="your-slug-1">
      <img src="..." data-cube-image="true" />
    </div>
    <div data-cube-item="2" class="cube-texture-content" data-link="your-slug-2">
      <img src="..." data-cube-image="true" />
    </div>
    <!-- Optional: Weitere Items -->
    <div data-cube-item="3" class="cube-texture-content" data-link="your-slug-3">
      <img src="..." data-cube-image="true" />
    </div>
  </div>
  <canvas data-cube-canvas="true"></canvas>
</div>

<!-- Script einbinden -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="cube-v1.4.js"></script>
```

**Performance:**
- ~400 Zeilen (kompakt)
- Parallel Texture Loading
- PixelRatio auf 2 limitiert
- Optimierte Render-Loop

---

### 2. OpenUp Accordion (`openup.js`)
Horizontales Accordion-System für Collection Lists.

**Features:**
- Erste Box automatisch geöffnet
- Smooth Width-Transitions
- Text-Fade mit Delays
- Keyboard-Navigation (Pfeiltasten, Enter, Space)
- Custom Cursor-Follower (Desktop)
- Responsive & Touch-optimiert

**Usage in Webflow:**
```html
<!-- Collection List Structure -->
<div class="grid-list">
  <div class="openup__item">
    <div class="openup__panel">
      <!-- Click-Area -->
    </div>
    <div class="openup__text">
      <!-- Hidden Content -->
    </div>
  </div>
  <!-- Weitere Items... -->
</div>

<!-- Optional: Cursor-Follower Button -->
<div class="openup__wrapper">
  <div class="button-open-up" data-open-up-button>OPEN</div>
</div>

<!-- Script einbinden -->
<script src="openup.js"></script>
```

**Config anpassen:**
```javascript
// Im Script oben:
const CFG = {
  activeWidth: '50em',    // Breite des aktiven Items
  duration: 600,          // Animation Duration
  textDelayIn: 300,       // Text-Fade Delay
  // ...
};
```

**Performance:**
- ~240 Zeilen (49% kleiner als Original)
- Throttled Mousemove (60fps)
- RequestAnimationFrame für Cursor
- Minimale DOM-Queries

---

### 3. Cursor Follower (`cursor-follower.js`)
Custom Cursor-Effekt mit Smooth-Follow.

**Features:**
- Smooth Lerp-Animation
- Touch-Device Detection
- Auto-Hide bei Mouse-Leave
- Throttled Performance

**Usage in Webflow:**
```html
<!-- Element mit Cursor-Effekt -->
<div data-cursor-follower>
  <!-- Content -->
  <div class="custom-cursor">👆</div>
</div>

<!-- Script einbinden -->
<script src="cursor-follower.js"></script>
```

---

## 🚀 Installation

### Option 1: Direkt in Webflow
```html
<!-- Page Settings > Custom Code > Before </body> -->
<script>
  // Script-Inhalt hier einfügen
</script>
```

### Option 2: Externes Hosting (CDN)
```html
<!-- Three.js für Cube -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

<!-- Deine Scripts -->
<script src="https://your-cdn.com/3d-cube.js" defer></script>
<script src="https://your-cdn.com/openup.js" defer></script>
```

### Option 3: Conditional Loading
```html
<!-- Nur laden wenn Element vorhanden -->
<script>
  if (document.querySelector('[data-cube-canvas]')) {
    // Cube Script laden
  }
  if (document.querySelector('.grid-list')) {
    // OpenUp Script laden
  }
</script>
```

---

## ⚡ Performance-Tipps

1. **Lazy Loading**: Nur Scripts laden die gebraucht werden
2. **Defer/Async**: `<script defer>` für Non-Critical Scripts
3. **Minification**: Scripts vor Production minifizieren
4. **CDN**: Three.js von CDN statt selbst hosten
5. **Image Optimization**: Cube-Texturen als WebP/AVIF

---

## 🛠️ Development

### Struktur
```
Scripte/
├── 3d-cube.html          # Complete HTML + Script
├── openup.js             # Standalone JS
├── cursor-follower.js    # Standalone JS
└── README.md             # Diese Datei
```

### Testing
```bash
# Local Server starten
python -m http.server 8000

# Browser öffnen
open http://localhost:8000/3d-cube.html
```

### Minification
```bash
# Mit Terser (empfohlen)
npm install -g terser
terser openup.js -c -m -o openup.min.js

# Oder online: https://terser.org/
```

---

## 📊 Performance-Metriken

| Script | Zeilen | Minified | Gzipped | Load Time* |
|--------|--------|----------|---------|------------|
| 3D Cube | 400 | ~15KB | ~5KB | ~50ms |
| OpenUp | 240 | ~8KB | ~3KB | ~30ms |
| Cursor | 150 | ~5KB | ~2KB | ~20ms |

*3G Connection, nach Initial Load

---

## 🔧 Browser-Support

- **Chrome/Edge**: ✅ Vollständig
- **Firefox**: ✅ Vollständig
- **Safari**: ✅ Vollständig (Desktop + iOS)
- **Opera**: ✅ Vollständig

**Minimum Versions:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 📝 Changelog

### v1.4.0 (2025-10-07)
- 🔥 **3D Cube: 4-Seiten-Fix** (front, right, back, left - alle mit Texturen gefüllt)
- 🔥 **3D Cube: Korrekte Item-Verteilung** bei 2 Items: Item1→Item2→Item1→Item2 (abwechselnd)
- 🐛 **3D Cube: Fix leere/dunkle Seite** (back-Seite wird jetzt auch mit Texture gefüllt)
- 🐛 **3D Cube: Fix falsche Links** (Click-Logik jetzt korrekt für 4 Seiten)

### v1.3.0 (2025-10-07)
- 🔥 **3D Cube: Echte Infinity-Rotation** (auch mit 2 Items: 1-2-1-2-1-2... ohne leere Seiten)
- ✨ **3D Cube: Auto `/listings/` Prefix** (automatisch vor data-link hinzugefügt)
- 🐛 **3D Cube: Fix leere Seite** bei weniger als 3 Items

### v1.2.0 (2025-10-07)
- 🔥 **3D Cube: Schattierung entfernt** (MeshBasicMaterial → keine Verdunkelung bei Rotation)
- 🔥 **3D Cube: Click-Event Fix** (funktioniert jetzt auf allen Seiten)
- ✨ **3D Cube: Dynamische Item-Struktur** (data-cube-item="1,2,3..." statt front/right/left)
- ✨ **3D Cube: Infinity-Rotation** (Items wiederholen sich endlos)
- ✨ **3D Cube: Beliebig viele Items** (nicht mehr auf 3 beschränkt)

### v2.0.0 (2025-09-30)
- ✨ 3D Cube: Container-basierte Größenberechnung (Fix: Initial Sizing)
- ✨ 3D Cube: Rotation umgedreht (-0.6 statt 0.6)
- ✨ 3D Cube: Automatisches `/listings/` Prefix
- ✨ 3D Cube: Echte 3D-Rahmen (Zylinder statt Lines)
- ⚡ OpenUp: 49% Code-Reduktion (466→240 Zeilen)
- ⚡ OpenUp: Performance-Optimierungen (Spread, Inline-Events)
- 🎨 Body: `overflow: hidden` für Scrollbar-Fix

### v1.0.0 (Initial)
- 🎉 Erste Version aller 3 Scripts

---

## 📄 License

Proprietary - © 2025 Roland Lodr / Green by Default

---

## 🤝 Support

Bei Fragen oder Problemen:
- **Email**: [deine-email]
- **Webflow**: [projekt-link]

---

## 🎯 Roadmap

- [ ] Module-Version (ES6 Imports)
- [ ] TypeScript Definitions
- [ ] Webflow Component Library
- [ ] A11y Audit & Improvements
- [ ] Unit Tests

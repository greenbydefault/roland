// Smart Script Loader - Optimal Performance
(function() {
  'use strict';
  
  const SCRIPTS = {
    three: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    cube: 'https://cdn.jsdelivr.net/gh/greenbydefault/roland@main/3d-cube.js',
    openup: 'https://cdn.jsdelivr.net/gh/greenbydefault/roland@main/openup.js',
    cursor: 'https://cdn.jsdelivr.net/gh/greenbydefault/roland@main/cursor-follower.js'
  };
  
  function loadScript(url, blocking = false) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      if (!blocking) script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }
  
  // 3D Cube (kritisch, blocking)
  if (document.querySelector('[data-cube-canvas]')) {
    loadScript(SCRIPTS.three, true).then(() => {
      loadScript(SCRIPTS.cube, true);
    });
  }
  
  // OpenUp (defer)
  if (document.querySelector('.grid-list')) {
    loadScript(SCRIPTS.openup);
  }
  
  // Cursor Follower (defer)
  if (document.querySelector('[data-cursor-area]')) {
    loadScript(SCRIPTS.cursor);
  }
  
})();

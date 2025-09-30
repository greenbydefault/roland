class Cube3D {
    constructor() {
        this.baseWidth = 4.5;
        this.baseHeight = 3.375;
        this.baseDepth = 4.5;
        this.targetRotation = { y: -0.6 };
        this.currentRotation = { y: -0.6 };
        this.isDragging = false;
        this.lastMouse = { x: 0, y: 0 };
        this.dragThreshold = 5;
        this.hasDragged = false;
        this.clickStartTime = 0;
        this.basePitch = 0;
        this.init();
    }

    init() {
        this.setupScene();
        this.createCube();
        this.setupEvents();
        this.animate();
        const el = document.getElementById('cube-loading');
        if (el) el.style.display = 'none';
        this.updateResponsiveSize();
    }

    setupScene() {
        const canvas = document.querySelector('[data-cube-canvas="true"]');
        if (!canvas) return console.error('Canvas not found');
        const container = document.querySelector('.cube-container');
        const rect = (container || canvas).getBoundingClientRect();
        
        this.scene = new THREE.Scene();
        this.scene.background = null;
        this.camera = new THREE.PerspectiveCamera(40, rect.width / rect.height, 0.1, 2000);
        this.camera.position.set(0, 0, 6);
        this.camera.lookAt(0, 0, 0);
        
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        this.renderer.setSize(rect.width, rect.height);
        this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0x000000, 0);
    }

    createCube() {
        const geometry = new THREE.BoxGeometry(this.baseWidth, this.baseHeight, this.baseDepth);
        const tempMat = new THREE.MeshLambertMaterial({ color: 0x332B26 });
        this.cube = new THREE.Mesh(geometry, Array(6).fill(tempMat));
        this.cube.castShadow = this.cube.receiveShadow = true;
        this.cube.rotation.x = this.basePitch;
        this.scene.add(this.cube);
        
        this.addEdges();
        
        this.createTextures().then(() => {
            this.setupLighting();
            this.updateResponsiveSize();
        });
    }

    addEdges() {
        const w = this.baseWidth;
        const h = this.baseHeight;
        const d = this.baseDepth;
        const r = 0.01;
        const edgeMat = new THREE.MeshBasicMaterial({ color: 0x272727 });
        
        const edges = [
            [[w/2, h/2, d/2], [w/2, h/2, -d/2], w],
            [[w/2, h/2, -d/2], [w/2, -h/2, -d/2], h],
            [[w/2, -h/2, -d/2], [w/2, -h/2, d/2], w],
            [[w/2, -h/2, d/2], [w/2, h/2, d/2], h],
            [[-w/2, h/2, d/2], [-w/2, h/2, -d/2], w],
            [[-w/2, h/2, -d/2], [-w/2, -h/2, -d/2], h],
            [[-w/2, -h/2, -d/2], [-w/2, -h/2, d/2], w],
            [[-w/2, -h/2, d/2], [-w/2, h/2, d/2], h],
            [[w/2, h/2, d/2], [-w/2, h/2, d/2], d],
            [[w/2, h/2, -d/2], [-w/2, h/2, -d/2], d],
            [[w/2, -h/2, d/2], [-w/2, -h/2, d/2], d],
            [[w/2, -h/2, -d/2], [-w/2, -h/2, -d/2], d]
        ];
        
        edges.forEach(([start, end, len]) => {
            const geom = new THREE.CylinderGeometry(r, r, len, 8);
            const edge = new THREE.Mesh(geom, edgeMat);
            edge.position.set((start[0] + end[0])/2, (start[1] + end[1])/2, (start[2] + end[2])/2);
            if (start[0] !== end[0]) edge.rotation.z = Math.PI / 2;
            if (start[2] !== end[2]) edge.rotation.x = Math.PI / 2;
            this.cube.add(edge);
        });
    }

    async createTextures() {
        const [front, right, left] = await Promise.all([
            this.htmlToTexture('front'),
            this.htmlToTexture('right'),
            this.htmlToTexture('left')
        ]);
        
        const solidMat = { color: 0x332B26, transparent: true, opacity: 0.9 };
        this.cube.material = [
            new THREE.MeshLambertMaterial({ map: right, transparent: true }),
            new THREE.MeshLambertMaterial({ map: left, transparent: true }),
            new THREE.MeshLambertMaterial(solidMat),
            new THREE.MeshLambertMaterial(solidMat),
            new THREE.MeshLambertMaterial({ map: front, transparent: true }),
            new THREE.MeshLambertMaterial(solidMat)
        ];
    }

    setupLighting() {
        this.scene.add(new THREE.AmbientLight(0x404040, 0.6));
        const light = new THREE.DirectionalLight(0xffffff, 0.8);
        light.position.set(5, 5, 5);
        light.castShadow = true;
        light.shadow.mapSize.width = light.shadow.mapSize.height = 2048;
        this.scene.add(light);
    }

    setupEvents() {
        const canvas = document.querySelector('[data-cube-canvas="true"]');
        const start = (e) => {
            this.isDragging = true;
            this.hasDragged = false;
            this.clickStartTime = Date.now();
            const p = e.touches ? e.touches[0] : e;
            this.lastMouse = { x: p.clientX, y: p.clientY };
        };
        const move = (e) => {
            if (!this.isDragging) return;
            e.preventDefault?.();
            const p = e.touches ? e.touches[0] : e;
            const dx = p.clientX - this.lastMouse.x;
            const dy = p.clientY - this.lastMouse.y;
            if (Math.sqrt(dx * dx + dy * dy) > this.dragThreshold) this.hasDragged = true;
            this.targetRotation.y += dx * 0.01;
            this.lastMouse = { x: p.clientX, y: p.clientY };
        };
        const end = (e) => {
            this.isDragging = false;
            if (!this.hasDragged && Date.now() - this.clickStartTime < 300) this.onClick(e);
        };
        
        canvas.addEventListener('mousedown', start);
        canvas.addEventListener('mousemove', move);
        canvas.addEventListener('mouseup', end);
        canvas.addEventListener('mouseleave', end);
        canvas.addEventListener('touchstart', start);
        canvas.addEventListener('touchmove', move);
        canvas.addEventListener('touchend', end);
        window.addEventListener('resize', () => this.onResize());
    }

    onClick(e) {
        const norm = ((this.currentRotation.y % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
        let side = 'front';
        if (norm > Math.PI * 0.25 && norm < Math.PI * 0.75) side = 'right';
        else if (norm > Math.PI * 0.75 && norm < Math.PI * 1.25) side = 'back';
        else if (norm > Math.PI * 1.25 && norm < Math.PI * 1.75) side = 'left';
        
        const slug = document.querySelector(`[data-side="${side}"]`)?.getAttribute('data-link');
        if (slug) window.location.href = '/listings/' + slug;
    }

    onResize() {
        const container = document.querySelector('.cube-container');
        const rect = container.getBoundingClientRect();
        this.camera.aspect = rect.width / rect.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(rect.width, rect.height);
        this.updateResponsiveSize();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.1;
        if (this.cube) {
            this.cube.rotation.x = this.basePitch;
            this.cube.rotation.y = this.currentRotation.y;
        }
        this.renderer.render(this.scene, this.camera);
    }

    updateResponsiveSize() {
        if (!this.renderer || !this.cube) return;
        const container = document.querySelector('.cube-container');
        const cw = container?.clientWidth || window.innerWidth;
        const ch = container?.clientHeight || window.innerHeight;
        const ratio = this.baseHeight / this.baseWidth;
        const maxW = cw * 0.9;
        const maxH = ch * 0.9;
        let w = Math.min(maxW, maxH / ratio);
        const safety = Math.sqrt(this.baseWidth ** 2 + this.baseDepth ** 2) / this.baseWidth;
        w /= safety;
        const h = w * ratio;
        
        const canvas = this.renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        const viewH = Math.max(1, rect.height);
        const objH = this.cube.geometry.parameters.height || 1;
        const fovRad = this.camera.fov * Math.PI / 180;
        const z = (viewH * objH) / (2 * h * Math.tan(fovRad / 2));
        this.camera.position.z = z + this.baseDepth / 2 + 0.01;
        this.camera.aspect = rect.width / rect.height;
        this.camera.updateProjectionMatrix();
    }

    htmlToTexture(side) {
        const el = document.querySelector(`[data-side="${side}"]`);
        if (!el) return Promise.resolve(null);
        
        const origStyle = el.style.cssText;
        el.style.cssText = 'position:absolute;top:0;left:0;visibility:visible;pointer-events:none;z-index:9999';
        
        return new Promise((resolve) => {
            const imgs = el.querySelectorAll('img');
            if (imgs.length === 0) {
                this.renderTexture(el, origStyle, resolve);
                return;
            }
            
            let loaded = 0;
            const check = () => {
                if (++loaded === imgs.length) this.renderTexture(el, origStyle, resolve);
            };
            imgs.forEach(img => {
                if (img.complete && img.naturalWidth > 0) check();
                else {
                    img.onload = check;
                    img.onerror = check;
                }
            });
        });
    }

    async renderTexture(el, origStyle, resolve) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1024;
        canvas.height = 768;
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const imgs = el.querySelectorAll('img[data-cube-image="true"]');
        for (const img of imgs) {
            if (img.complete && img.naturalWidth > 0) {
                try {
                    const corsImg = new Image();
                    corsImg.crossOrigin = 'anonymous';
                    await new Promise((res, rej) => {
                        corsImg.onload = () => {
                            try {
                                const cAsp = canvas.width / canvas.height;
                                const iAsp = corsImg.naturalWidth / corsImg.naturalHeight;
                                let dw, dh, x, y;
                                if (iAsp > cAsp) {
                                    dh = canvas.height;
                                    dw = dh * iAsp;
                                    x = (canvas.width - dw) / 2;
                                    y = 0;
                                } else {
                                    dw = canvas.width;
                                    dh = dw / iAsp;
                                    x = 0;
                                    y = (canvas.height - dh) / 2;
                                }
                                ctx.drawImage(corsImg, x, y, dw, dh);
                                res();
                            } catch (e) { rej(e); }
                        };
                        corsImg.onerror = rej;
                        corsImg.src = img.src;
                    });
                } catch (e) {
                    ctx.fillStyle = '#333';
                    ctx.font = '24px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('Image Error', canvas.width / 2, canvas.height / 2);
                }
            }
        }
        
        const texts = el.querySelectorAll('h1, h2, h3, p');
        let ty = 50;
        texts.forEach(t => {
            if (t.textContent.trim()) {
                ctx.fillStyle = '#333';
                ctx.font = '24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(t.textContent, canvas.width / 2, ty);
                ty += 40;
            }
        });
        
        el.style.cssText = origStyle;
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        resolve(texture);
    }
}

window.addEventListener('load', () => {
    let attempts = 0;
    const check = () => {
        const allImgs = document.querySelectorAll('img[data-cube-image="true"]');
        const loaded = Array.from(allImgs).filter(img => img.complete && img.naturalWidth > 0);
        if ((loaded.length === allImgs.length && allImgs.length > 0) || attempts++ >= 50) {
            new Cube3D();
        } else {
            setTimeout(check, 200);
        }
    };
    setTimeout(check, 500);
});

/**
 * Starrysky.js v1.0.2
 * 
 * Sistema de Céu Estrelado Dinâmico com Meteoros
 * Copyright (c) 2026 StarTX
 * 
 * @license MIT
 * @author StarTX
 * @version 1.0.2
 */

class Starrysky {
    constructor(instanceId = null) {
        this.DEFAULT_CONFIG = {
            container: null,
            starCount: null,
            starDensity: 0.001,
            starColors: [
                { r: 255, g: 255, b: 255 },
                { r: 255, g: 245, b: 235 },
                { r: 255, g: 235, b: 210 },
                { r: 210, g: 230, b: 255 },
                { r: 190, g: 210, b: 255 },
                { r: 255, g: 220, b: 200 },
                { r: 200, g: 210, b: 255 }
            ],
            starMinSize: 0.2,
            starMaxSize: 1.7,
            starTwinkleSpeed: 0.004,
            rotationSpeed: 0.0003,
            enableMeteors: true,
            maxMeteorsAtOnce: 5,
            firstMeteorDelay: 1000,
            meteorMinDelay: 10000,
            meteorMaxDelay: 25000,
            meteorBurstChance: 0.01,
            meteorBurstDelayMin: 20000,
            meteorBurstDelayMax: 50000,
            meteorSpeed: 3,
            meteorSizeMin: 1.2,
            meteorSizeMax: 3.2,
            meteorTailLength: 60,
            meteorLifeReduction: 0.007,
            fadeDuration: 0,
            starsFadeDelay: 0,
            meteorsFadeDelay: 0,
            fadeEasing: 'smooth',
            canvasId: null,
            canvasZIndex: -2,
            canvasPosition: null,
            autoPauseOnTabChange: true,
            autoResumeOnTabReturn: true,
            preserveTimeOnPause: true,
            debug: false,
            onStart: null,
            onStop: null,
            onPause: null,
            onResume: null,
            onMeteor: null,
            onMeteorEnd: null,
            onMeteorBurst: null,
            onStarCreated: null,
            onResize: null
        };
        
        this.config = { ...this.DEFAULT_CONFIG };
        this.canvas = null;
        this.ctx = null;
        this.container = null;
        this.width = 0;
        this.height = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.stars = [];
        this.meteors = [];
        this.rotation = 0;
        this.starOpacity = 0;
        this.meteorOpacity = 0;
        this.animationStartTime = 0;
        this.animationId = null;
        this._isRunning = false;
        this._isPaused = false;
        this.meteorTimeouts = [];
        this.nextMeteorTimeout = null;
        this.nextBurstTimeout = null;
        this.resizeTimeout = null;
        this.pauseStartTime = 0;
        this.totalPausedTime = 0;
        this.visibilityListenerAttached = false;
        this._visibilityHandler = null;
        this._resizeHandler = null;
        this.instanceId = instanceId || `starrysky-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        this.log = (...args) => {
            if (this.config.debug) {
                console.log(`[Starrysky ${this.instanceId}]`, ...args);
            }
        };
    }
    
    easeOutCubic(x) {
        return 1 - Math.pow(1 - x, 3);
    }
    
    easeInCubic(x) {
        return x * x * x;
    }
    
    easeInOutCubic(x) {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }
    
    applyEasing(progress, type) {
        switch (type) {
            case 'linear': return progress;
            case 'ease-in': return this.easeInCubic(progress);
            case 'ease-out': return this.easeOutCubic(progress);
            default: return this.easeInOutCubic(progress);
        }
    }
    
    getRandomStarColor() {
        const color = this.config.starColors[Math.floor(Math.random() * this.config.starColors.length)];
        return 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')';
    }
    
    initSky() {
        if (!this.canvas) return;
        
        if (this.container && this.container !== document.body) {
            this.width = this.canvas.width = this.container.clientWidth;
            this.height = this.canvas.height = this.container.clientHeight;
        } else {
            this.width = this.canvas.width = window.innerWidth;
            this.height = this.canvas.height = window.innerHeight;
        }
        
        this.offsetX = this.width + 100;
        this.offsetY = this.height + 100;
        
        let starCount = this.config.starCount;
        if (!starCount) {
            const area = this.width * this.height;
            const density = this.width < 768 ? 0.002 : this.config.starDensity;
            starCount = Math.floor(area * density);
        }
        
        const diagonal = Math.sqrt((this.width + 100) * (this.width + 100) + (this.height + 100) * (this.height + 100));
        
        this.stars = [];
        for (let i = 0; i < starCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            
            const star = {
                radius: Math.sqrt(Math.random()) * diagonal,
                angle: angle,
                cos: Math.cos(angle),
                sin: Math.sin(angle),
                size: this.config.starMinSize + Math.random() * (this.config.starMaxSize - this.config.starMinSize),
                twinklePhase: Math.random() * Math.PI * 2,
                twinkleSpeed: this.config.starTwinkleSpeed * (0.5 + Math.random() / (this.config.starMinSize + Math.random() * (this.config.starMaxSize - this.config.starMinSize))),
                color: this.getRandomStarColor()
            };
            this.stars.push(star);
            
            if (this.config.onStarCreated) {
                this.config.onStarCreated(star, i);
            }
        }
        
        this.log(`${this.stars.length} estrelas criadas`);
    }
    
    clearMeteorTimeouts() {
        if (this.nextMeteorTimeout) {
            clearTimeout(this.nextMeteorTimeout);
            this.nextMeteorTimeout = null;
        }
        if (this.nextBurstTimeout) {
            clearTimeout(this.nextBurstTimeout);
            this.nextBurstTimeout = null;
        }
        this.meteorTimeouts.forEach(timeout => { 
            if (timeout) clearTimeout(timeout); 
        });
        this.meteorTimeouts = [];
    }
    
    createMeteor() {
        const angle = Math.random() * Math.PI / 6 + Math.PI / 6;
        const meteor = {
            x: Math.random() * this.width * 0.6 + 0.2 * this.width,
            y: Math.random() * this.height * 0.4,
            vx: this.config.meteorSpeed * -Math.cos(angle),
            vy: this.config.meteorSpeed * Math.sin(angle),
            life: 1,
            tail: [],
            size: this.config.meteorSizeMin + Math.random() * (this.config.meteorSizeMax - this.config.meteorSizeMin)
        };
        
        if (this.config.onMeteor) {
            this.config.onMeteor(meteor);
        }
        
        return meteor;
    }
    
    startMeteorShower() {
        if (!this.config.enableMeteors || !this._isRunning || this._isPaused) return;
        
        const generateMeteor = () => {
            if (!this._isRunning || this._isPaused) return;
            if (this.meteors.length < this.config.maxMeteorsAtOnce) {
                this.meteors.push(this.createMeteor());
            }
            if (this._isRunning && !this._isPaused) {
                this.nextMeteorTimeout = setTimeout(generateMeteor, 
                    this.config.meteorMinDelay + Math.random() * (this.config.meteorMaxDelay - this.config.meteorMinDelay));
                this.meteorTimeouts.push(this.nextMeteorTimeout);
            }
        };
        
        const generateMeteorBurst = () => {
            if (!this._isRunning || this._isPaused) return;
            if (Math.random() < this.config.meteorBurstChance) {
                const burstCount = 2 + Math.floor(3 * Math.random());
                const burstMeteors = [];
                for (let i = 0; i < burstCount && this.meteors.length < this.config.maxMeteorsAtOnce + 2; i++) {
                    const meteor = this.createMeteor();
                    this.meteors.push(meteor);
                    burstMeteors.push(meteor);
                }
                
                if (this.config.onMeteorBurst && burstMeteors.length > 0) {
                    this.config.onMeteorBurst(burstMeteors);
                }
            }
            if (this._isRunning && !this._isPaused) {
                this.nextBurstTimeout = setTimeout(generateMeteorBurst, 
                    this.config.meteorBurstDelayMin + Math.random() * (this.config.meteorBurstDelayMax - this.config.meteorBurstDelayMin));
                this.meteorTimeouts.push(this.nextBurstTimeout);
            }
        };
        
        this.clearMeteorTimeouts();
        
        const firstDelay = (this.config.firstMeteorDelay !== undefined) ? this.config.firstMeteorDelay : 1000;
        const burstDelay = this.config.meteorBurstDelayMin + Math.random() * (this.config.meteorBurstDelayMax - this.config.meteorBurstDelayMin);
        
        this.nextMeteorTimeout = setTimeout(generateMeteor, firstDelay);
        this.nextBurstTimeout = setTimeout(generateMeteorBurst, burstDelay);
        
        this.meteorTimeouts.push(this.nextMeteorTimeout, this.nextBurstTimeout);
        
        this.log('Sistema de meteoros iniciado');
    }
    
    updateOpacity() {
        if (this.config.fadeDuration === 0) {
            this.starOpacity = 1;
            this.meteorOpacity = 1;
            return;
        }
        
        // Calcula o tempo decorrido desde o início
        const now = Date.now();
        const elapsed = now - this.animationStartTime;
        
        // Aplica a pausa se necessário
        const currentTime = this.config.preserveTimeOnPause ? 
            Math.max(0, elapsed - this.totalPausedTime) : 
            elapsed;
        
        // Calcula opacidade das estrelas
        let starsProgress = 0;
        if (currentTime >= this.config.starsFadeDelay) {
            starsProgress = Math.min((currentTime - this.config.starsFadeDelay) / this.config.fadeDuration, 1);
            starsProgress = this.applyEasing(starsProgress, this.config.fadeEasing);
        }
        this.starOpacity = starsProgress;
        
        // Calcula opacidade dos meteoros
        let meteorsProgress = 0;
        if (currentTime >= this.config.meteorsFadeDelay) {
            meteorsProgress = Math.min((currentTime - this.config.meteorsFadeDelay) / this.config.fadeDuration, 1);
            meteorsProgress = this.applyEasing(meteorsProgress, this.config.fadeEasing);
        }
        this.meteorOpacity = meteorsProgress;
        
        if (this.config.debug && Math.random() < 0.05) { // Log apenas 5% das vezes para não poluir
            this.log(`Opacity - Stars: ${this.starOpacity.toFixed(3)}, Meteors: ${this.meteorOpacity.toFixed(3)}, Time: ${currentTime.toFixed(0)}ms`);
        }
    }
    
    update() {
        this.rotation += this.config.rotationSpeed;
        
        if (this.config.enableMeteors) {
            for (let i = this.meteors.length - 1; i >= 0; i--) {
                const meteor = this.meteors[i];
                meteor.x += meteor.vx;
                meteor.y += meteor.vy;
                meteor.tail.unshift({ x: meteor.x, y: meteor.y });
                
                if (meteor.tail.length > this.config.meteorTailLength) {
                    meteor.tail.pop();
                }
                
                meteor.life -= this.config.meteorLifeReduction;
                
                if (meteor.life <= 0 || meteor.x < -100 || meteor.y > this.height + 100) {
                    if (this.config.onMeteorEnd) {
                        this.config.onMeteorEnd(meteor);
                    }
                    this.meteors.splice(i, 1);
                }
            }
        }
        
        this.updateOpacity();
    }
    
    render() {
        if (!this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Se ambos estão invisíveis, não renderiza nada
        if (this.starOpacity <= 0 && this.meteorOpacity <= 0) return;
        
        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.rotate(this.rotation);
        
        // Desenha as estrelas
        if (this.starOpacity > 0) {
            for (let i = 0; i < this.stars.length; i++) {
                const star = this.stars[i];
                const x = star.cos * star.radius;
                const y = star.sin * star.radius;
                const time = performance.now() * star.twinkleSpeed + star.twinklePhase;
                const twinkle = 0.5 + 0.5 * Math.abs(Math.sin(time) * Math.cos(0.7 * time));
                
                // Brilho base da estrela entre 0.4 e 1.0, multiplicado pela opacidade do fade
                const brightness = 0.4 + (0.6 * twinkle);
                const finalOpacity = this.starOpacity * brightness;
                
                this.ctx.beginPath();
                this.ctx.arc(x, y, star.size * (0.5 + 0.5 * twinkle), 0, 2 * Math.PI);
                this.ctx.fillStyle = star.color;
                this.ctx.globalAlpha = Math.min(finalOpacity, 1);
                this.ctx.fill();
            }
        }
        
        this.ctx.restore();
        
        // Desenha os meteoros
        if (this.config.enableMeteors && this.meteorOpacity > 0) {
            for (let i = this.meteors.length - 1; i >= 0; i--) {
                const meteor = this.meteors[i];
                
                // Opacidade combinada fade * vida do meteoro
                const meteorBaseOpacity = this.meteorOpacity * meteor.life;
                
                if (meteorBaseOpacity <= 0) continue;
                
                // Desenha a cauda
                for (let j = 0; j < meteor.tail.length - 1; j++) {
                    const p1 = meteor.tail[j];
                    const p2 = meteor.tail[j + 1];
                    const tailOpacity = meteorBaseOpacity * (1 - j / meteor.tail.length) * 0.8;
                    const tailWidth = 0.5 * meteor.size * (1 - j / meteor.tail.length);
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = `rgba(200, 200, 255, ${tailOpacity})`;
                    this.ctx.lineWidth = tailWidth;
                    this.ctx.stroke();
                }
                
                // Desenha a cabeça do meteoro
                const gradient = this.ctx.createRadialGradient(meteor.x, meteor.y, 0, meteor.x, meteor.y, 1.5 * meteor.size);
                gradient.addColorStop(0, `rgba(255, 255, 255, ${meteorBaseOpacity})`);
                gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
                
                this.ctx.beginPath();
                this.ctx.arc(meteor.x, meteor.y, meteor.size, 0, 2 * Math.PI);
                this.ctx.fillStyle = gradient;
                this.ctx.globalAlpha = 1;
                this.ctx.fill();
            }
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    animateSky() {
        if (!this._isRunning || this._isPaused) return;
        
        this.update();
        this.render();
        
        this.animationId = requestAnimationFrame(() => this.animateSky());
    }
    
    _pauseInternal() {
        if (!this._isRunning || this._isPaused) return;
        
        this.log('Pausando animação');
        this._isPaused = true;
        this.pauseStartTime = Date.now();
        
        if (this.config.onPause) {
            this.config.onPause();
        }
        
        this.clearMeteorTimeouts();
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    _resumeInternal() {
        if (!this._isRunning || !this._isPaused) return;
        
        this.log('Retomando animação');
        
        if (this.config.preserveTimeOnPause) {
            this.totalPausedTime += Date.now() - this.pauseStartTime;
        } else {
            this.animationStartTime = Date.now();
            this.totalPausedTime = 0;
        }
        
        this._isPaused = false;
        
        if (this.config.onResume) {
            this.config.onResume();
        }
        
        this.animateSky();
        
        if (this.config.enableMeteors) {
            this.startMeteorShower();
        }
    }
    
    handleVisibilityChange() {
        if (!this._isRunning) return;
        
        if (document.hidden) {
            if (this.config.autoPauseOnTabChange) {
                this._pauseInternal();
            }
        } else {
            if (this.config.autoResumeOnTabReturn && this._isPaused) {
                this._resumeInternal();
            }
        }
    }
    
    handleResize() {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            if (!this._isRunning) return;
            
            this.initSky();
            
            if (this.config.onResize) {
                this.config.onResize({ width: this.width, height: this.height });
            }
            
            this.log(`Resize: ${this.width}x${this.height}`);
        }, 100);
    }
    
    setupContainer(container) {
        if (!container || container === document.body) {
            this.container = document.body;
            return;
        }
        
        this.container = container;
        
        const position = window.getComputedStyle(container).position;
        if (position === 'static') {
            container.style.position = 'relative';
        }
    }
    
    setupCanvasStyles() {
        const isBodyContainer = (!this.container || this.container === document.body);
        const position = isBodyContainer ? 'fixed' : 'absolute';
        
        this.canvas.style.position = position;
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = this.config.canvasZIndex;
        this.canvas.style.pointerEvents = 'none';
        
        this.log(`Canvas configurado com position: ${position}`);
    }
    
    start(userConfig = {}) {
        try {
            if (this._isRunning) {
                console.warn('[Starrysky] Já está rodando. Use restart() se quiser reiniciar.');
                return this;
            }
            
            this.config = { ...this.DEFAULT_CONFIG, ...userConfig };
            this.setupContainer(this.config.container);
            
            if (window.innerWidth < 768 && !userConfig.starDensity) {
                this.config.starDensity = 0.002;
            }
            
            this.totalPausedTime = 0;
            this._isPaused = false;
            this.starOpacity = 0;
            this.meteorOpacity = 0;
            
            if (this.canvas && this.canvas.parentNode) {
                if (this.canvas.dataset.starryskyId === this.instanceId) {
                    this.canvas.parentNode.removeChild(this.canvas);
                }
            }
            
            const canvasId = this.config.canvasId || this.instanceId;
            const existingCanvas = document.getElementById(canvasId);
            
            if (existingCanvas && existingCanvas.dataset.starryskyId === this.instanceId) {
                existingCanvas.remove();
            }
            
            this.canvas = document.createElement('canvas');
            this.canvas.id = canvasId;
            this.canvas.dataset.starryskyId = this.instanceId;
            
            this.setupCanvasStyles();
            
            if (this.container === document.body) {
                document.body.insertBefore(this.canvas, document.body.firstChild);
            } else {
                this.container.insertBefore(this.canvas, this.container.firstChild);
            }
            
            this.ctx = this.canvas.getContext('2d');
            if (!this.ctx) {
                throw new Error('Canvas 2D context not supported');
            }
            
            this._isRunning = true;
            this.animationStartTime = Date.now();
            
            this.initSky();
            
            if (this.config.enableMeteors) {
                this.startMeteorShower();
            }
            
            this.animateSky();
            
            if (this.config.autoPauseOnTabChange || this.config.autoResumeOnTabReturn) {
                if (!this.visibilityListenerAttached) {
                    this._visibilityHandler = this.handleVisibilityChange.bind(this);
                    document.addEventListener('visibilitychange', this._visibilityHandler);
                    this.visibilityListenerAttached = true;
                }
            }
            
            this._resizeHandler = this.handleResize.bind(this);
            window.addEventListener('resize', this._resizeHandler);
            
            if (this.config.onStart) {
                this.config.onStart(this);
            }
            
            this.log('Starrysky iniciado');
            this.log(`Configurações de fade: duration=${this.config.fadeDuration}ms, starsDelay=${this.config.starsFadeDelay}ms, meteorsDelay=${this.config.meteorsFadeDelay}ms`);
            
            return this;
            
        } catch (error) {
            console.error('[Starrysky] Erro ao iniciar:', error);
            this.stop();
            throw error;
        }
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this._isRunning = false;
        this._isPaused = false;
        this.clearMeteorTimeouts();
        
        if (this.visibilityListenerAttached && this._visibilityHandler) {
            document.removeEventListener('visibilitychange', this._visibilityHandler);
            this.visibilityListenerAttached = false;
            this._visibilityHandler = null;
        }
        
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
            this._resizeHandler = null;
        }
        
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        
        this.stars = [];
        this.meteors = [];
        
        if (this.config.onStop) {
            this.config.onStop(this);
        }
        
        this.log('Starrysky parado');
        
        return this;
    }
    
    pause() {
        if (!this._isRunning || this._isPaused) return this;
        this._pauseInternal();
        return this;
    }
    
    resume() {
        if (!this._isRunning || !this._isPaused) return this;
        this._resumeInternal();
        return this;
    }
    
    restart(newConfig) {
        return this.stop().start(newConfig || {});
    }
    
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        return this;
    }
    
    getConfig() {
        return { ...this.config };
    }
    
    isRunning() {
        return this._isRunning;
    }
    
    isPaused() {
        return this._isPaused;
    }
    
    getStats() {
        return {
            instanceId: this.instanceId,
            stars: this.stars.length,
            meteors: this.meteors.length,
            rotation: this.rotation,
            opacity: {
                stars: this.starOpacity,
                meteors: this.meteorOpacity
            },
            dimensions: {
                width: this.width,
                height: this.height
            }
        };
    }
    
    getId() {
        return this.instanceId;
    }
}

// ============================================
// API PÚBLICA
// ============================================
const StarryskyAPI = (function() {
    let instance = null;
    
    const api = function(userConfig) {
        if (!instance) {
            instance = new Starrysky();
        }
        return instance.start(userConfig);
    };
    
    api.stop = function() {
        if (instance) {
            instance.stop();
            instance = null;
        }
        return api;
    };
    
    api.pause = function() {
        if (instance) instance.pause();
        return api;
    };
    
    api.resume = function() {
        if (instance) instance.resume();
        return api;
    };
    
    api.restart = function(newConfig) {
        if (!instance) {
            instance = new Starrysky();
            instance.start(newConfig);
        } else {
            instance.restart(newConfig);
        }
        return api;
    };
    
    api.updateConfig = function(newConfig) {
        if (instance) instance.updateConfig(newConfig);
        return api;
    };
    
    api.getConfig = function() {
        return instance ? instance.getConfig() : { ...new Starrysky().DEFAULT_CONFIG };
    };
    
    api.isRunning = function() {
        return instance ? instance.isRunning() : false;
    };
    
    api.isPaused = function() {
        return instance ? instance.isPaused() : false;
    };
    
    api.getStats = function() {
        return instance ? instance.getStats() : null;
    };
    
    api.create = function(instanceId) {
        return new Starrysky(instanceId);
    };
    
    return api;
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StarryskyAPI;
    module.exports.Starrysky = Starrysky;
}

if (typeof window !== 'undefined') {
    window.Starrysky = StarryskyAPI;
}

export default StarryskyAPI;
export { Starrysky };
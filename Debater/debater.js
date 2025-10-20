import { DebateApi } from './js/api.js';

class Debater {
    constructor() {
        this.api = new DebateApi();
        this.api.connectWebSocket = () => {};

        this.running = false;
        this.paused = false;
        this.concluded = false;

        this.topicInput = document.getElementById('topicInput');
        this.turnsInput = document.getElementById('turnsInput');
        this.startSide = document.getElementById('startSide');
        this.startBtn = document.getElementById('startBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.threadEl = document.getElementById('thread');
        this.statusEl = document.getElementById('status');
        this.conclusionEl = document.getElementById('conclusion');
        this.wsIndicator = document.getElementById('wsIndicator');

        this.canvas = document.getElementById('particleCanvas');
        this.ctx = this.canvas?.getContext('2d');
        this.particles = [];
    }

    start() {
        this.startBtn.addEventListener('click', () => this.startDebate());
        this.nextBtn.addEventListener('click', () => this.requestNextTurn());

        this.renderStatus('Idle. Start a debate to begin.');
        this.initParticleCanvas();
        this.animateParticles();
    }

    async startDebate() {
        const topic = (this.topicInput.value || '').trim();
        const turns = parseInt(this.turnsInput.value, 10) || 10;
        const startSide = this.startSide.value;

        if (!topic) {
            alert('Please enter a debate topic.');
            return;
        }

        this.resetDebateState();

        try {
            this.setBusyUI(true);
            this.renderStatus(`Starting debate: "${topic}"...`);

            await this.api.start(topic, turns, startSide);
            console.log('[UI] Debate started');

            this.running = true;
            this.paused = false;
            this.renderStatus('Debate started! Fetching first argument...');

            this.wsIndicator.textContent = 'Polling';
            this.wsIndicator.className = 'ws-indicator ws-polling';

            await this.fetchAndRender();
            
            if (!this.concluded) {
                this.nextBtn.disabled = false;
                this.renderStatus('Ready! Click "Next Turn" to continue.');
            }

        } catch (error) {
            console.error('Start error:', error);
            this.renderStatus(`Error: ${error.message}`);
            this.setBusyUI(false);
        }
    }

    async requestNextTurn() {
        if (this.concluded || this.paused || !this.running) return;
        this.nextBtn.disabled = true;
        
        try {
            console.log('[UI] Next turn requested');
            await this.api.next();
            await this.fetchAndRender();
        } catch (e) {
            console.error('Next error:', e);
            this.renderStatus(`Error: ${e.message}`);
        } finally {
            if (!this.concluded) this.nextBtn.disabled = false;
        }
    }


    async fetchAndRender() {
        try {
            this.threadEl?.classList.add('charging');
            const state = await this.api.getState();
            console.log('[UI] State', state);

            this.renderThread(state.history);
            this.updateProgress(state.currentTurn, state.totalTurns);

            if (state.concluded) {
                this.handleConclusionFromState(state);
            } else {
                this.renderStatus(`Turn ${state.currentTurn}/${state.totalTurns} - Next: ${state.nextSide}`);
                if (this.nextBtn) {
                    const sideLabel = state.nextSide === 'for' ? 'Entity Alpha' : 'Entity Omega';
                    this.nextBtn.textContent = `➡ Next (${sideLabel})`;
                }
            }

        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        } finally {
            this.threadEl?.classList.remove('charging');
        }
    }

    renderThread(history) {
        this.threadEl.innerHTML = '';

        history.forEach((arg, index) => {
            const argDiv = document.createElement('div');
            argDiv.className = `argument ${arg.stance}`;
            
            if (index === history.length - 1) {
                argDiv.classList.add('typing');
                this.createParticleEffect(arg.stance);
            }
            
            const entityName = arg.stance === 'for' ? 'Entity Alpha' : 'Entity Omega';
            const entitySymbol = arg.stance === 'for' ? '◆' : '◇';
            
            argDiv.innerHTML = `
                <div class="arg-header">
                    <span class="arg-number">#${arg.index + 1}</span>
                    <span class="arg-side ${arg.stance}">${entitySymbol} ${entityName}</span>
                    <span class="arg-origin">${arg.origin === 'user' ? 'User' : 'AI'}</span>
                </div>
                <div class="arg-content">${this.escapeHtml(arg.content)}</div>
            `;
            
            this.threadEl.appendChild(argDiv);
        });

        this.threadEl.scrollTop = this.threadEl.scrollHeight;
    }

    updateProgress(current, total) {
        const progressBar = document.querySelector('.progress-fill');
        if (progressBar) {
            const percent = (current / total) * 100;
            progressBar.style.width = `${percent}%`;
        }
    }

    handleConclusionFromState(state) {
        this.concluded = true;
        this.running = false;
        this.nextBtn.disabled = true;
        
        this.conclusionEl.innerHTML = `
            <h3>⚖️ Cosmic Verdict</h3>
            <p>${this.escapeHtml(state.conclusion)}</p>
        `;
        this.conclusionEl.style.display = 'block';
        this.renderStatus('✅ Debate concluded!');
        this.setBusyUI(false);
        this.createConclusionEffect();
    }

    resetDebateState() {
        this.running = false;
        this.paused = false;
        this.concluded = false;
        this.threadEl.innerHTML = '';
        this.conclusionEl.innerHTML = '';
        this.conclusionEl.style.display = 'none';
        this.updateProgress(0, 0);
    }

    setBusyUI(busy) {
        this.startBtn.disabled = busy;
        if (busy) {
            this.renderStatus('⏳ Loading...');
        }
    }

    renderStatus(message) {
        this.statusEl.textContent = message;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    initParticleCanvas() {
        if (!this.canvas || !this.ctx) return;
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });

        for (let i = 0; i < 100; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 1.5 + 0.5,
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.2,
                opacity: Math.random() * 0.5 + 0.3,
                pulse: Math.random() * Math.PI * 2
            });
        }
    }

    animateParticles() {
        if (!this.ctx || !this.canvas) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;

            p.pulse += 0.02;
            const pulseOpacity = p.opacity + Math.sin(p.pulse) * 0.2;

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, pulseOpacity)})`;
            this.ctx.fill();
        });

        requestAnimationFrame(() => this.animateParticles());
    }

    createParticleEffect(stance) {
        const container = document.getElementById('particleContainer');
        if (!container) return;

        const color = stance === 'for' ? '66, 153, 225' : '245, 101, 101';

        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.width = '3px';
            particle.style.height = '3px';
            particle.style.background = `rgba(${color}, 0.8)`;
            particle.style.borderRadius = '50%';
            particle.style.left = Math.random() * window.innerWidth + 'px';
            particle.style.top = Math.random() * 200 + 'px';
            particle.style.boxShadow = `0 0 10px rgba(${color}, 0.6)`;
            particle.style.animation = `particleFloat ${2 + Math.random() * 2}s ease-out forwards`;
            
            container.appendChild(particle);
            setTimeout(() => particle.remove(), 4000);
        }
    }

    createConclusionEffect() {
        const container = document.getElementById('particleContainer');
        if (!container) return;

        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const ring = document.createElement('div');
                ring.style.position = 'fixed';
                ring.style.top = '50%';
                ring.style.left = '50%';
                ring.style.width = '0';
                ring.style.height = '0';
                ring.style.border = '2px solid rgba(183, 148, 246, 0.6)';
                ring.style.borderRadius = '50%';
                ring.style.transform = 'translate(-50%, -50%)';
                ring.style.animation = 'ringExpand 2s ease-out forwards';
                ring.style.pointerEvents = 'none';
                
                container.appendChild(ring);
                setTimeout(() => ring.remove(), 2000);
            }, i * 400);
        }

        const style = document.createElement('style');
        style.textContent = `
            @keyframes particleFloat {
                0% { opacity: 1; transform: translateY(0) scale(1); }
                100% { opacity: 0; transform: translateY(-100px) scale(0.5); }
            }
            @keyframes ringExpand {
                0% { width: 0; height: 0; opacity: 1; }
                100% { width: 400px; height: 400px; opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

const debater = new Debater();
debater.start();

window.Debater = Debater;

export class DebateApi {
    constructor(baseUrl) {
        if (!baseUrl) {
            const isLocal = window.location.hostname === 'localhost' ||
                          window.location.hostname === '127.0.0.1' ||
                          window.location.protocol === 'file:';
            baseUrl = isLocal
                ? 'http://localhost:3001/api/debate'
                : 'https://aibater.onrender.com/api/debate';
        }

        this.baseUrl = baseUrl;
        this.sessionId = null;

        this.ws = null;
        this.wsUrl = null;

        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
    }

    async start(topic, totalTurns, startSide) {
        const result = await this._post('/start', { topic, totalTurns, startSide });

        if (result.sessionId) {
            this.sessionId = result.sessionId;
        }

        return result;
    }

    connectWebSocket() {
        if (!this.sessionId) return;

        const protocol = this.baseUrl.startsWith('https') ? 'wss' : 'ws';
        const wsBaseUrl = this.baseUrl.replace(/^http/, 'ws');
        this.wsUrl = `${wsBaseUrl}?sessionId=${this.sessionId}`;

        try {
            this.ws = new WebSocket(this.wsUrl);

            this.ws.onopen = () => {
                console.log('✅ WebSocket connected!');
                this.reconnectAttempts = 0;
                const el = document.getElementById('wsIndicator');
                if (el) {
                    el.textContent = 'WS: Connected';
                    el.classList.remove('ws-disconnected','ws-connecting');
                    el.classList.add('ws-connected');
                }
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleWebSocketMessage(message);
                } catch (error) {
                    console.error('Failed to parse WS message:', error);
                }
            };

            this.ws.onclose = () => {
                console.log('👋 WebSocket disconnected');
                this.attemptReconnect();
                const el = document.getElementById('wsIndicator');
                if (el) {
                    el.textContent = 'WS: Disconnected';
                    el.classList.remove('ws-connected','ws-connecting');
                    el.classList.add('ws-disconnected');
                }
            };

            this.ws.onerror = (error) => {
                console.error('💥 WebSocket error:', error);
                const el = document.getElementById('wsIndicator');
                if (el) {
                    el.textContent = 'WS: Error';
                    el.classList.remove('ws-connected');
                    el.classList.add('ws-disconnected');
                }
            };

        } catch (error) {
            console.error('WS connection failed:', error);
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.warn('⚠️ Max reconnect attempts reached');
            return;
        }

        this.reconnectAttempts++;
        console.log(`🔄 Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

        setTimeout(() => {
            this.connectWebSocket();
        }, this.reconnectDelay * this.reconnectAttempts);
        const el = document.getElementById('wsIndicator');
        if (el) {
            el.textContent = `WS: Connecting (${this.reconnectAttempts})`;
            el.classList.remove('ws-connected','ws-disconnected');
            el.classList.add('ws-connecting');
        }
    }

    handleWebSocketMessage(message) {
        if (message.type === 'debate_update') {
            const event = new CustomEvent('debateStateUpdate', { detail: message.data });
            window.dispatchEvent(event);
        } else if (message.type === 'debate_concluded') {
            const event = new CustomEvent('debateConcluded', { detail: message });
            window.dispatchEvent(event);
        }
    }

    async getState() {
        return await this._get(`/state?sessionId=${this.sessionId}&t=${Date.now()}`);
    }

    async conclude() {
        return await this._post('/conclude', { sessionId: this.sessionId });
    }

    async next() {
        return await this._post('/next', { sessionId: this.sessionId });
    }

    async _post(endpoint, body) {
        const url = `${this.baseUrl}${endpoint}`;

        try {
            const started = Date.now();
            console.log(`[API] POST ${endpoint}`, body);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                cache: 'no-store',
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log(`[API] POST ${endpoint} -> ${response.status} in ${Date.now()-started}ms`, { data });
            return data;

        } catch (error) {
            console.error(`POST ${endpoint} failed:`, error);
            throw error;
        }
    }

    async _get(endpoint) {
        const url = `${this.baseUrl}${endpoint}`;

        try {
            const started = Date.now();
            console.log(`[API] GET ${endpoint}`);
            const response = await fetch(url, { cache: 'no-store' });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log(`[API] GET ${endpoint} -> ${response.status} in ${Date.now()-started}ms`, { dataSummary: {
                currentTurn: data?.currentTurn,
                totalTurns: data?.totalTurns,
                nextSide: data?.nextSide,
                historyLength: data?.history?.length
            }});
            return data;

        } catch (error) {
            console.error(`GET ${endpoint} failed:`, error);
            throw error;
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

window.DebateApi = DebateApi;

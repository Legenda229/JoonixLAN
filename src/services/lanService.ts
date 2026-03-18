export type MessageHandler = (data: any) => void;

class LanService {
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  public isConnected = false;
  private reconnectTimer: any = null;
  private lastIp = '';
  private lastPort = '';
  private lastTunnelId = '';
  private isExplicitlyDisconnected = false;

  connect(ip: string, port: string, tunnelId: string): Promise<boolean | string> {
    this.lastIp = ip;
    this.lastPort = port;
    this.lastTunnelId = tunnelId;
    this.isExplicitlyDisconnected = false;

    return new Promise((resolve) => {
      try {
        this.disconnect(false);

        let wsUrl = `ws://${ip}:${port}`;
        
        // Clean up the input if user pasted a full URL
        let cleanIp = ip.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '').replace(/\/$/, '');
        
        // If it's a tunneling service, use wss:// and ignore the local port
        const lowerIp = cleanIp.toLowerCase();
        if (lowerIp.includes('ngrok') || lowerIp.includes('pinggy.link') || lowerIp.includes('pinggy.io') || lowerIp.includes('loca.lt') || lowerIp.includes('serveo.net') || lowerIp.includes('serveousercontent.com') || lowerIp.includes('trycloudflare') || lowerIp.includes('srv.us') || lowerIp.includes('localhost.run') || lowerIp.includes('lhr.life')) {
          wsUrl = `wss://${lowerIp}`; // Use lowerIp here because domains are case-insensitive and it prevents issues
        } else if (window.location.protocol === 'https:' && /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(cleanIp)) {
          // Browser will block ws://192.168.x.x from https://
          console.error("Mixed content error: Cannot connect to insecure local IP from HTTPS.");
          return resolve('mixed_content');
        } else if (/[a-zA-Z]/.test(cleanIp) && cleanIp !== 'localhost') {
           // Any other domain name should be wss://
           wsUrl = `wss://${cleanIp}`;
        } else {
          wsUrl = `ws://${cleanIp}:${port}`;
        }

        console.log(`Подключение к ${wsUrl}...`);
        this.ws = new WebSocket(wsUrl);
        
        const timeout = setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            console.log('Таймаут подключения (15 сек)');
            this.ws.close();
            resolve(`timeout: Connection to ${wsUrl} timed out`);
          }
        }, 15000);

        this.ws.onopen = () => {
          console.log('WebSocket открыт, отправка авторизации...');
          this.ws?.send(JSON.stringify({ tunnel_id: tunnelId }));
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.status === 'success') {
              clearTimeout(timeout);
              this.isConnected = true;
              resolve(true);
            } else if (data.status === 'error') {
              clearTimeout(timeout);
              resolve('auth_error');
            }
            
            this.handlers.forEach(h => h(data));
          } catch (e) {
            console.error('Ошибка парсинга сообщения:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket ошибка:', error);
          clearTimeout(timeout);
          resolve(`error: Failed to connect to ${wsUrl}`);
        };

        this.ws.onclose = () => {
          console.log('WebSocket закрыт');
          this.isConnected = false;
          
          if (!this.isExplicitlyDisconnected && this.lastIp) {
            console.log('Попытка переподключения через 3 секунды...');
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = setTimeout(() => {
              this.connect(this.lastIp, this.lastPort, this.lastTunnelId);
            }, 3000);
          }
        };
      } catch (e) {
        console.error('Критическая ошибка WebSocket:', e);
        resolve(false);
      }
    });
  }

  disconnect(explicit = true) {
    if (explicit) {
      this.isExplicitlyDisconnected = true;
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  send(type: string, payload: any = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...payload }));
    } else {
      console.warn('Попытка отправки сообщения без активного подключения:', type);
    }
  }

  subscribe(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
}

export const lanService = new LanService();

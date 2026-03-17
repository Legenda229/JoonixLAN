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

  connect(ip: string, port: string, tunnelId: string): Promise<boolean> {
    this.lastIp = ip;
    this.lastPort = port;
    this.lastTunnelId = tunnelId;
    this.isExplicitlyDisconnected = false;

    return new Promise((resolve) => {
      try {
        // Закрываем предыдущее соединение, если оно есть
        this.disconnect(false);

        console.log(`Подключение к ws://${ip}:${port}...`);
        this.ws = new WebSocket(`ws://${ip}:${port}`);
        
        // Таймаут на подключение (5 секунд)
        const timeout = setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            this.ws.close();
            resolve(false);
          }
        }, 5000);

        this.ws.onopen = () => {
          console.log('WebSocket открыт, отправка авторизации...');
          this.ws?.send(JSON.stringify({ tunnel_id: tunnelId }));
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Обработка ответа на авторизацию
            if (data.status === 'success') {
              clearTimeout(timeout);
              this.isConnected = true;
              resolve(true);
            } else if (data.status === 'error') {
              clearTimeout(timeout);
              resolve(false);
            }
            
            // Рассылка данных подписчикам (например, кадры стрима)
            this.handlers.forEach(h => h(data));
          } catch (e) {
            console.error('Ошибка парсинга сообщения:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket ошибка:', error);
          clearTimeout(timeout);
          resolve(false);
        };

        this.ws.onclose = () => {
          console.log('WebSocket закрыт');
          this.isConnected = false;
          
          // Авто-переподключение, если не было явного отключения
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

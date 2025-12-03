type SocketListener = (data: any) => void;

class SocketService {
  private socket: WebSocket | null = null;
  private listeners: SocketListener[] = [];
  private url: string = 'ws://localhost:8000/dashboard/ws';
  private reconnectInterval: number = 3000;
  private userId: string = 'Commander_X'; // Dynamic in real app

  connect(userId: string) {
    this.userId = userId;
    if (this.socket) return;

    console.log(`📡 UPLINK: Initiating connection to ${this.url}...`);
    this.socket = new WebSocket(`${this.url}/${this.userId}`);

    this.socket.onopen = () => {
      console.log('✅ UPLINK ESTABLISHED: Secure channel active.');
      this.notifyListeners({ type: 'CONNECTION_STATUS', status: 'CONNECTED' });
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notifyListeners(data);
      } catch (e) {
        console.error('Data stream corruption:', e);
      }
    };

    this.socket.onclose = () => {
      console.warn('⚠️ UPLINK SEVERED: Retrying handshake...');
      this.socket = null;
      this.notifyListeners({ type: 'CONNECTION_STATUS', status: 'DISCONNECTED' });
      setTimeout(() => this.connect(this.userId), this.reconnectInterval);
    };

    this.socket.onerror = (err) => {
      console.error('Socket Error:', err);
      this.socket?.close();
    };
  }

  subscribe(listener: SocketListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(data: any) {
    this.listeners.forEach(listener => listener(data));
  }
}

export const socketService = new SocketService();

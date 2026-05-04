import { Client, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '@modules/auth/stores/authStore';

/**
 * URL endpoint STOMP/SockJS của BE (Spring WebSocket).
 * BE dùng STOMP over SockJS — không phải Socket.io.
 */
const WS_URL = import.meta.env.VITE_WS_URL || '/ws';

let stompClient: Client | null = null;

/**
 * Lấy singleton STOMP client.
 * Nếu chưa có thì tạo mới và tự động activate (kết nối).
 * Client tự reconnect sau 5 giây nếu mất kết nối.
 *
 * @returns STOMP Client instance đang active
 */
export const getStompClient = (): Client => {
  if (stompClient?.active) return stompClient;

  stompClient = new Client({
    // Dùng SockJS làm transport thay vì native WebSocket
    // vì BE Spring dùng withSockJS() trong WebSocketConfig
    webSocketFactory: () => new SockJS(WS_URL) as WebSocket,

    // Tự reconnect sau 5 giây nếu mất kết nối
    reconnectDelay: 5000,

    onConnect: () => {
      console.info('[WS] STOMP kết nối thành công');
    },
    onDisconnect: () => {
      console.info('[WS] STOMP ngắt kết nối');
    },
    onStompError: (frame) => {
      console.error('[WS] STOMP lỗi:', frame.headers['message']);
    },
  });

  // Đọc token ngay trước khi CONNECT để đảm bảo luôn dùng token mới nhất
  // BE yêu cầu: Authorization: Bearer <token> trong STOMP CONNECT headers
  stompClient.beforeConnect = () => {
    const token = useAuthStore.getState().session?.accessToken;
    if (stompClient && token) {
      stompClient.connectHeaders = { Authorization: `Bearer ${token}` };
    }
  };

  stompClient.activate();
  return stompClient;
};

/**
 * Subscribe một topic STOMP.
 * Trả về StompSubscription để gọi .unsubscribe() khi cleanup.
 *
 * @param topic - topic STOMP (vd: /topic/tables/{branchId})
 * @param callback - hàm xử lý khi nhận message
 */
export const stompSubscribe = (
  topic: string,
  callback: (body: unknown) => void
): StompSubscription | null => {
  const client = getStompClient();

  // Nếu chưa connected, đợi onConnect rồi subscribe
  if (!client.connected) {
    const originalOnConnect = client.onConnect;
    client.onConnect = (frame) => {
      originalOnConnect?.(frame);
      client.subscribe(topic, (message) => {
        try {
          callback(JSON.parse(message.body));
        } catch {
          console.error('[WS] Parse message lỗi:', message.body);
        }
      });
    };
    return null;
  }

  return client.subscribe(topic, (message) => {
    try {
      callback(JSON.parse(message.body));
    } catch {
      console.error('[WS] Parse message lỗi:', message.body);
    }
  });
};

/**
 * Ngắt kết nối STOMP và xóa singleton.
 * Gọi khi user logout.
 */
export const disconnectStomp = (): void => {
  if (stompClient?.active) {
    void stompClient.deactivate();
  }
  stompClient = null;
};

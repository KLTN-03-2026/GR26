import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '@modules/auth/stores/authStore';

/**
 * URL endpoint STOMP/SockJS của BE (Spring WebSocket).
 * BE dùng STOMP over SockJS — không phải Socket.io.
 */
const WS_URL = import.meta.env.VITE_WS_URL || '/ws';

let stompClient: Client | null = null;

/**
 * Registry các listener muốn được gọi khi STOMP connect thành công.
 * Cho phép nhiều hook cùng đăng ký callback mà không ghi đè lẫn nhau.
 *
 * FIX: Trước đây mỗi hook ghi đè client.onConnect trực tiếp → chỉ hook cuối
 * cùng mount mới nhận được callback → các hook khác mất subscription.
 */
const connectListeners = new Set<() => void>();

/**
 * Đăng ký callback được gọi khi STOMP client connect (hoặc reconnect) thành công.
 * Trả về hàm hủy đăng ký — gọi trong cleanup của useEffect.
 *
 * Nếu client đã connected tại thời điểm đăng ký, callback được gọi ngay lập tức
 * (microtask) để đảm bảo subscribe không bị trễ.
 *
 * @param cb - callback thực hiện subscribe topic
 * @returns unsubscribe function
 *
 * @example
 * useEffect(() => {
 *   const client = getStompClient();
 *   let sub: StompSubscription | null = null;
 *
 *   const doSubscribe = () => {
 *     sub = client.subscribe(topic, handler);
 *   };
 *
 *   if (client.connected) {
 *     doSubscribe();
 *   }
 *   const unsub = onStompConnected(doSubscribe);
 *
 *   return () => { sub?.unsubscribe(); unsub(); };
 * }, [deps]);
 */
export const onStompConnected = (cb: () => void): (() => void) => {
  connectListeners.add(cb);
  return () => {
    connectListeners.delete(cb);
  };
};

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
      // Gọi tất cả listener đã đăng ký — mỗi hook subscribe lại topic của mình.
      // Dùng snapshot [...connectListeners] phòng trường hợp callback thay đổi Set.
      [...connectListeners].forEach((cb) => {
        try {
          cb();
        } catch (err) {
          console.error('[WS] Lỗi trong connect listener:', err);
        }
      });
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

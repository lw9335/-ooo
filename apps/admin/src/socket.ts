import { io, Socket } from 'socket.io-client';

const baseURL = import.meta.env.VITE_API_BASE_URL || '';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(baseURL || '/', {
      query: { role: 'admin' },
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

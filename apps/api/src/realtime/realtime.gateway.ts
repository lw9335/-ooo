import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/**
 * 实时网关：
 * - admin 房间：调度大屏，接收状态/派单/统计变更
 * - worker:<id> 房间：单个师傅，接收派单/通知
 */
@WebSocketGateway({ cors: { origin: true } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const { role, workerId } = client.handshake.query as Record<string, string>;
    if (role === 'admin') {
      client.join('admin');
    } else if (role === 'worker' && workerId) {
      client.join(`worker:${workerId}`);
    }
  }

  handleDisconnect(_client: Socket) {
    // socket.io 自动处理房间清理
  }

  /** 向调度大屏广播 */
  emitToAdmins(event: string, payload: any) {
    this.server?.to('admin').emit(event, payload);
  }

  /** 向指定师傅推送 */
  emitToWorker(workerId: number, event: string, payload: any) {
    this.server?.to(`worker:${workerId}`).emit(event, payload);
  }
}

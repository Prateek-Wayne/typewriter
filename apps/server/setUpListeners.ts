import { Server } from "socket.io";
import { SocketEvent } from "./types";
import { Game } from "./classes/game";

export const rooms = new Map<string, Game>();

export const setUpEventListene = (io: Server) => {
  io.on(SocketEvent.Connected, (socket) => {
    console.log(`New Socket Connection with Socket ID :${socket.id}`);

    socket.on(SocketEvent.JOINGAME, (roomID: string, name: string) => {
      if (!roomID) {
        return socket.emit(SocketEvent.ERROR, "Invalif room ID");
      }
      if (!name) {
        return socket.emit(SocketEvent.ERROR, "Please Providee name");
      }

      socket.join(roomID);
      if (rooms.has(roomID)) {
        const game = rooms.get(roomID);
        if (!game) {
          return socket.emit(SocketEvent.ERROR, "Game not Found");
        }
        game.joinPlayer(socket.id, name, socket);
      } else {
        const game = new Game(roomID, io, socket.id);
        rooms.set(roomID, game);
        game.joinPlayer(socket.id, name, socket);
      }
    });
  });
};

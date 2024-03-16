import { Server, Socket } from "socket.io";
import { SocketEvent } from "../types";

export class Game {
  gameStatus: "not-started" | "in-progress" | "finished";
  gameId: string;
  players: { id: string; name: string ;score: number }[];
  io: Server;
  gameHost: string;
  paragraph: string;

  constructor(id: string, io: Server, host: string) {
    this.gameId = id;
    this.players = [];
    this.io = io;
    this.gameHost = host;
    this.gameStatus = "not-started";
    this.paragraph = "";
  }

  setUpListeners(socket: Socket) {}

  joinPlayer(id: string, name: string, socket: Socket) {
    if (this.gameStatus === "in-progress")
      return socket.emit(
        SocketEvent.ERROR,
        "Game has already started ,Please Wait"
      );

    this.players.push({id,name,score:0});
    this.io.to(this.gameId).emit(SocketEvent.UserJoined,{
        id,name,score:0
    });
    socket.emit(SocketEvent.AllPlayer,this.players);
    socket.emit(SocketEvent.NEWHOST,this.gameHost);
    this.setUpListeners(socket);
  }
}

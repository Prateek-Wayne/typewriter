import { Server, Socket } from "socket.io";
import { SocketEvent } from "../types";
import { generateParagraph } from "../utils/generateParagraph";
import { rooms } from "../setUpListeners";

export class Game {
  gameStatus: "not-started" | "in-progress" | "finished";
  gameId: string;
  players: { id: string; name: string; score: number }[];
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

  setUpListeners(socket: Socket) {
    socket.on(SocketEvent.STARTGAME, async () => {
      if (this.gameStatus === "in-progress")
        return socket.emit(SocketEvent.ERROR, "The Game has already started");

      if (this.gameHost !== socket.id)
        return socket.emit(
          SocketEvent.ERROR,
          "You are not host of event ,Only Host can start the game"
        );

      for (const player of this.players) {
        player.score = 0;
      }
      this.io.to(this.gameId).emit(SocketEvent.AllPlayer, this.players);
      this.gameStatus = "in-progress";
      const paragraph = await generateParagraph();
      this.paragraph = paragraph;
      this.io.to(this.gameId).emit(SocketEvent.GAMESTARTED, paragraph);
      setTimeout(() => {
        this.gameStatus = "finished";
        this.io.to(this.gameId).emit(SocketEvent.GAMEFINISHED);
        this.io.to(this.gameId).emit(SocketEvent.AllPlayer, this.players);
      }, 60000);
    });
    // Get player keystrokes and check if they match the paragraph
    socket.on(SocketEvent.PLAYERTYPED, (typed: string) => {
      if (this.gameStatus !== "in-progress")
        return socket.emit(SocketEvent.ERROR, "The game has not started yet");

      const splittedParagraph = this.paragraph.split(" ");
      const splittedTyped = typed.split(" ");

      let score = 0;

      for (let i = 0; i < splittedTyped.length; i++) {
        if (splittedTyped[i] === splittedParagraph[i]) {
          score++;
        } else {
          break;
        }
      }

      const player = this.players.find((player) => player.id === socket.id);

      if (player) {
        player.score = score;
      }

      this.io.to(this.gameId).emit(SocketEvent.SCORE, { id: socket.id, score });
    });

    socket.on(SocketEvent.LEAVE, () => {
      if (socket.id === this.gameHost) {
        this.players = this.players.filter((player) => player.id !== socket.id);
        if (this.players.length !== 0) {
          this.gameHost = this.players[0].id;
          this.io.to(this.gameId).emit(SocketEvent.NEWHOST, this.gameHost);
          this.io.to(this.gameHost).emit(SocketEvent.PLAYERLEFT, socket.id);
        } else {
          rooms.delete(this.gameId);
        }
      }
      socket.leave(this.gameId);
      this.players = this.players.filter((player) => player.id !== socket.id);
      this.io.to(this.gameId).emit(SocketEvent.PLAYERLEFT, socket.id);
    });
  }

  joinPlayer(id: string, name: string, socket: Socket) {
    if (this.gameStatus === "in-progress")
      return socket.emit(
        SocketEvent.ERROR,
        "Game has already started ,Please Wait"
      );

    this.players.push({ id, name, score: 0 });
    this.io.to(this.gameId).emit(SocketEvent.UserJoined, {
      id,
      name,
      score: 0,
    });
    socket.emit(SocketEvent.AllPlayer, this.players);
    socket.emit(SocketEvent.NEWHOST, this.gameHost);
    this.setUpListeners(socket);
  }
}

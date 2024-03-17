"use client";

import type { GameProps, GameStatus, Player, PlayerScore } from "@/types/types";
import { useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";
import { toast } from "sonner";
import LeaderboardCard from "./leaderboard-card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {SocketEvent} from '../../server/types';


export default function GamePlayer({ gameId, name }: GameProps) {
  const [ioInstance, setIoInstance] = useState<Socket>();
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>("not-started");
  const [paragraph, setParagraph] = useState<string>("");
  const [host, setHost] = useState<string>("");
  const [inputParagraph, setInputParagraph] = useState<string>("");

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL as string, {
      transports: ["websocket"],
    });
    setIoInstance(socket);

    socket.emit(SocketEvent.JOINGAME, gameId, name);

    return () => {
      removeListeners();
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    setupListeners();
    return () => removeListeners();
  }, [ioInstance]);

  // useEffect for detecting changes in input paragraph
  useEffect(() => {
    if (!ioInstance || gameStatus !== "in-progress") return;

    ioInstance.emit("player-typed", inputParagraph);
  }, [inputParagraph]);

  function setupListeners() {
    if (!ioInstance) return;

    ioInstance.on("connect", () => {
      console.log("connected");
    });

    ioInstance.on(SocketEvent.AllPlayer, (players: Player[]) => {
      console.log("received players");
      setPlayers(players);
    });

    ioInstance.on(SocketEvent.UserJoined, (player: Player) => {
      setPlayers((prev) => [...prev, player]);
    });

    ioInstance.on(SocketEvent.PLAYERLEFT, (id: string) => {
      setPlayers((prev) => prev.filter((player) => player.id !== id));
    });

    ioInstance.on(SocketEvent.SCORE, ({ id, score }: PlayerScore) => {
      setPlayers((prev) =>
        prev.map((player) => {
          if (player.id === id) {
            return {
              ...player,
              score,
            };
          }
          return player;
        }),
      );
    });

    ioInstance.on(SocketEvent.GAMESTARTED, (paragraph: string) => {
      setParagraph(paragraph);
      setGameStatus("in-progress");
    });

    ioInstance.on(SocketEvent.GAMEFINISHED, () => {
      setGameStatus("finished");
      setInputParagraph("");
    });

    ioInstance.on(SocketEvent.NEWHOST, (id: string) => {
      setHost(id);
    });

    ioInstance.on(SocketEvent.ERROR, (message: string) => {
      toast.error(message);
    });
  }

  function removeListeners() {
    if (!ioInstance) return;

    ioInstance.off("connect");
    ioInstance.off(SocketEvent.AllPlayer);
    ioInstance.off(SocketEvent.UserJoined);
    ioInstance.off(SocketEvent.PLAYERLEFT);
    ioInstance.off(SocketEvent.SCORE);
    ioInstance.off(SocketEvent.GAMESTARTED);
    ioInstance.off(SocketEvent.GAMEFINISHED);
    ioInstance.off(SocketEvent.NEWHOST);
    ioInstance.off(SocketEvent.ERROR);
  }

  function startGame() {
    if (!ioInstance) return;

    ioInstance.emit(SocketEvent.STARTGAME);
  }

  window.onbeforeunload = () => {
    if (ioInstance) {
      ioInstance.emit(SocketEvent.LEAVE);
    }
  };

  return (
    <div className="w-screen p-10 grid grid-cols-1 lg:grid-cols-3 gap-20">
      {/* Leaderboard */}
      <div className="w-full order-last lg:order-first">
        <h2 className="text-2xl font-medium mb-10 mt-10 lg:mt-0">
          Leaderboard
        </h2>
        <div className="flex flex-col gap-5 w-full">
          {/* sort players based on score and map */}
          {players
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <LeaderboardCard
                key={player.id}
                player={player}
                rank={index + 1}
              />
            ))}
        </div>
      </div>

      {/* Game */}
      <div className="lg:col-span-2 h-full">
        {gameStatus === "not-started" && (
          <div className="flex flex-col items-center justify-center p-10">
            <h1 className="text-2xl font-bold">
              Waiting for players to join...
            </h1>

            {host === ioInstance?.id && (
              <Button className="mt-10 px-20" onClick={startGame}>
                Start Game
              </Button>
            )}
          </div>
        )}

        {gameStatus === "in-progress" && (
          <div className="h-full">
            <h1 className="text-2xl font-bold mb-10">
              Type the paragraph below
            </h1>

            <div className="relative h-full">
              <p className="text-2xl lg:text-5xl p-5">{paragraph}</p>

              <Textarea
                value={inputParagraph}
                onChange={(e) => setInputParagraph(e.target.value)}
                className="text-2xl lg:text-5xl outline-none p-5 absolute top-0 left-0 right-0 bottom-0 z-10 opacity-75"
                placeholder=""
                disabled={gameStatus !== "in-progress" || !ioInstance}
              />
            </div>
          </div>
        )}

        {gameStatus === "finished" && (
          <div className="flex flex-col items-center justify-center p-10">
            <h1 className="text-2xl font-bold text-center">
              Game finished!
              {ioInstance?.id === host && " Restart the game fresh!"}
            </h1>

            {host === ioInstance?.id && (
              <Button className="mt-10 px-20" onClick={startGame}>
                Start Game
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

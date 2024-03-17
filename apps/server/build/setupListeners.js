"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupListeners = exports.rooms = void 0;
const game_1 = require("./classes/game");
exports.rooms = new Map();
function setupListeners(io) {
    io.on("connection", (socket) => {
        console.log(`New connection - ${socket.id}`);
        socket.on("join-game", (roomId, name) => {
            if (!roomId) {
                return socket.emit("error", "Invalid room ID");
            }
            socket.join(roomId);
            console.log("joined a room");
            // Check if the game already exists
            if (exports.rooms.has(roomId)) {
                console.log("room exists");
                // Add the player to the class instance
                const game = exports.rooms.get(roomId);
                if (!game)
                    return socket.emit("error", "Game not found");
                game.joinPlayer(socket.id, name, socket);
            }
            else {
                console.log("room doesnt exists");
                // Create a new game instance
                const game = new game_1.Game(roomId, io, socket.id);
                exports.rooms.set(roomId, game);
                game.joinPlayer(socket.id, name, socket);
            }
        });
    });
}
exports.setupListeners = setupListeners;

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAll = exports.revealCards = exports.selectedNumber = exports.joinGame = void 0;
const _1 = require(".");
// export const createGame = async ({ parsedData, socket, client }: Args) => {
//   try {
//     const userId = parsedData.userId;
//     const gameId = uuid();
//     await client?.set(
//       `gameId:${gameId}`,
//       JSON.stringify({
//         players: [{ playerId: userId, name: parsedData.name, number: "0" }],
//         status: "active",
//       })
//     );
//     socket.send(JSON.stringify({type:"create", gameId: gameId }));
//   } catch (err: any) {
//     throw err;
//   }
// };
const joinGame = (_a) => __awaiter(void 0, [_a], void 0, function* ({ parsedData, socket, client }) {
    try {
        const gameID = parsedData.gameId;
        const userId = parsedData.userId;
        const gameString = yield (client === null || client === void 0 ? void 0 : client.get(`gameId:${gameID}`));
        const game = gameString ? JSON.parse(gameString) : null;
        if (game.players) {
            game.players.push({
                playerId: userId,
                name: parsedData.name,
                number: "0",
            });
            yield (client === null || client === void 0 ? void 0 : client.set(`gameId:${gameID}`, JSON.stringify(game)));
            (0, _1.broadcast)({
                type: "join",
                name: parsedData.name,
                gameId: gameID,
            }, { socket, userId, redisClient: client });
        }
        else {
            socket.send("invalid GameID");
        }
    }
    catch (err) {
        throw err;
    }
});
exports.joinGame = joinGame;
const selectedNumber = (_a) => __awaiter(void 0, [_a], void 0, function* ({ parsedData, socket, client }) {
    try {
        const gameID = parsedData.gameId;
        const userId = parsedData.userId;
        const gameString = yield (client === null || client === void 0 ? void 0 : client.get(`gameId:${gameID}`));
        const game = gameString ? JSON.parse(gameString) : null;
        if (game.players) {
            const playerIdIndex = game.players.findIndex((p) => p.playerId === userId);
            if (!playerIdIndex) {
                socket.send("unAuthorized");
            }
            game.players[playerIdIndex].number = parsedData.number;
            game.players[playerIdIndex].voted = true;
            yield (client === null || client === void 0 ? void 0 : client.set(`gameId:${gameID}`, JSON.stringify(game)));
            (0, _1.broadcast)({
                type: "selected",
                name: parsedData.name,
                voted: true,
                gameId: gameID,
            }, { socket, userId, redisClient: client });
        }
        else {
            socket.send("invalid GameID");
        }
    }
    catch (err) {
        throw err;
    }
});
exports.selectedNumber = selectedNumber;
const revealCards = (_a) => __awaiter(void 0, [_a], void 0, function* ({ parsedData, socket, client }) {
    try {
        const gameID = parsedData.gameId;
        const userId = parsedData.userId;
        const gameString = yield (client === null || client === void 0 ? void 0 : client.get(`gameId:${gameID}`));
        const game = gameString ? JSON.parse(gameString) : null;
        if (game.players) {
            const playerIdIndex = game.players.findIndex((p) => p.playerId === userId);
            if (playerIdIndex < 0) {
                socket.send("unAuthorized");
            }
            const revealedCards = game.players.map((p) => ({
                playerName: p.name,
                number: p.number,
                voted: p.voted
            }));
            (0, _1.broadcast)({
                type: "reveal",
                name: parsedData.name,
                gameId: gameID,
                cards: revealedCards,
            }, { socket, userId, redisClient: client });
        }
        else {
            socket.send("invalid GameID");
        }
    }
    catch (err) {
        throw err;
    }
});
exports.revealCards = revealCards;
const getAll = (_a) => __awaiter(void 0, [_a], void 0, function* ({ socket, client, parsedData }) {
    try {
        const gameString = yield client.get(`gameId:${parsedData.gameId}`);
        const gamePlayers = JSON.parse(gameString);
        const allPlayers = gamePlayers.players.map((p) => ({
            name: p.name
        }));
        const data = {
            type: "all",
            players: allPlayers
        };
        socket.send(JSON.stringify(data));
    }
    catch (err) {
        throw err;
    }
});
exports.getAll = getAll;

import { v4 as uuid } from "uuid";
import WebSocket, { WebSocketServer } from "ws";
import { Data, Player, responseDataType } from "./types";
import { broadcast } from ".";

interface Args {
  socket: WebSocket;
  parsedData: Data;
  client: any;
}

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

export const joinGame = async ({ parsedData, socket, client }: Args) => {
  try {
    const gameID = parsedData.message.gameId;
    const userId = parsedData.message.userId;
    const gameString = await client?.get(`gameId:${gameID}`);
    const game = gameString ? JSON.parse(gameString) : null;
    if (game.players) {
      game.players.push({
        playerId: userId,
        name: parsedData.message.name,
        number: "0",
        voted: false,
      });
      await client?.set(`gameId:${gameID}`, JSON.stringify(game));
      broadcast(
        {
          type: "game",
          message: game,
        }
      );
    } else {
      socket.send("invalid GameID");
    }
  } catch (err: any) {
    throw err;
  }
};

export const voted = async ({ parsedData, socket, client }: Args) => {
  try {
    const gameID = parsedData.message.gameId;
    const userId = parsedData.message.userId;
    const gameString = await client?.get(`gameId:${gameID}`);
    const game = gameString ? JSON.parse(gameString) : null;
    if (game.players) {
      const playerIdIndex = game.players.findIndex(
        (p: Player) => p.playerId === userId
      );
      if (!playerIdIndex) {
        socket.send("unAuthorized");
      }
      game.players[playerIdIndex].number = parsedData.message.number;
      game.players[playerIdIndex].voted = true;
      await client?.set(`gameId:${gameID}`, JSON.stringify(game));
      broadcast(
        {
          type: "game",
          message: game,
        }
      );
    } else {
      socket.send("invalid GameID");
    }
  } catch (err: any) {
    throw err;
  }
};

export const reveal = async ({ parsedData, socket, client }: Args) => {
  try {
    const gameID = parsedData.message.gameId;
    const userId = parsedData.message.userId;
    const gameString = await client?.get(`gameId:${gameID}`);
    const game = gameString ? JSON.parse(gameString) : null;
    if (game.organizerId != userId) return;
    game.reveal = true;

    broadcast(
      {
        type: "game",
        message: game,
      }
    );
  } catch (err: any) {
    throw err;
  }
};

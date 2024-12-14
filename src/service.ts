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
    const gameID = parsedData.gameId;
    const userId = parsedData.userId;
    const gameString = await client?.get(`gameId:${gameID}`);
    const game = gameString ? JSON.parse(gameString) : null;
    if (game.players) {
      game.players.push({
        playerId: userId,
        name: parsedData.name,
        number: "0",
        voted:false
      });
      await client?.set(`gameId:${gameID}`, JSON.stringify(game));
      broadcast(
        {
          type: "join",
          name: parsedData.name,
          voted:false,
          gameId: gameID,
        },
        { socket, userId, redisClient: client }
      );
    } else {
      socket.send("invalid GameID");
    }
  } catch (err: any) {
    throw err;
  }
};

export const selectedNumber = async ({ parsedData, socket, client }: Args) => {
  try {
    const gameID = parsedData.gameId;
    const userId = parsedData.userId;
    const gameString = await client?.get(`gameId:${gameID}`);
    const game = gameString ? JSON.parse(gameString) : null;
    if (game.players) {
      const playerIdIndex = game.players.findIndex(
        (p: Player) => p.playerId === userId
      );
      if (!playerIdIndex) {
        socket.send("unAuthorized");
      }
      game.players[playerIdIndex].number = parsedData.number;
      game.players[playerIdIndex].voted = true;
      await client?.set(`gameId:${gameID}`, JSON.stringify(game));
      broadcast(
        {
          type: "selected",
          name: parsedData.name,
          voted:true,
          gameId: gameID,
        },
        { socket, userId, redisClient: client }
      );
    } else {
      socket.send("invalid GameID");
    }
  } catch (err: any) {
    throw err;
  }
};

export const revealCards = async ({ parsedData, socket, client }: Args) => {
  try {
    const gameID = parsedData.gameId;
    const userId = parsedData.userId;
    const gameString = await client?.get(`gameId:${gameID}`);
    const game = gameString ? JSON.parse(gameString) : null;
    if (game.players) {
      const playerIdIndex = game.players.findIndex(
        (p: Player) => p.playerId === userId
      );
      if (playerIdIndex<0) {
        socket.send("unAuthorized");
      }
      const revealedCards = game.players.map((p: Player) => ({
        name: p.name,
        number: p.number,
        voted:p.voted
      }));
      broadcast(
        {
          type: "reveal",
          name: parsedData.name,
          gameId: gameID,
          cards: revealedCards,
        },
        { socket, userId, redisClient: client }
      );
    } else {
      socket.send("invalid GameID");
    }
  } catch (err: any) {
    throw err;
  }
};

export const getAll = async ({socket, client , parsedData }: Args)=>{
   try {
      const gameString = await client.get(`gameId:${parsedData.gameId}`)
      const gamePlayers = JSON.parse(gameString)
      const allPlayers = gamePlayers.players.map((p:Player)=>({
        name:p.name,
        voted:p.voted,
      }))
      const data:responseDataType= {
        type:"all",
        players:allPlayers
      }
      socket.send(JSON.stringify(data))
   } catch (err:any){
    throw err;
   }
}
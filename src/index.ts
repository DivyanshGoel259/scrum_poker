import http from "http";
import WebSocket, { WebSocketServer } from "ws";
import { redisClient } from "./lib/redis";
import { v4 as uuid } from "uuid";
import * as service from "./service";
import { Data, Player, UserWebSocket } from "./types";
import  express, {Request, Response }  from "express";
import cors from  'cors'

const app = express ()
const PORT = 8080

const server = app.listen(PORT,()=>{
  console.log("started listening on "+PORT)
})

app.use(express.json())
app.use(cors())
const wss = new WebSocketServer({ server });


app.post("/create",async (req:Request,res:Response)=>{
  try{
  const client = await redisClient()
  const { name} = req.body
  const userId = uuid()
  const gameId = uuid()
  await client?.set(`gameId:${gameId}`,JSON.stringify({players:[{ playerId: userId, name:name, number: "0",voted:false }],reveal:false,gameId:gameId,organizerId:userId}))
    res.json({organizerId:userId,gameId:gameId})
  } catch (err:any){
    res.json({error:{message:err.message}})
  }    

})

let client:any; 


wss.on("connection", async function connection(socket: UserWebSocket, req) {
  try {
    if(!client){client=await redisClient()}
    let userId = req.url?.split("?")[1].split("=")[1];
    
    if (userId=="undefined" || userId=="null") {
      userId = uuid();
      socket.send(JSON.stringify({type:"new_user", assignedId: userId }));
    }
    socket.userId = userId;

    socket.on("error", async function error(err: any) {
      console.log(err.message);
    });

    socket.on("close",async function onClose(){
      try {
        const userId = socket.userId
        if(!userId){throw new Error("user have no id")}
        const keys = await client?.keys(`game:*`)
        if(!keys){throw new Error("There's No Game Available")}
        for(const key of keys){
          const gameId = key.split(":")[1]
          const gameString = await client?.get(key)
          const game = gameString? JSON.parse(gameString) :null
          const playerIndex = game.players.findIndex((player:Player)=> player.playerId === userId)
          if(playerIndex!=-1){
            game.players.splice(playerIndex,1)
            await client?.set(key,JSON.stringify(game))
            broadcast({
              type:"game_disconnect",
              message:game          
            })
            break
          }          
        }
      } catch (err:any){
        socket.send(err.message)
      }
    })

    socket.on("message", async function event(data: any) {
      try {
        const parsedData: Data = JSON.parse(data);

        switch (parsedData.type) {

          case "join": {
            await service.joinGame({ parsedData, socket, client });
            break;
          }

          case "voted": {
            await service.voted({ parsedData, socket, client });
            break;
          }

          case "reveal": {
            await service.reveal({ parsedData, socket, client });
            break;
          }
        }
      } catch (err: any) {
        socket.send(err.message);
      }
    });
  } catch (err: any) {
    socket.send(err.message);
  }
});


export async function broadcast(
  data:Data
) {  
  for (const client of wss.clients as Set<UserWebSocket>) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  }
  }



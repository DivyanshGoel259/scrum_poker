import WebSocket from "ws";

export interface UserWebSocket extends WebSocket {
    userId: string|undefined;
}

export interface Data {
  type:string,
  message:Partial<{players:Array<Player>,
    organizerId:string,
    reveal:boolean,gameId:string,userId:string,name:string,number:string}>
}


export interface responseDataType {
  type:string,
  name?:string,
  number?:string,
  gameId?:string|undefined,
  cards?:Array<Pick<Player,"name"|"number">>
  players?:Array<Pick<Player,"name">>
  success?:boolean
}


export interface Player {
  playerId:string,
  number:string,
  name:string,
  voted:boolean
}
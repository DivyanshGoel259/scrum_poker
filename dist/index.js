"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcast = broadcast;
const ws_1 = __importStar(require("ws"));
const redis_1 = require("./lib/redis");
const uuid_1 = require("uuid");
const service = __importStar(require("./service"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const PORT = 8080;
const server = app.listen(PORT, () => {
    console.log("started listening on " + PORT);
});
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.post("/create", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const client = yield (0, redis_1.redisClient)();
        const { name } = req.body;
        const userId = (0, uuid_1.v4)();
        const gameId = (0, uuid_1.v4)();
        yield (client === null || client === void 0 ? void 0 : client.set(`gameId:${gameId}`, JSON.stringify({ players: [{ playerId: userId, name: name, number: "0", voted: false }], status: "active" })));
        res.json({ assignedId: userId, gameId: gameId });
    }
    catch (err) {
        res.json({ error: { message: err.message } });
    }
}));
const wss = new ws_1.WebSocketServer({ server });
wss.on("connection", function connection(socket, req) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const client = yield (0, redis_1.redisClient)();
            let userId = (_a = req.url) === null || _a === void 0 ? void 0 : _a.split("?")[1].split("=")[1];
            if (userId == "undefined" || userId == "null") {
                userId = (0, uuid_1.v4)();
                socket.send(JSON.stringify({ type: "new_user", assignedId: userId }));
            }
            socket.userId = userId;
            socket.on("error", function error(err) {
                return __awaiter(this, void 0, void 0, function* () {
                    console.log(err.message);
                });
            });
            socket.on("close", function onClose() {
                return __awaiter(this, void 0, void 0, function* () {
                });
            });
            socket.on("message", function event(data) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        const parsedData = JSON.parse(data);
                        switch (parsedData.type) {
                            case "join": {
                                yield service.joinGame({ parsedData, socket, client });
                                break;
                            }
                            case "selected": {
                                yield service.selectedNumber({ parsedData, socket, client });
                                break;
                            }
                            case "reveal": {
                                yield service.revealCards({ parsedData, socket, client });
                                break;
                            }
                            case "all": {
                                yield service.getAll({ socket, client, parsedData });
                                break;
                            }
                        }
                    }
                    catch (err) {
                        socket.send(err.message);
                    }
                });
            });
        }
        catch (err) {
            socket.send(err.message);
        }
    });
});
function broadcast(data, userSocketInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        const gameString = yield userSocketInfo.redisClient.get(`gameId:${data.gameId}`);
        const game = JSON.parse(gameString);
        if (game && game.players) {
            const playerIds = new Set(game.players.map((player) => player.playerId));
            const playerNameList = {
                type: "bulk",
                players: game.players.map((player) => ({
                    name: player.name,
                })),
            };
            switch (data.type) {
                case "join": {
                    for (const client of wss.clients) {
                        if (client.readyState === ws_1.default.OPEN &&
                            client.userId != userSocketInfo.userId &&
                            playerIds.has(client.userId) &&
                            client !== userSocketInfo.socket) {
                            client.send(JSON.stringify(data));
                        }
                    }
                    break;
                }
                case "selected": {
                    for (const client of wss.clients) {
                        if (client.readyState === ws_1.default.OPEN &&
                            playerIds.has(client.userId)) {
                            client.send(JSON.stringify(data));
                        }
                    }
                    break;
                }
                case "reveal": {
                    for (const client of wss.clients) {
                        if (client.readyState === ws_1.default.OPEN &&
                            playerIds.has(client.userId)) {
                            client.send(JSON.stringify(data));
                        }
                    }
                    break;
                }
            }
        }
    });
}

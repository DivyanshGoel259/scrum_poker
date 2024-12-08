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
exports.redisClient = void 0;
const redis_1 = require("redis");
const redisClient = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const redisClients = (0, redis_1.createClient)({
            username: 'default',
            password: 'tEU486Skwbu8K7bYu3MqeZIDxELxJSM8',
            socket: {
                host: 'redis-18680.c80.us-east-1-2.ec2.redns.redis-cloud.com',
                port: 18680
            }
        });
        redisClients.on('error', err => { throw err; });
        const redisClient = yield redisClients.connect();
        return redisClient;
    }
    catch (err) {
        console.log(err.message);
    }
});
exports.redisClient = redisClient;

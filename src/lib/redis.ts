import { createClient } from "redis";

export const redisClient = async ()=>{
    try{
    const redisClients = createClient({
        username: 'default',
        password: 'tEU486Skwbu8K7bYu3MqeZIDxELxJSM8',
        socket: {
            host: 'redis-18680.c80.us-east-1-2.ec2.redns.redis-cloud.com',
            port: 18680
        }
    });
    
    redisClients.on('error', err => {throw err});
    
    const redisClient = await redisClients.connect()
    return redisClient

} catch(err:any){
    console.log(err.message)
}

}
import WebSocket from 'ws';
import { createServer } from "http";
import { Server } from 'socket.io';
import winston from 'winston';
import { PrismaClient } from '@prisma/client'

export const wsPolling = {
    realTimePolling
}
const prisma = new PrismaClient();
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
      //
      // - Write all logs with importance level of `error` or less to `error.log`
      // - Write all logs with importance level of `info` or less to `combined.log`
      //
    // new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: './src/routes/Bybit/__logging/info.log' }),
    ],
});

function realTimePolling(ws: any) {
    ws.on("open", () => {
        console.log("connected");
        logger.log({level: 'info', message: "Connected!"})

        setInterval(() => {
            logger.log({level: 'info', message: "Checking Heartbeat"})
            ws.send('{"op":"ping"}');
        }, 5000);

        ws.send('{"op": "subscribe", "args": ["publicTrade.BTC"]}');
    });

    ws.on("message", async (response: { toString: () => string; }) => {
        console.log(JSON.parse(response.toString()));
        const dataSet = JSON.parse(response.toString());
        const {id, topic, ts, data } = dataSet;
        if(data){
            data.map(async (obj: any)=>{
                await prisma.byBitData.create({
                    data: {
                        name: id, 
                        timeStamp: new Date(ts),
                        price : Number(obj.p),
                        volume:  Number(obj.v),
                        instrument: obj.s
                    }
                });
            })
        }

          
        logger.log({
            level: 'info',
            message: JSON.parse(response.toString()),
            additional: 'properties',
            are: 'passed along'
        });
    });
}
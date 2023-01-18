import WebSocket from 'ws';
import { createServer } from "http";
import { Server } from 'socket.io';
import winston from 'winston';
import { PrismaClient } from '@prisma/client'

export const wsBitPolling = {
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
    new winston.transports.File({ filename: './src/routes/Bit/__logging/info.log' }),
    ],
});

function realTimePolling(ws: any) {
    ws.on("open", () => {
        console.log("connected BitCom");
        logger.log({level: 'info', message: "Connected!"})

        setInterval(() => {
            logger.log({level: 'info', message: "Checking Heartbeat"})
            ws.send('{"type":"ping","params":{"id":123}}');
        }, 5000);


        ws.send('{"type":"subscribe","channels":[ "market_trade"],"currencies":["BTC"],"categories":["option"],"interval": "100ms"}');
        ws.send('{"type":"subscribe","channels":[ "market_trade"],"currencies":["ETH"],"categories":["option"],"interval": "100ms"}');
    });

    ws.on("message", (response: { toString: () => string; }) => {
        console.log(JSON.parse(response.toString()));
        const dataSet = JSON.parse(response.toString());
        const { data, timestamp } = dataSet;

        if(data && data.code !== 0){
            data.map(async (obj: any)=>{
                await prisma.bitCom.create({
                    data: {
                        name: obj.instrument_id, 
                        timeStamp: new Date(timestamp),
                        price : Number(obj.price),
                        volume:  Number(obj.sigma),
                        instrument: obj.instrument_id,
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
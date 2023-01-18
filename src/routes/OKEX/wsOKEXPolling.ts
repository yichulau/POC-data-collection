import WebSocket from 'ws';
import { createServer } from "http";
import { Server } from 'socket.io';
import winston from 'winston';
import crypto from 'crypto';
import sha256 from 'crypto-js/sha256';
import hmacSHA512 from 'crypto-js/hmac-sha512';
import Base64 from 'crypto-js/enc-base64';
import { PrismaClient } from '@prisma/client'

export const wsOKEXPolling = {
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
    new winston.transports.File({ filename: './src/routes/OKEX/__logging/info.log' }),
    ],
});

function realTimePolling(ws: any) {
    ws.on("open", () => {

        console.log("connected OKEX");

        logger.log({level: 'info', message: "Connected!"})

        setInterval(() => {
            logger.log({level: 'info', message: "Checking Heartbeat"})
            ws.send(`"op": "login"}]`);
        }, 5000);

        ws.send('{"op": "subscribe","args": [{"channel": "option-trades","instType": "OPTION","instFamily": "BTC-USD"}]}');
        ws.send('{"op": "subscribe","args": [{"channel": "option-trades","instType": "OPTION","instFamily": "ETH-USD"}]}');
    });

    ws.on("message", async (response: { toString: () => string; }) => {

        const dataSet = JSON.parse(response.toString());
        const { data } = dataSet;
        if(data){
            data.map(async (obj: any)=>{
                const { instId, ts, px, fillVol, tradeId, instFamily} = obj
                await prisma.oKEXData.create({
                    data: {
                        name: instId, 
                        timeStamp: new Date(),
                        price : Number(px),
                        volume:  Number(fillVol),
                        instrument: tradeId.toString(),
                        instFamily: instFamily
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

function getSignature(timestamp : any , method : any , path : any , secret :any) {
    const hashDigest = (timestamp/1000) + method + path;
    const hmacDigest = Base64.stringify(hmacSHA512(hashDigest,secret));
    return hmacDigest;
}

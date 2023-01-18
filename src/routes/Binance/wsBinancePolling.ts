import WebSocket from 'ws';
import { createServer } from "http";
import { Server } from 'socket.io';
import winston from 'winston';
import crypto from 'crypto';
import sha256 from 'crypto-js/sha256';
import hmacSHA512 from 'crypto-js/hmac-sha512';
import Base64 from 'crypto-js/enc-base64';
import { PrismaClient } from '@prisma/client'

export const wsBinancePolling = {
    realTimePollingETH,
    realTimePollingBTC
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
    new winston.transports.File({ filename: './src/routes/Binance/__logging/info.log' }),
    ],
});

function realTimePollingETH(ws: any) {
    ws.on("open", () => {

        console.log("connected Binance");

        // logger.log({level: 'info', message: "Connected!"})

        // setInterval(() => {
        //     logger.log({level: 'info', message: "Checking Heartbeat"})
        //     ws.send(`"op": "login"}]`);
        // }, 5000);

        ws.send('{"method": "SUBSCRIBE","id": 1,"params":["ETH@trade"]}');

    });

    ws.on("message", async (response: { toString: () => string; }) => {
        console.log(JSON.parse(response.toString()))
        const dataSet = JSON.parse(response.toString());
        const { data } = dataSet;
        if(data){
            const symbol = dataSet.stream.toString().replace(/@trade/g,'');
            const { s: instId, p: price, q: volume, t: tradeId, T: timeStamp} = data;
            
            await prisma.binanceData.create({
                data: {
                    name: instId, 
                    timeStamp: new Date(timeStamp),
                    price : Number(price),
                    volume:  Number(volume),
                    instId: tradeId,
                    instFamily: symbol
                }
            });
          
        }


        logger.log({
            level: 'info',
            message: JSON.parse(response.toString()),
            additional: 'properties',
            are: 'passed along'
        });
    });
}

function realTimePollingBTC(ws: any) {
    ws.on("open", () => {

        console.log("connected Binance");

        // logger.log({level: 'info', message: "Connected!"})

        // setInterval(() => {
        //     logger.log({level: 'info', message: "Checking Heartbeat"})
        //     ws.send(`"op": "login"}]`);
        // }, 5000);

        ws.send('{"method": "SUBSCRIBE","id": 1,"params":["BTC@trade"]}');

    });

    ws.on("message", async (response: { toString: () => string; }) => {
        console.log(JSON.parse(response.toString()))
        const dataSet = JSON.parse(response.toString());

        const { data } = dataSet;
        if(data){
                const symbol = dataSet.stream.toString().replace(/@trade/g,'');
                const { s: instId, p: price, q: volume, t: tradeId, T: timeStamp} = data
                await prisma.binanceData.create({
                    data: {
                        name: instId, 
                        timeStamp: new Date(timeStamp),
                        price : Number(price),
                        volume:  Number(volume),
                        instId: tradeId,
                        instFamily: symbol
                    }
                });
          
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

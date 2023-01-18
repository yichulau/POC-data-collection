import WebSocket from 'ws';
import { createServer } from "http";
import { Server } from 'socket.io';
import winston from 'winston';
import crypto from 'crypto';
import sha256 from 'crypto-js/sha256';
import hmacSHA512 from 'crypto-js/hmac-sha512';
import Base64 from 'crypto-js/enc-base64';
import { PrismaClient } from '@prisma/client'

export const wsDeribitPolling = {
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
    new winston.transports.File({ filename: './src/routes/Deribit/__logging/info.log' }),
    ],
});

function realTimePolling(ws: any) {
    ws.on("open", () => {

        console.log("connected Deribit");

        logger.log({level: 'info', message: "Connected Deribit!"})

        // setInterval(() => {
        //     logger.log({level: 'info', message: "Checking Heartbeat"})
        //     ws.send(`"op": "login"}]`);
        // }, 5000);

        const  msg = {
            "method": "public/get_last_trades_by_currency",
            "params": {
              "currency": "BTC",
              "kind": "option",
              "count": 10,
              "sorting": "default"
            },
            "jsonrpc": "2.0",
            "id": 3
          };

        ws.send(JSON.stringify(msg));

    });

    ws.on("message", async (response: { toString: () => string; }) => {

        const dataSet = JSON.parse(response.toString());
        const {result } = dataSet;
        const { trades } = result;
        if(trades){
            trades.map(async (obj: any)=>{
                const { instrument_name, price, timestamp, amount, iv, trade_id, index_price} = obj
                const symbol = instrument_name.toString().substring(0,3);
                await prisma.deribitData.create({
                    data: {
                        name: instrument_name, 
                        timeStamp: new Date(timestamp),
                        price : Number(price),
                        volume:  Number(amount),
                        instrument: instrument_name,
                        instFamily: symbol,
                        iv: iv,
                        trade_id: trade_id,
                        markPrice: index_price
                    }
                });
            })
        }


        // logger.log({
        //     level: 'info',
        //     message: JSON.parse(trades),
        //     additional: 'properties',
        //     are: 'passed along'
        // });
    });
}

function getSignature(timestamp : any , method : any , path : any , secret :any) {
    const hashDigest = (timestamp/1000) + method + path;
    const hmacDigest = Base64.stringify(hmacSHA512(hashDigest,secret));
    return hmacDigest;
}

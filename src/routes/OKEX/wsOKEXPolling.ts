import WebSocket from 'ws';
import { createServer } from "http";
import { Server } from 'socket.io';
import winston from 'winston';


export const wsOKEXPolling = {
    realTimePolling
}

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
        console.log("connected");
        logger.log({level: 'info', message: "Connected!"})

        setInterval(() => {
            logger.log({level: 'info', message: "Checking Heartbeat"})
            ws.send('{"op": "subscribe","args": [{"channel": "tickers","instId": "LTC-USD-200327"},{"channel": "candle1m","instId": "LTC-USD-200327"}]}');
        }, 5000);


        ws.send('"type":"subscribe","channels":[ "market_trade"],"currencies":["BTC"],"categories":["option"],"interval": "100ms"');
    });

    ws.on("message", (data: { toString: () => string; }) => {
        console.log(JSON.parse(data.toString()));

          logger.log({
            level: 'info',
            message: JSON.parse(data.toString()),
            additional: 'properties',
            are: 'passed along'
          });
    });
}
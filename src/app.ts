import express, { Application } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { indexRouter } from './routes';
import { openInterestVolRouter } from './routes/OKEX/contracts/openInterestVol';
import { byBitNotional } from './routes/Bybit/notionalVolume';
import { bitIndexNotional } from './routes/Bit/notionalVolume';
import { bitNoOfContracts } from './routes/Bit/numberOfContracts';
import { okexNotional } from './routes/OKEX/notionalVolume';
import { binanceNotional } from './routes/Binance/notionalVolume';
import { deribitNotional } from './routes/Deribit/notionalVolume';
import { okexOpenInterest } from './routes/OKEX/openInterestVolume';
import { binanceOpenInterest } from './routes/Binance/openInterestVolume';
import { deribitOpenInterest } from './routes/Deribit/openInterestVolume';
import { createServer } from "http";
import { Server } from 'socket.io';
import WebSocket from 'ws';
import { wsPolling } from './routes/Bybit/wsPolling';
import { wsBitPolling } from './routes/Bit/wsBitPolling';

const app: Application = express();
const httpServer = createServer(app);
const io = new Server(httpServer);


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({ origin: true }))

// Calling Routes
app.use(indexRouter);

// Bybit
app.use(byBitNotional)

//Bit
app.use(bitIndexNotional)
app.use(bitNoOfContracts);

// OKEX
// app.use(openInterestVolRouter)
app.use(okexNotional)
app.use(okexOpenInterest)

//Binance
app.use(binanceNotional)
app.use(binanceOpenInterest)

//Deribit
app.use(deribitNotional)
app.use(deribitOpenInterest)


// ByBit websocket
const wsByBit = new WebSocket("wss://stream.bytick.com/option/usdc/public/v3");
wsPolling.realTimePolling(wsByBit);

// Bit websocket
// const wsBit = new WebSocket("wss://ws.bit.com");
// wsBitPolling.realTimePolling(wsBit);

// OKEX websocket
// const wsOKEX = new WebSocket("wss://ws.okx.com:8443/ws/v5/public");
// wsBitPolling.realTimePolling(wsOKEX);


export { app };

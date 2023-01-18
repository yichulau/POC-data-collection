"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = require("./routes");
const notionalVolume_1 = require("./routes/Bybit/notionalVolume");
const notionalVolume_2 = require("./routes/Bit/notionalVolume");
const numberOfContracts_1 = require("./routes/Bit/numberOfContracts");
const notionalVolume_3 = require("./routes/OKEX/notionalVolume");
const notionalVolume_4 = require("./routes/Binance/notionalVolume");
const notionalVolume_5 = require("./routes/Deribit/notionalVolume");
const openInterestVolume_1 = require("./routes/OKEX/openInterestVolume");
const openInterestVolume_2 = require("./routes/Binance/openInterestVolume");
const openInterestVolume_3 = require("./routes/Deribit/openInterestVolume");
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const ws_1 = __importDefault(require("ws"));
const wsPolling_1 = require("./routes/Bybit/wsPolling");
const wsBitPolling_1 = require("./routes/Bit/wsBitPolling");
const wsOKEXPolling_1 = require("./routes/OKEX/wsOKEXPolling");
const wsDeribitPolling_1 = require("./routes/Deribit/wsDeribitPolling");
const wsBinancePolling_1 = require("./routes/Binance/wsBinancePolling");
const app = (0, express_1.default)();
exports.app = app;
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer);
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({ origin: true }));
// Calling Routes
app.use(routes_1.indexRouter);
// Bybit
app.use(notionalVolume_1.byBitNotional);
//Bit
app.use(notionalVolume_2.bitIndexNotional);
app.use(numberOfContracts_1.bitNoOfContracts);
// OKEX
// app.use(openInterestVolRouter)
app.use(notionalVolume_3.okexNotional);
app.use(openInterestVolume_1.okexOpenInterest);
//Binance
app.use(notionalVolume_4.binanceNotional);
app.use(openInterestVolume_2.binanceOpenInterest);
//Deribit
app.use(notionalVolume_5.deribitNotional);
app.use(openInterestVolume_3.deribitOpenInterest);
// ByBit websocket
const wsByBit = new ws_1.default("wss://stream.bytick.com/option/usdc/public/v3");
wsPolling_1.wsPolling.realTimePolling(wsByBit);
// Bit websocket
const wsBit = new ws_1.default("wss://ws.bit.com");
wsBitPolling_1.wsBitPolling.realTimePolling(wsBit);
// OKEX websocket
const wsOKEX = new ws_1.default("wss://ws.okx.com:8443/ws/v5/public");
wsOKEXPolling_1.wsOKEXPolling.realTimePolling(wsOKEX);
// Deribit websocket
const wsDeribit = new ws_1.default("wss://www.deribit.com/ws/api/v2");
wsDeribitPolling_1.wsDeribitPolling.realTimePolling(wsDeribit);
// Binance websocket
// const wsBinance = new WebSocket("wss://ws-api.binance.com/ws-api/v3"); obsolete
const wsBinance = new ws_1.default("wss://nbstream.binance.com/eoptions/stream");
wsBinancePolling_1.wsBinancePolling.realTimePollingETH(wsBinance);
wsBinancePolling_1.wsBinancePolling.realTimePollingBTC(wsBinance);
//# sourceMappingURL=app.js.map
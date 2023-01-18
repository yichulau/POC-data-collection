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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wsDeribitPolling = void 0;
const winston_1 = __importDefault(require("winston"));
const hmac_sha512_1 = __importDefault(require("crypto-js/hmac-sha512"));
const enc_base64_1 = __importDefault(require("crypto-js/enc-base64"));
const client_1 = require("@prisma/client");
exports.wsDeribitPolling = {
    realTimePolling
};
const prisma = new client_1.PrismaClient();
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        //
        // - Write all logs with importance level of `error` or less to `error.log`
        // - Write all logs with importance level of `info` or less to `combined.log`
        //
        // new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston_1.default.transports.File({ filename: './src/routes/Deribit/__logging/info.log' }),
    ],
});
function realTimePolling(ws) {
    ws.on("open", () => {
        console.log("connected Deribit");
        logger.log({ level: 'info', message: "Connected Deribit!" });
        // setInterval(() => {
        //     logger.log({level: 'info', message: "Checking Heartbeat"})
        //     ws.send(`"op": "login"}]`);
        // }, 5000);
        const msg = {
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
    ws.on("message", (response) => __awaiter(this, void 0, void 0, function* () {
        const dataSet = JSON.parse(response.toString());
        const { result } = dataSet;
        const { trades } = result;
        if (trades) {
            trades.map((obj) => __awaiter(this, void 0, void 0, function* () {
                const { instrument_name, price, timestamp, amount, iv, trade_id, index_price } = obj;
                const symbol = instrument_name.toString().substring(0, 3);
                yield prisma.deribitData.create({
                    data: {
                        name: instrument_name,
                        timeStamp: new Date(timestamp),
                        price: Number(price),
                        volume: Number(amount),
                        instrument: instrument_name,
                        instFamily: symbol,
                        iv: iv,
                        trade_id: trade_id,
                        markPrice: index_price
                    }
                });
            }));
        }
        // logger.log({
        //     level: 'info',
        //     message: JSON.parse(trades),
        //     additional: 'properties',
        //     are: 'passed along'
        // });
    }));
}
function getSignature(timestamp, method, path, secret) {
    const hashDigest = (timestamp / 1000) + method + path;
    const hmacDigest = enc_base64_1.default.stringify((0, hmac_sha512_1.default)(hashDigest, secret));
    return hmacDigest;
}
//# sourceMappingURL=wsDeribitPolling.js.map
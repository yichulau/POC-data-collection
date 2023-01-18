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
exports.wsOKEXPolling = void 0;
const winston_1 = __importDefault(require("winston"));
const hmac_sha512_1 = __importDefault(require("crypto-js/hmac-sha512"));
const enc_base64_1 = __importDefault(require("crypto-js/enc-base64"));
const client_1 = require("@prisma/client");
exports.wsOKEXPolling = {
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
        new winston_1.default.transports.File({ filename: './src/routes/OKEX/__logging/info.log' }),
    ],
});
function realTimePolling(ws) {
    ws.on("open", () => {
        console.log("connected OKEX");
        logger.log({ level: 'info', message: "Connected!" });
        setInterval(() => {
            logger.log({ level: 'info', message: "Checking Heartbeat" });
            ws.send(`"op": "login"}]`);
        }, 5000);
        ws.send('{"op": "subscribe","args": [{"channel": "option-trades","instType": "OPTION","instFamily": "BTC-USD"}]}');
        ws.send('{"op": "subscribe","args": [{"channel": "option-trades","instType": "OPTION","instFamily": "ETH-USD"}]}');
    });
    ws.on("message", (response) => __awaiter(this, void 0, void 0, function* () {
        const dataSet = JSON.parse(response.toString());
        const { data } = dataSet;
        if (data) {
            data.map((obj) => __awaiter(this, void 0, void 0, function* () {
                const { instId, ts, px, fillVol, tradeId, instFamily } = obj;
                yield prisma.oKEXData.create({
                    data: {
                        name: instId,
                        timeStamp: new Date(),
                        price: Number(px),
                        volume: Number(fillVol),
                        instrument: tradeId.toString(),
                        instFamily: instFamily
                    }
                });
            }));
        }
        logger.log({
            level: 'info',
            message: JSON.parse(response.toString()),
            additional: 'properties',
            are: 'passed along'
        });
    }));
}
function getSignature(timestamp, method, path, secret) {
    const hashDigest = (timestamp / 1000) + method + path;
    const hmacDigest = enc_base64_1.default.stringify((0, hmac_sha512_1.default)(hashDigest, secret));
    return hmacDigest;
}
//# sourceMappingURL=wsOKEXPolling.js.map
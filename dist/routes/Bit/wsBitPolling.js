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
exports.wsBitPolling = void 0;
const winston_1 = __importDefault(require("winston"));
const client_1 = require("@prisma/client");
exports.wsBitPolling = {
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
        new winston_1.default.transports.File({ filename: './src/routes/Bit/__logging/info.log' }),
    ],
});
function realTimePolling(ws) {
    ws.on("open", () => {
        console.log("connected BitCom");
        logger.log({ level: 'info', message: "Connected!" });
        setInterval(() => {
            logger.log({ level: 'info', message: "Checking Heartbeat" });
            ws.send('{"type":"ping","params":{"id":123}}');
        }, 5000);
        ws.send('{"type":"subscribe","channels":[ "market_trade"],"currencies":["BTC"],"categories":["option"],"interval": "100ms"}');
        ws.send('{"type":"subscribe","channels":[ "market_trade"],"currencies":["ETH"],"categories":["option"],"interval": "100ms"}');
    });
    ws.on("message", (response) => {
        console.log(JSON.parse(response.toString()));
        const dataSet = JSON.parse(response.toString());
        const { data, timestamp } = dataSet;
        if (data && data.code !== 0) {
            data.map((obj) => __awaiter(this, void 0, void 0, function* () {
                yield prisma.bitCom.create({
                    data: {
                        name: obj.instrument_id,
                        timeStamp: new Date(timestamp),
                        price: Number(obj.price),
                        volume: Number(obj.sigma),
                        instrument: obj.instrument_id,
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
    });
}
//# sourceMappingURL=wsBitPolling.js.map
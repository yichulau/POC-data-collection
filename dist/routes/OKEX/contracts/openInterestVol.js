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
exports.openInterestVolRouter = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const router = express_1.default.Router();
exports.openInterestVolRouter = router;
router.get('/api/v1/okex/openinterestvol?:timestamp', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const prisma = new client_1.PrismaClient();
    const timestamp = req.query.timestamp; // 1673398487713
    const periodInterval = req.query.periodInterval; // 5m, 1H, 1D
    const currency = req.query.currency; // BTC
    const url = `https://www.okx.com/priapi/v5/rubik/stat/contracts/open-interest-volume?t=${timestamp}&period=${periodInterval}&ccy=${currency}`;
    // Sample Data set : [timestamp, open interest, volume]
    // [
    //     "1673366400000",
    //     "1660754243.5161",
    //     "1306297269.1245"
    // ],
    try {
        const { data: response } = yield axios_1.default.get(url, {
            headers: {
                "Ok-Access-Key": '33b8d81d-9818-41a6-89fd-a2af42f438cd'
            }
        });
        const { data } = response;
        // const storeData = await prisma.user.createMany(data)
        res.json(data);
    }
    catch (err) {
        next(err);
    }
}));
//# sourceMappingURL=openInterestVol.js.map
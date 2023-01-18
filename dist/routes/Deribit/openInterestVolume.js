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
exports.deribitOpenInterest = void 0;
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
exports.deribitOpenInterest = router;
const prisma = new client_1.PrismaClient();
let cache = {};
router.get('/api/v1/deribit/openinterestvol', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const btcOpenInterest = yield getAllOpenInterest("BTC");
    const ethOpenInterest = yield getAllOpenInterest("ETH");
    const { idxPx: BTCSpotValue } = yield getSpotValueAgainstUSDT("BTC-USDT");
    const { idxPx: ETHSpotValue } = yield getSpotValueAgainstUSDT("ETH-USDT");
    const [btcContract, btcVolume] = getLast24HVolume(btcOpenInterest, "BTC", BTCSpotValue);
    const [ethContract, ethVolume] = getLast24HVolume(ethOpenInterest, "ETH", ETHSpotValue);
    const totalOpenInterestVol = btcVolume + ethVolume;
    // await prisma.contract.create({
    //     data: {
    //         premium_volume: 0,
    //         notional_volume: 0,
    //         traded_count: 0,
    //         open_interest: totalOpenInterestVol,
    //         coin: { connect: { id: 4 } },
    //         exchange: { connect: { id: 1 } },
    //     }
    // });
    // await prisma.createContract({
    //     open_interest: data.totalOpenInterestVol,
    //     coin: {connect: {name: 'btc'}},
    //     exchange: {connect: {name: 'deribit'}},
    // });
    res.send({
        btcContract: btcContract,
        btcVolume: btcVolume,
        ethContract: ethContract,
        ethVolume: ethVolume,
        totalOpenInterestVol: btcVolume + ethVolume
    });
}));
function getAllOpenInterest(instFamily) {
    return __awaiter(this, void 0, void 0, function* () {
        // https://www.okx.com/api/v5/public/open-interest?instType=OPTION
        const url = 'https://deribit.com';
        const endpoint = `/api/v2/public/get_book_summary_by_currency`;
        const instType = "option";
        const fullendpoint = url + endpoint + `?currency=${instFamily}&kind=${instType}`;
        console.log("getAllInstruments" + " Calling...." + fullendpoint);
        try {
            const { data: response } = yield axios_1.default.get(fullendpoint);
            const { result } = response;
            return result;
        }
        catch (err) {
            return err;
        }
    });
}
function getSpotValueAgainstUSDT(currency) {
    return __awaiter(this, void 0, void 0, function* () {
        // https://www.okx.com/api/v5/market/index-tickers?instId=BTC-USDT
        const url = 'https://www.okx.com';
        const endpoint = `/api/v5/market/index-tickers`;
        const method = 'GET';
        const currencies = currency;
        const fullendpoint = url + endpoint + `?instId=${currencies}`;
        try {
            const { data: response } = yield axios_1.default.get(fullendpoint);
            const { data } = response;
            const price = data[0];
            return price;
        }
        catch (err) {
            return err;
        }
    });
}
function getLast24HVolume(data, currency, spotVal) {
    let volumeContracts = 0;
    let volumeUSD = 0;
    data.forEach(d => {
        if (d["instrument_name"].includes(currency)) {
            volumeContracts += parseFloat(d["volume"]);
            volumeUSD += parseFloat(d["open_interest"]) * spotVal;
        }
    });
    return [volumeContracts, volumeUSD];
}
//# sourceMappingURL=openInterestVolume.js.map
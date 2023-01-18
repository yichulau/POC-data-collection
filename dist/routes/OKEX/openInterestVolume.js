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
exports.okexOpenInterest = void 0;
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const router = express_1.default.Router();
exports.okexOpenInterest = router;
let cache = {};
router.get('/api/v1/okex/openinterestvols', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { idxPx: BTCSpotValue } = yield getSpotValueAgainstUSDT("BTC-USDT");
    const { idxPx: ETHSpotValue } = yield getSpotValueAgainstUSDT("ETH-USDT");
    const btcOpenInterestVol = yield getAllOpenInterest("BTC-USD");
    const ethOpenInterestVol = yield getAllOpenInterest("ETH-USD");
    const totalOpenInterest = [...btcOpenInterestVol, ...ethOpenInterestVol];
    const [btcContract, btcVolume] = getLast24HVolume(btcOpenInterestVol, "BTC-USD", BTCSpotValue);
    const [ethContract, ethVolume] = getLast24HVolume(ethOpenInterestVol, "ETH-USD", ETHSpotValue);
    res.send({
        btcOpenInterestContract: btcContract,
        btcOpenInterestVolume: btcVolume,
        ethOpenInterestContract: ethContract,
        ethOpenInterestVolume: ethVolume,
        totalOpenInterest: btcVolume + ethVolume
    });
}));
function getAllOpenInterest(instFamily) {
    return __awaiter(this, void 0, void 0, function* () {
        // https://www.okx.com/api/v5/public/open-interest?instType=OPTION
        const url = 'https://www.okx.com';
        const endpoint = '/api/v5/public/open-interest';
        const category = "OPTION";
        const fullendpoint = url + endpoint + `?instType=${category}&instFamily=${instFamily}`;
        console.log("getAllInstruments" + " Calling...." + fullendpoint);
        try {
            const { data: response } = yield axios_1.default.get(fullendpoint);
            const { data } = response;
            return data;
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
        if (d["instId"].includes(currency)) {
            volumeContracts += parseFloat(d["oi"]);
            volumeUSD += parseFloat(d["oiCcy"]) * spotVal; // not found
        }
    });
    return [volumeContracts, volumeUSD];
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
//# sourceMappingURL=openInterestVolume.js.map
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
exports.okexNotional = void 0;
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const router = express_1.default.Router();
exports.okexNotional = router;
let cache = {};
router.get('/api/v1/okex/notional', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { idxPx: BTCSpotValue } = yield getSpotValueAgainstUSDT("BTC-USDT");
    const { idxPx: ETHSpotValue } = yield getSpotValueAgainstUSDT("ETH-USDT");
    const BTCInstruments = yield getAllInstruments("BTC-USD");
    const ETHInstruments = yield getAllInstruments("ETH-USD");
    // const SOLInstruments : any= await getAllInstruments("SOL");  not applicable for sol
    const btcTickers = yield getTickers("BTC-USD");
    const ethTickers = yield getTickers("ETH-USD");
    const [btcContract, btcVolume] = getLast24HVolume(btcTickers, "BTC-USD", BTCSpotValue);
    const [ethContract, ethVolume] = getLast24HVolume(ethTickers, "ETH-USD", ETHSpotValue);
    // const [solContract , solVolume] = getLast24HVolume(tickers, "SOL-USD"); // Not applicable for okex
    res.send({
        btcContract: btcContract,
        btcVolume: btcVolume,
        ethContract: ethContract,
        ethVolume: ethVolume,
        totalNotionalVol: btcVolume + ethVolume
    });
}));
function getAllInstruments(currencies) {
    return __awaiter(this, void 0, void 0, function* () {
        // https://www.okx.com/api/v5/public/instruments?instType=OPTION&instFamily=BTC-USD
        const url = 'https://www.okx.com';
        const endpoint = '/api/v5/public/instruments';
        const method = 'GET';
        const timestamp = Date.now().toString();
        const category = "OPTION";
        const instFamily = currencies;
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
function getTickers(instFamily) {
    return __awaiter(this, void 0, void 0, function* () {
        // https://www.okx.com/api/v5/market/tickers?instType=OPTION&instFamily=BTC-USD
        const url = 'https://www.okx.com';
        const endpoint = `/api/v5/market/tickers`;
        const method = 'GET';
        const category = "OPTION";
        const fullendpoint = url + endpoint + `?instType=${category}&instFamily=${instFamily}`;
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
            volumeContracts += parseFloat(d["vol24h"]);
            volumeUSD += parseFloat(d["volCcy24h"]) * spotVal;
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
//# sourceMappingURL=notionalVolume.js.map
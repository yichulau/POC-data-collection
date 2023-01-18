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
exports.byBitNotional = void 0;
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const router = express_1.default.Router();
exports.byBitNotional = router;
let cache = {};
router.get('/api/v1/bybit/notional', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const BTCInstruments = yield getAllInstruments("BTC");
    const ETHInstruments = yield getAllInstruments("ETH");
    const totalInstruments = [...BTCInstruments, ...ETHInstruments];
    const tickers = yield getTickers(totalInstruments);
    const [btcContract, btcVolume, btcOpenInterest] = getLast24HVolume(tickers, "BTC");
    const [ethContract, ethVolume, etcOpenInterest] = getLast24HVolume(tickers, "ETH");
    res.send({
        btcContract: btcContract,
        btcVolume: btcVolume,
        ethContract: ethContract,
        ethVolume: ethVolume,
        totalNotionalVol: btcVolume + ethVolume,
        totalOpenInterest: btcOpenInterest + etcOpenInterest
    });
}));
function getAllInstruments(baseCoin) {
    return __awaiter(this, void 0, void 0, function* () {
        // https://api.bytick.com/derivatives/v3/public/instruments-info?category=option&baseCoin=BTC
        const url = 'https://api.bytick.com';
        const endpoint = '/derivatives/v3/public/instruments-info';
        const method = 'GET';
        const apiKey = process.env.BYBIT_APIKEY;
        const secret = process.env.BYBIT_SECRET;
        const recvWindow = 5000;
        const timestamp = Date.now().toString();
        const category = "option";
        const underlying = baseCoin; // BTC || ETH
        const params = { "category": category, "baseCoin": underlying };
        const signature = getSignature(timestamp, apiKey, recvWindow, secret);
        const fullendpoint = url + endpoint + `?category=${category}&baseCoin=${underlying}`;
        console.log("InternalTransfer" + " Calling...." + fullendpoint);
        try {
            const { data: response } = yield axios_1.default.get(fullendpoint);
            const { result } = response;
            const { list } = result;
            const instrumentIds = Object.keys(list).length !== 0 ? list.map((instrument) => instrument.symbol) : [];
            return instrumentIds;
        }
        catch (err) {
            return err;
        }
    });
}
function getSignature(timestamp, apiKey, recvWindow, secret) {
    return crypto_1.default.createHmac('sha256', secret).update(timestamp + apiKey + recvWindow).digest('hex');
}
function getTickers(instruments) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = 'https://api.bytick.com';
        const endpoint = `/derivatives/v3/public/tickers`;
        const method = 'GET';
        const category = "option";
        const fullendpoint = url + endpoint;
        let tickers = [];
        function addToTickers(i) {
            return __awaiter(this, void 0, void 0, function* () {
                if (i["status"] === "OFFLINE") {
                    return;
                }
                else {
                    // Check if the result is already in the cache
                    if (cache[i]) {
                        console.log("Data found in cache, returning cached data.");
                        tickers.push(cache[i]);
                    }
                    else {
                        let retries = 0;
                        const retryLimit = 20;
                        const retryDelay = 2000; // 2 seconds
                        while (retries < retryLimit) {
                            try {
                                const { data: response } = yield axios_1.default.get(fullendpoint + `?category=${category}&symbol=${i}`);
                                const { data } = response;
                                tickers.push(data);
                                cache[i] = data;
                                break;
                            }
                            catch (error) {
                                if (error.response.status === 429) {
                                    retries += 1;
                                    console.log(`Encountered a rate limit error. Retrying in ${retryDelay} ms. Retry attempt: ${retries}/${retryLimit}`);
                                    yield new Promise(resolve => setTimeout(resolve, retryDelay));
                                }
                                else {
                                    throw error;
                                }
                            }
                        }
                    }
                }
            });
        }
        let promises = instruments.map((i) => addToTickers(i));
        yield Promise.all(promises);
        return tickers;
    });
}
function getLast24HVolume(data, currency) {
    let volumeContracts = 0;
    let volumeUSD = 0;
    let volumeOpenInterest = 0;
    data.forEach(d => {
        if (d["symbol"].includes(currency)) {
            volumeContracts += parseFloat(d["volume24h"]);
            volumeUSD += parseFloat(d["turnover24h"]);
            volumeOpenInterest += parseFloat(d["openInterest"]);
        }
    });
    return [volumeContracts, volumeUSD, volumeOpenInterest];
}
// notional = turnover24h 
// notional = vol24h*spotVal
//# sourceMappingURL=notionalVolume.js.map
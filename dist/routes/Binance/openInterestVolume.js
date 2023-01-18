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
exports.binanceOpenInterest = void 0;
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const router = express_1.default.Router();
exports.binanceOpenInterest = router;
let cache = {};
router.get('/api/v1/binance/openinterestvols', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const tickers = yield getTickers();
    const btcSpotValue = yield getSpotValue("BTCUSDT");
    const ethSpotValue = yield getSpotValue("ETHUSDT");
    const symbols = tickers.map((item) => item.symbol);
    const btcSymbols = symbols.filter((item) => item.startsWith("BTC"));
    const ethSymbols = symbols.filter((item) => item.startsWith("ETH"));
    const btcSymbolsTime = btcSymbols.map((item) => item.replace("BTC-", "").split("-")[0]);
    const ethSymbolsTime = ethSymbols.map((item) => item.replace("ETH-", "").split("-")[0]);
    const btcUniqueData = [...new Set(btcSymbolsTime)];
    const ethUniqueData = [...new Set(ethSymbolsTime)];
    const btcOpenInterestVol = yield getOpenInterestVolume("BTC", btcUniqueData);
    const ethOpenInterestVol = yield getOpenInterestVolume("ETH", ethUniqueData);
    const [btcContract, btcVolume] = getLast24HVolume(btcOpenInterestVol, "BTC");
    const [ethContract, ethVolume] = getLast24HVolume(ethOpenInterestVol, "ETH");
    res.send({
        btcOpenInterestContract: btcContract,
        btcOpenInterestVolume: btcVolume,
        ethOpenInterestContract: ethContract,
        ethOpenInterestVolume: ethVolume,
        totalOpenInterest: btcVolume + ethVolume
    });
}));
function getOpenInterestVolume(underlyingAsset, expiration) {
    return __awaiter(this, void 0, void 0, function* () {
        // https://eapi.binance.com/eapi/v1/openInterest?underlyingAsset=BTC&expiration=230120
        const url = 'https://eapi.binance.com';
        const endpoint = '/eapi/v1/openInterest';
        const fullendpoint = url + endpoint;
        let tickers = [];
        function addToTickers(i) {
            return __awaiter(this, void 0, void 0, function* () {
                // Check if the result is already in the cache
                if (cache[i]) {
                    console.log("Data found in cache, returning cached data.");
                    tickers.push(...cache[i]);
                }
                else {
                    let retries = 0;
                    const retryLimit = 20;
                    const retryDelay = 2000; // 2 seconds
                    while (retries < retryLimit) {
                        try {
                            const { data: response } = yield axios_1.default.get(fullendpoint + `?underlyingAsset=${underlyingAsset}&expiration=${i}`);
                            tickers.push(...response);
                            cache[i] = response;
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
            });
        }
        let promises = expiration.map((i) => addToTickers(i));
        yield Promise.all(promises);
        return tickers;
    });
}
function getTickers() {
    return __awaiter(this, void 0, void 0, function* () {
        // https://eapi.binance.com/eapi/v1/ticker
        const url = 'https://eapi.binance.com';
        const endpoint = `/eapi/v1/ticker`;
        const fullendpoint = url + endpoint;
        let tickers = [];
        try {
            const { data: response } = yield axios_1.default.get(fullendpoint);
            return response;
        }
        catch (err) {
            return err;
        }
    });
}
function getLast24HVolume(data, currency) {
    let volumeContracts = 0;
    let volumeUSD = 0;
    data.forEach(d => {
        if (d["symbol"].includes(currency)) {
            volumeContracts += parseFloat(d["sumOpenInterest"]);
            volumeUSD += parseFloat(d["sumOpenInterestUsd"]);
        }
    });
    return [volumeContracts, volumeUSD];
}
function getSpotValue(symbol) {
    return __awaiter(this, void 0, void 0, function* () {
        // https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT
        const url = 'https://api.binance.com';
        const endpoint = `/api/v3/ticker/price`;
        const params = symbol;
        const fullendpoint = url + endpoint + `?symbol=${params}`;
        try {
            const { data: response } = yield axios_1.default.get(fullendpoint);
            const { price } = response;
            return price;
        }
        catch (err) {
            return err;
        }
    });
}
//# sourceMappingURL=openInterestVolume.js.map
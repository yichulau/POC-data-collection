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
exports.binanceNotional = void 0;
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const router = express_1.default.Router();
exports.binanceNotional = router;
let cache = {};
router.get('/api/v1/binance/index', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const instruments = yield getAllInstruments();
    const tickers = yield getTickers();
    // const symbols = tickers.map((item :any) => item.symbol);
    // const btcSymbols = symbols.filter((item :any) => item.startsWith("BTC"));
    // const ethSymbols = symbols.filter((item :any) => item.startsWith("ETH"));
    // const btcSymbolsTime = btcSymbols.map((item :any) => item.replace("BTC-", "").split("-")[0]);
    // const ethSymbolsTime = ethSymbols.map((item :any) => item.replace("ETH-", "").split("-")[0]);
    // const btcOpenInterestVol = await getOpenInterestVolume("BTC", btcSymbolsTime)
    // const ethOpenInterestVol = await getOpenInterestVolume("ETH", ethSymbolsTime)
    const btcSpotValue = yield getSpotValue("BTCUSDT");
    const ethSpotValue = yield getSpotValue("ETHUSDT");
    const [btcContract, btcVolume, numberOfContractTradedBTC] = getLast24HVolume(tickers, "BTC", btcSpotValue);
    const [ethContract, ethVolume, numberOfContractTradedETH] = getLast24HVolume(tickers, "ETH", ethSpotValue);
    res.send({
        btcContract: btcContract,
        btcVolume: btcVolume,
        ethContract: ethContract,
        ethVolume: ethVolume,
        totalNotionalVol: btcVolume + ethVolume,
        totalAmountOfContractTraded: numberOfContractTradedBTC + numberOfContractTradedETH
    });
}));
function getOpenInterestVolume(underlyingAsset, expiration) {
    return __awaiter(this, void 0, void 0, function* () {
        // https://eapi.binance.com/eapi/v1/openInterest?underlyingAsset=BTC&expiration=230120
        const url = 'https://eapi.binance.com';
        const endpoint = 'eapi/v1/openInterest';
        const fullendpoint = url + endpoint;
        let tickers = [];
        function addToTickers(i) {
            return __awaiter(this, void 0, void 0, function* () {
                if (i["status"] === "false") {
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
                                const { data: response } = yield axios_1.default.get(fullendpoint + `?underlyingAsset=${underlyingAsset}&expiration=${i}`);
                                tickers.push(response);
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
                }
            });
        }
        let promises = expiration.map((i) => addToTickers(i));
        yield Promise.all(promises);
        return tickers;
    });
}
function getAllInstruments() {
    return __awaiter(this, void 0, void 0, function* () {
        // https://eapi.binance.com/eapi/v1/exchangeInfo
        const url = 'https://eapi.binance.com';
        const endpoint = '/eapi/v1/exchangeInfo';
        const fullendpoint = url + endpoint;
        console.log("getAllInstruments" + " Calling...." + fullendpoint);
        try {
            const { data: response } = yield axios_1.default.get(fullendpoint);
            const { optionSymbols } = response;
            return optionSymbols;
        }
        catch (err) {
            return err;
        }
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
function getLast24HVolume(data, currency, spotVal) {
    let volumeContracts = 0;
    let volumeUSD = 0;
    let amountOfContractTraded = 0;
    data.forEach(d => {
        if (d["symbol"].includes(currency)) {
            volumeContracts += parseFloat(d["volume"]);
            volumeUSD += parseFloat(d["volume"]) * spotVal;
            amountOfContractTraded += parseFloat(d["amount"]);
        }
    });
    return [volumeContracts, volumeUSD, amountOfContractTraded];
}
//# sourceMappingURL=notionalVolume.js.map
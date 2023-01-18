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
exports.deribitNotional = void 0;
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const router = express_1.default.Router();
exports.deribitNotional = router;
let cache = {};
router.get('/api/v1/deribit/index', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const BTCInstruments = yield getAllInstruments("BTC");
    const ETHInstruments = yield getAllInstruments("ETH");
    const SOLInstruments = yield getAllInstruments("SOL");
    const totalInstruments = [...BTCInstruments, ...ETHInstruments, ...SOLInstruments]; // return list of instrument
    const tickers = yield getTickers(totalInstruments);
    const { idxPx: BTCSpotValue } = yield getSpotValueAgainstUSDT("BTC-USDT");
    const { idxPx: ETHSpotValue } = yield getSpotValueAgainstUSDT("ETH-USDT");
    const { idxPx: SOLSpotValue } = yield getSpotValueAgainstUSDT("SOL-USDT");
    const [btcContract, btcVolume] = getLast24HVolume(tickers, "BTC", BTCSpotValue);
    const [ethContract, ethVolume] = getLast24HVolume(tickers, "ETH", ETHSpotValue);
    const [solContract, solVolume] = getLast24HVolume(tickers, "SOL", SOLSpotValue);
    res.send({
        btcContract: btcContract,
        btcVolume: btcVolume,
        ethContract: ethContract,
        ethVolume: ethVolume,
        solContract: solContract,
        solVolume: solVolume,
        totalNotionalVol: btcVolume + ethVolume + solVolume
    });
}));
function getAllInstruments(currencies) {
    return __awaiter(this, void 0, void 0, function* () {
        // https://deribit.com/api/v2/public/get_instruments?currency=BTC&kind=option&expired=false
        const url = 'https://deribit.com';
        const endpoint = '/api/v2/public/get_instruments';
        const method = 'GET';
        const category = 'option';
        const currency = currencies; // BTC || ETH
        const fullendpoint = url + endpoint + `?currency=${currency}&kind=${category}`;
        console.log("getAllInstruments" + " Calling...." + fullendpoint);
        try {
            const { data: response } = yield axios_1.default.get(fullendpoint);
            const { result } = response;
            const instrumentIds = Object.keys(result).length !== 0 ? result.map((instrument) => instrument.instrument_name) : [];
            // const storeData = await prisma.user.createMany(data)
            return instrumentIds;
        }
        catch (err) {
            return err;
        }
    });
}
function getTickers(instruments) {
    return __awaiter(this, void 0, void 0, function* () {
        // https://deribit.com/api/v2/public/ticker?instrument_name=BTC-15JAN23-15000-C
        const url = 'https://deribit.com';
        const endpoint = `/api/v2/public/ticker`;
        const method = 'GET';
        const category = "option";
        const fullendpoint = url + endpoint;
        let tickers = [];
        function addToTickers(i) {
            return __awaiter(this, void 0, void 0, function* () {
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
                            const { data: response } = yield axios_1.default.get(fullendpoint + `?instrument_name=${i}`);
                            const { result } = response;
                            tickers.push(result);
                            cache[i] = result;
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
        let promises = instruments.map((i) => addToTickers(i));
        yield Promise.all(promises);
        return tickers;
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
            if (d.stats.volume !== null) {
                volumeContracts += parseFloat(d.stats.volume);
                volumeUSD += parseFloat(d.stats.volume) * spotVal;
            }
        }
    });
    return [volumeContracts, volumeUSD];
}
//# sourceMappingURL=notionalVolume.js.map
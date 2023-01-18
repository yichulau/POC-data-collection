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
exports.bitNoOfContracts = void 0;
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const router = express_1.default.Router();
exports.bitNoOfContracts = router;
let cache = {};
router.get('/api/v1/bit/contractnumber', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const BTCTradesCall = yield getMarketTrades("BTC", "call");
    const BTCTradesPut = yield getMarketTrades("BTC", "put");
    // const ETHInstruments : any= await getMarketTrades("ETH");
    // const SOLInstruments : any= await getMarketTrades("SOL");
    // const totalInstruments = [...BTCInstruments , ...ETHInstruments , ...SOLInstruments]; 
    // const tickers = await getTickers(totalInstruments);
    // const [btcContract , btcVolume, btcOpenInterestVolume] = getLast24HVolume(tickers, "BTC");
    // const [ethContract , ethVolume, ethOpenInterestVolume] = getLast24HVolume(tickers, "ETH");
    // const [solContract , solVolume, solOpenInterestVolume] = getLast24HVolume(tickers, "SOL");
    // res.send({
    //     btcContract: btcContract,
    //     btcVolume: btcVolume,
    //     btcOpenInterestVolume: btcOpenInterestVolume,
    //     ethContract: ethContract,
    //     ethVolume: ethVolume,
    //     ethOpenInterestVolume: ethOpenInterestVolume,
    //     solContract: solContract,
    //     solVolume: solVolume,
    //     solOpenInterestVolume: solOpenInterestVolume,
    //     noOfContractTraded: tickers.length,
    // })
    console.log(BTCTradesCall.length, BTCTradesPut.length);
    res.send(BTCTradesPut);
}));
function getMarketTrades(currencies, category) {
    return __awaiter(this, void 0, void 0, function* () {
        // https://api.bit.com/v1/market/trades?currency=BTC&category=option&option_type=call&offset=1&limit=100&start_time=1673631501&end_time=1673717901
        const url = 'https://api.bit.com';
        const endpoint = '/v1/market/trades';
        const method = 'GET';
        const startTimeStamp = new Date(new Date().getTime() - (24 * 60 * 60 * 1000)).getTime().toString();
        const currentTimestamp = Date.now().toString();
        const currency = currencies; // BTC || ETH
        const fullendpoint = url + endpoint + `?currency=${currency}&category=option&option_type=${category}&offset=1&limit=100`;
        console.log("getAllInstruments" + " Calling...." + fullendpoint);
        try {
            const { data: response } = yield axios_1.default.get(fullendpoint);
            const { data } = response;
            // const storeData = await prisma.user.createMany(data)
            return data;
        }
        catch (err) {
            return err;
        }
    });
}
function getTickers(instruments) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = 'https://api.bit.com';
        const endpoint = `/v1/tickers`;
        const method = 'GET';
        const category = "option";
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
                                const { data: response } = yield axios_1.default.get(fullendpoint + `?instrument_id=${i}`);
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
        if (d["underlying_name"].includes(currency)) {
            volumeContracts += parseFloat(d["volume24h"]);
            volumeUSD += parseFloat(d["price_change24h"]);
            volumeOpenInterest += parseFloat(d["open_interest"]);
        }
    });
    return [volumeContracts, volumeUSD, volumeOpenInterest];
}
//# sourceMappingURL=numberOfContracts.js.map
import express, { NextFunction, Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';

const router = express.Router();
let cache : any = {};

router.get('/api/v1/binance/openinterestvols', async (req: Request, res: Response, next: NextFunction) => {
    const tickers : any = await getTickers();
    const btcSpotValue = await getSpotValue("BTCUSDT");
    const ethSpotValue = await getSpotValue("ETHUSDT");
    const symbols = tickers.map((item :any) => item.symbol);
    const btcSymbols = symbols.filter((item :any) => item.startsWith("BTC"));
    const ethSymbols = symbols.filter((item :any) => item.startsWith("ETH"));

    const btcSymbolsTime = btcSymbols.map((item :any) => item.replace("BTC-", "").split("-")[0]);
    const ethSymbolsTime = ethSymbols.map((item :any) => item.replace("ETH-", "").split("-")[0]);
    const btcUniqueData = [...new Set(btcSymbolsTime)];
    const ethUniqueData = [...new Set(ethSymbolsTime)];

    const btcOpenInterestVol = await getOpenInterestVolume("BTC", btcUniqueData)
    const ethOpenInterestVol = await getOpenInterestVolume("ETH", ethUniqueData)

    

    const [btcContract , btcVolume] = getLast24HVolume(btcOpenInterestVol, "BTC" )
    const [ethContract , ethVolume] = getLast24HVolume(ethOpenInterestVol, "ETH" )

    res.send({
        btcOpenInterestContract: btcContract,
        btcOpenInterestVolume: btcVolume,
        ethOpenInterestContract: ethContract,
        ethOpenInterestVolume:ethVolume,
        totalOpenInterest : btcVolume + ethVolume
    })
}); 


async function getOpenInterestVolume(underlyingAsset: string, expiration: any){
    // https://eapi.binance.com/eapi/v1/openInterest?underlyingAsset=BTC&expiration=230120
    const url = 'https://eapi.binance.com';
    const endpoint = '/eapi/v1/openInterest';
    const fullendpoint = url + endpoint;
    let tickers: any[] = [];

    async function addToTickers(i: any) {
        // Check if the result is already in the cache
        if (cache[i]) {
            console.log("Data found in cache, returning cached data.");
            tickers.push(...cache[i]);
        } else {
            let retries = 0;
            const retryLimit = 20;
            const retryDelay = 2000; // 2 seconds
            while (retries < retryLimit) {
                try {
                    const { data : response } = await axios.get(fullendpoint + `?underlyingAsset=${underlyingAsset}&expiration=${i}`);
                    tickers.push(...response);
                    cache[i] = response;
                    break;
                } catch (error : any) {
                    if (error.response.status === 429) {
                        retries += 1;
                        console.log(`Encountered a rate limit error. Retrying in ${retryDelay} ms. Retry attempt: ${retries}/${retryLimit}`);
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                    } else {
                        throw error;
                    }
                }
            }
        }
    }

    let promises = expiration.map((i: any) => addToTickers(i));
    await Promise.all(promises);

    return tickers;
}



async function getTickers() {
    // https://eapi.binance.com/eapi/v1/ticker
    const url = 'https://eapi.binance.com';
    const endpoint = `/eapi/v1/ticker`;
    const fullendpoint = url + endpoint;
    let tickers: any[] = [];

    try {
        const { data : response } = await axios.get(fullendpoint);
        return response;
    }
    catch (err) {
    return err
    }
}



function getLast24HVolume(data :any[], currency:string) : [number,number] {
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

async function getSpotValue(symbol: String){
    // https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT
    const url = 'https://api.binance.com';
    const endpoint = `/api/v3/ticker/price`;
    const params = symbol
    const fullendpoint = url + endpoint + `?symbol=${params}`;

    try {
        const { data : response } = await axios.get(fullendpoint);
        const { price } = response
        return price;
    }
    catch (err) {
    return err
    }
}



export { router as binanceOpenInterest };
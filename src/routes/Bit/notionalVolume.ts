import express, { NextFunction, Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';

const router = express.Router();
let cache : any = {};

router.get('/api/v1/bit/index', async (req: Request, res: Response, next: NextFunction) => {
    const {idxPx: BTCSpotValue} : any = await getSpotValueAgainstUSDT("BTC-USDT");
    const {idxPx: ETHSpotValue}: any = await getSpotValueAgainstUSDT("ETH-USDT");
    const {idxPx: SOLSpotValue}: any = await getSpotValueAgainstUSDT("SOL-USDT");
    const BTCInstruments : any = await getAllInstruments("BTC");
    const ETHInstruments : any= await getAllInstruments("ETH");
    const SOLInstruments : any= await getAllInstruments("SOL");
    const totalInstruments = [...BTCInstruments , ...ETHInstruments , ...SOLInstruments]; // return list of instrument
    
    const tickers = await getTickers(totalInstruments);
    
    const [btcContract , btcVolume, btcOpenInterestVolume] = getLast24HVolume(tickers, "BTC",BTCSpotValue);
    const [ethContract , ethVolume, ethOpenInterestVolume] = getLast24HVolume(tickers, "ETH", ETHSpotValue);
    const [solContract , solVolume, solOpenInterestVolume] = getLast24HVolume(tickers, "SOL", SOLSpotValue);
    res.send({
        btcContract: btcContract,
        btcVolume: btcVolume,
        btcOpenInterestVolume: btcOpenInterestVolume,
        ethContract: ethContract,
        ethVolume: ethVolume,
        ethOpenInterestVolume: ethOpenInterestVolume,
        solContract: solContract,
        solVolume: solVolume,
        solOpenInterestVolume: solOpenInterestVolume,
        noOfContractTraded: tickers.length,
        totalOpenInterestVolume: btcOpenInterestVolume + ethOpenInterestVolume + solOpenInterestVolume
    })
}); 


async function getAllInstruments(currencies: String) {
       // https://api.bit.com/v1/instruments?currency=BTC&category=option&active=true
       const url = 'https://api.bit.com';
       const endpoint = '/v1/instruments';
       const method = 'GET'
       const timestamp = Date.now().toString();
       const category = "option";
       const currency = currencies; // BTC || ETH
       const fullendpoint = url + endpoint + `?currency=${currency}&category=${category}&active=true`;
   
       console.log("getAllInstruments" + " Calling...." + fullendpoint);
   
       try {
           const { data : response } = await axios.get(fullendpoint);
           const { data } = response
           const instrumentIds: string[] = Object.keys(data).length !== 0 ? data.map((instrument: {instrument_id:string}) => instrument.instrument_id) : [];
      
           // const storeData = await prisma.user.createMany(data)
           return instrumentIds
         }
         catch (err) {
           return err
         }
}



async function getTickers(instruments: any[]) {
    
    const url = 'https://api.bit.com';
    const endpoint = `/v1/tickers`;
    const method = 'GET'
    const category = "option";
    const fullendpoint = url + endpoint;
    let tickers: any[] = [];

    async function addToTickers(i: any) {
        if (i["status"] === "false") {
          return;
        } else {
            // Check if the result is already in the cache
            if (cache[i]) {
                console.log("Data found in cache, returning cached data.");
                tickers.push(cache[i]);
            } else {
                let retries = 0;
                const retryLimit = 20;
                const retryDelay = 2000; // 2 seconds
                while (retries < retryLimit) {
                    try {
                        const { data : response } = await axios.get(fullendpoint + `?instrument_id=${i}`);
                        const { data } = response
                        tickers.push(data);
                        cache[i] = data;
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
    }

    let promises = instruments.map((i: any) => addToTickers(i));
    await Promise.all(promises);

    return tickers;
}



function getLast24HVolume(data :any[], currency:string, spotVal: number) : [number,number,number] {
    let volumeContracts = 0;
    let volumeUSD = 0;
    let volumeOpenInterest = 0;

    data.forEach(d => {
        if (d["underlying_name"].includes(currency)) {
            volumeContracts += parseFloat(d["volume24h"]);
            volumeUSD += parseFloat(d["price_change24h"]);
            volumeOpenInterest += parseFloat(d["open_interest"])*spotVal;
        }
    });

    return [volumeContracts, volumeUSD, volumeOpenInterest];
}


async function getSpotValueAgainstUSDT(currency: String){
    // https://www.okx.com/api/v5/market/index-tickers?instId=BTC-USDT
    const url = 'https://www.okx.com';
    const endpoint = `/api/v5/market/index-tickers`;
    const method = 'GET'
    const currencies = currency;
    const fullendpoint = url + endpoint + `?instId=${currencies}`;

    try {
        const { data : response } = await axios.get(fullendpoint);
        const { data } = response
        const price = data[0]

        return price
      }
    catch (err) {
        return err
    }

}


export { router as bitIndexNotional };
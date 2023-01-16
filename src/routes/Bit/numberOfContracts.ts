import express, { NextFunction, Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';

const router = express.Router();
let cache : any = {};

router.get('/api/v1/bit/contractnumber', async (req: Request, res: Response, next: NextFunction) => {
   
    const BTCTradesCall : any = await getMarketTrades("BTC", "call");
    const BTCTradesPut : any = await getMarketTrades("BTC", "put");
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
    console.log(BTCTradesCall.length, BTCTradesPut.length)
    res.send(BTCTradesPut)
}); 


async function getMarketTrades(currencies: String, category: String) {
        // https://api.bit.com/v1/market/trades?currency=BTC&category=option&option_type=call&offset=1&limit=100&start_time=1673631501&end_time=1673717901
       const url = 'https://api.bit.com';
       const endpoint = '/v1/market/trades';
       const method = 'GET'
       const startTimeStamp = new Date(new Date(). getTime() - (24 * 60 * 60 * 1000)).getTime().toString();
       const currentTimestamp = Date.now().toString();
       const currency = currencies; // BTC || ETH
       const fullendpoint = url + endpoint + `?currency=${currency}&category=option&option_type=${category}&offset=1&limit=100`;

       console.log("getAllInstruments" + " Calling...." + fullendpoint);
   
       try {
           const { data : response } = await axios.get(fullendpoint);
           const { data } = response
           
      
           // const storeData = await prisma.user.createMany(data)
           return data
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



function getLast24HVolume(data :any[], currency:string) : [number,number,number] {
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



export { router as bitNoOfContracts };
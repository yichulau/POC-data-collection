import express, { NextFunction, Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();
let cache : any = {};

router.get('/api/v1/deribit/index', async (req: Request, res: Response, next: NextFunction) => {
    const BTCInstruments : any = await getAllInstruments("BTC");
    const ETHInstruments : any= await getAllInstruments("ETH");
    const SOLInstruments : any= await getAllInstruments("SOL");
    const totalInstruments = [...BTCInstruments , ...ETHInstruments , ...SOLInstruments]; // return list of instrument

    const tickers = await getTickers(totalInstruments);

    const {idxPx: BTCSpotValue} : any = await getSpotValueAgainstUSDT("BTC-USDT");
    const {idxPx: ETHSpotValue}: any = await getSpotValueAgainstUSDT("ETH-USDT");
    const {idxPx: SOLSpotValue} = await getSpotValueAgainstUSDT("SOL-USDT");

    const [btcContract , btcVolume] = getLast24HVolume(tickers, "BTC", BTCSpotValue);
    const [ethContract , ethVolume] = getLast24HVolume(tickers, "ETH", ETHSpotValue);
    const [solContract , solVolume] = getLast24HVolume(tickers, "SOL", SOLSpotValue);

    if(btcVolume && ethVolume){
        // BTC
        await prisma.volumeNotional.create({
            data: {
                coinCurrencyID: 1,
                exchangeID: 4,
                timestamp: new Date(),
                timeIntervalId: 1,
                value: btcVolume
    
            }
        });
        // ETH
        await prisma.volumeNotional.create({
            data: {
                coinCurrencyID: 2,
                exchangeID: 4,
                timestamp: new Date(),
                timeIntervalId: 1,
                value: ethVolume
    
            }
        });
    } 

    res.send({
        btcContract: btcContract,
        btcVolume: btcVolume,
        ethContract: ethContract,
        ethVolume: ethVolume,
        solContract: solContract,
        solVolume: solVolume,
        totalNotionalVol: btcVolume + ethVolume + solVolume
    })
}); 


async function getAllInstruments(currencies: String) {
       // https://deribit.com/api/v2/public/get_instruments?currency=BTC&kind=option&expired=false
       const url = 'https://deribit.com';
       const endpoint = '/api/v2/public/get_instruments';
       const method = 'GET'
       const category = 'option'
       const currency = currencies; // BTC || ETH
       const fullendpoint = url + endpoint + `?currency=${currency}&kind=${category}`;
   
       console.log("getAllInstruments" + " Calling...." + fullendpoint);
   
       try {
           const { data : response } = await axios.get(fullendpoint);
           const { result } = response
        
           const instrumentIds: string[] = Object.keys(result).length !== 0 ? result.map((instrument: {instrument_name:string}) => instrument.instrument_name) : [];
           // const storeData = await prisma.user.createMany(data)
           return instrumentIds
         }
         catch (err) {
           return err
         }
}



async function getTickers(instruments: any[]) {
    // https://deribit.com/api/v2/public/ticker?instrument_name=BTC-15JAN23-15000-C
    const url = 'https://deribit.com';
    const endpoint = `/api/v2/public/ticker`;
    const method = 'GET'
    const category = "option";
    const fullendpoint = url + endpoint;
    let tickers: any[] = [];

    async function addToTickers(i: any) {

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
                        const { data : response } = await axios.get(fullendpoint + `?instrument_name=${i}`);
                        const { result } = response
                        tickers.push(result);
                        cache[i] = result;
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

    let promises = instruments.map((i: any) => addToTickers(i));
    await Promise.all(promises);

    return tickers;
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


function getLast24HVolume(data :any[], currency:string, spotVal: number) : [number,number] {
    let volumeContracts = 0;
    let volumeUSD = 0;

    data.forEach(d => {
        if (d["instrument_name"].includes(currency)) {
            if(d.stats.volume!==null){
                volumeContracts += parseFloat(d.stats.volume);
                volumeUSD += parseFloat(d.stats.volume)*spotVal;
            }

        }
    });
    return [volumeContracts, volumeUSD];
}



export { router as deribitNotional };
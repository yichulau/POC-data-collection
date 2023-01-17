import express, { NextFunction, Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';

const router = express.Router();
let cache : any = {};

router.get('/api/v1/okex/notional', async (req: Request, res: Response, next: NextFunction) => {
    const {idxPx: BTCSpotValue} : any = await getSpotValueAgainstUSDT("BTC-USDT");
    const {idxPx: ETHSpotValue}: any = await getSpotValueAgainstUSDT("ETH-USDT");
    const BTCInstruments : any = await getAllInstruments("BTC-USD");
    const ETHInstruments : any= await getAllInstruments("ETH-USD");
    // const SOLInstruments : any= await getAllInstruments("SOL");  not applicable for sol

    const btcTickers = await getTickers("BTC-USD");
    const ethTickers = await getTickers("ETH-USD");

    const [btcContract , btcVolume] = getLast24HVolume(btcTickers, "BTC-USD", BTCSpotValue);
    const [ethContract , ethVolume] = getLast24HVolume(ethTickers, "ETH-USD", ETHSpotValue);
    // const [solContract , solVolume] = getLast24HVolume(tickers, "SOL-USD"); // Not applicable for okex
    res.send({
        btcContract: btcContract,
        btcVolume: btcVolume,
        ethContract: ethContract,
        ethVolume: ethVolume,
        totalNotionalVol : btcVolume+ethVolume
    })
}); 


async function getAllInstruments(currencies: String) {
       // https://www.okx.com/api/v5/public/instruments?instType=OPTION&instFamily=BTC-USD
       const url = 'https://www.okx.com';
       const endpoint = '/api/v5/public/instruments';
       const method = 'GET'
       const timestamp = Date.now().toString();
       const category = "OPTION";
       const instFamily = currencies;
       const fullendpoint = url + endpoint + `?instType=${category}&instFamily=${instFamily}`;
   
       console.log("getAllInstruments" + " Calling...." + fullendpoint);
   
       try {
           const { data : response } = await axios.get(fullendpoint);
           const { data } = response
           
           return data
         }
         catch (err) {
           return err
         }
}



async function getTickers(instFamily: String) {
        // https://www.okx.com/api/v5/market/tickers?instType=OPTION&instFamily=BTC-USD
    const url = 'https://www.okx.com';
    const endpoint = `/api/v5/market/tickers`;
    const method = 'GET'
    const category = "OPTION";
    const fullendpoint = url + endpoint + `?instType=${category}&instFamily=${instFamily}`;

    try {
        const { data : response } = await axios.get(fullendpoint);
        const { data } = response
        
        return data
      }
    catch (err) {
        return err
    }

}



function getLast24HVolume(data :any[], currency:string, spotVal: number) : [number,number] {
    let volumeContracts = 0;
    let volumeUSD = 0;

    data.forEach(d => {
        if (d["instId"].includes(currency)) {
            volumeContracts += parseFloat(d["vol24h"]);
            volumeUSD += parseFloat(d["volCcy24h"])*spotVal; 
        }
    });

    return [volumeContracts, volumeUSD];
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



export { router as okexNotional };
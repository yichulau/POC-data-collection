import express, { NextFunction, Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();
let cache : any = {};

router.get('/api/v1/okex/openinterestvols', async (req: Request, res: Response, next: NextFunction) => {
    const {idxPx: BTCSpotValue} : any = await getSpotValueAgainstUSDT("BTC-USDT");
    const {idxPx: ETHSpotValue}: any = await getSpotValueAgainstUSDT("ETH-USDT");
    const btcOpenInterestVol = await getAllOpenInterest("BTC-USD");
    const ethOpenInterestVol = await getAllOpenInterest("ETH-USD");
    const totalOpenInterest = [...btcOpenInterestVol, ...ethOpenInterestVol]

    const [btcContract , btcVolume] = getLast24HVolume(btcOpenInterestVol, "BTC-USD", BTCSpotValue)
    const [ethContract , ethVolume] = getLast24HVolume(ethOpenInterestVol, "ETH-USD", ETHSpotValue)

    if(btcVolume && ethVolume){
        // BTC
        await prisma.openInterest.create({
            data: {
                coinCurrencyID: 1,
                exchangeID: 5,
                timestamp: new Date(),
                timeIntervalId: 1,
                value: btcVolume
    
            }
        });
        // ETH
        await prisma.openInterest.create({
            data: {
                coinCurrencyID: 2,
                exchangeID: 5,
                timestamp: new Date(),
                timeIntervalId: 1,
                value: ethVolume
    
            }
        });
    } 


    res.send({
        btcOpenInterestContract: btcContract,
        btcOpenInterestVolume: btcVolume,
        ethOpenInterestContract: ethContract,
        ethOpenInterestVolume:ethVolume,
        totalOpenInterest : btcVolume + ethVolume
    })
}); 

async function getAllOpenInterest(instFamily: String){
    // https://www.okx.com/api/v5/public/open-interest?instType=OPTION
    const url = 'https://www.okx.com';
    const endpoint = '/api/v5/public/open-interest';
    const category = "OPTION";
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


function getLast24HVolume(data :any[], currency:string, spotVal: number) : [number,number] {
    let volumeContracts = 0;
    let volumeUSD = 0;

    data.forEach(d => {
        if (d["instId"].includes(currency)) {
            volumeContracts += parseFloat(d["oi"]);
            volumeUSD += parseFloat(d["oiCcy"])*spotVal; // not found
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



export { router as okexOpenInterest };
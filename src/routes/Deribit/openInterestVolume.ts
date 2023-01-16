import express, { NextFunction, Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { dbConnect } from '../../db';
import { PrismaClient } from '@prisma/client'


const router = express.Router();
const prisma = new PrismaClient()
let cache : any = {};

router.get('/api/v1/deribit/openinterestvol', async (req: Request, res: Response, next: NextFunction) => {
    const btcOpenInterest = await getAllOpenInterest("BTC");
    const ethOpenInterest = await getAllOpenInterest("ETH");
    const {idxPx: BTCSpotValue} : any = await getSpotValueAgainstUSDT("BTC-USDT");
    const {idxPx: ETHSpotValue}: any = await getSpotValueAgainstUSDT("ETH-USDT");

    const [btcContract , btcVolume] = getLast24HVolume(btcOpenInterest, "BTC",BTCSpotValue);
    const [ethContract , ethVolume] = getLast24HVolume(ethOpenInterest, "ETH", ETHSpotValue);

    const totalOpenInterestVol = btcVolume + ethVolume;
    
    // await prisma.contract.create({
    //     data: {
    //         premium_volume: 0,
    //         notional_volume: 0,
    //         traded_count: 0,
    //         open_interest: totalOpenInterestVol,
    //         coin: { connect: { id: 4 } },
    //         exchange: { connect: { id: 1 } },
    //     }
    // });
    







    // await prisma.createContract({
    //     open_interest: data.totalOpenInterestVol,
    //     coin: {connect: {name: 'btc'}},
    //     exchange: {connect: {name: 'deribit'}},
    // });
    
    res.send({
        btcContract: btcContract,
        btcVolume: btcVolume,
        ethContract: ethContract,
        ethVolume: ethVolume,
        totalOpenInterestVol: btcVolume + ethVolume 
    })
}); 

async function getAllOpenInterest(instFamily: String){
    // https://www.okx.com/api/v5/public/open-interest?instType=OPTION
    const url = 'https://deribit.com';
    const endpoint = `/api/v2/public/get_book_summary_by_currency`;
    const instType = "option"
    const fullendpoint = url + endpoint + `?currency=${instFamily}&kind=${instType}`;

    console.log("getAllInstruments" + " Calling...." + fullendpoint);

    
    try {
        const { data : response } = await axios.get(fullendpoint);
        const { result } = response
        
        return result
    }
    catch (err) {
        return err
    }
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

            volumeContracts += parseFloat(d["volume"]);
            volumeUSD += parseFloat(d["open_interest"])*spotVal;
    

        }
    });
    return [volumeContracts, volumeUSD];
}



export { router as deribitOpenInterest };
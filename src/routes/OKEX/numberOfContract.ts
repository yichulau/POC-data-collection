import express, { NextFunction, Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();
let cache : any = {};

router.get('/api/v1/okex/numberofcontract', async (req: Request, res: Response, next: NextFunction) => {
    
    let Day = Date.now() - (24 * 60 * 60 * 1000);
    let lastDay = new Date(Day).toISOString();


    // if(btcVolume && ethVolume){
    //     // BTC
    //     await prisma.volumeNotional.create({
    //         data: {
    //             coinCurrencyID: 1,
    //             exchangeID: 5,
    //             timestamp: new Date(),
    //             timeIntervalId: 1,
    //             value: btcVolume
    
    //         }
    //     });
    //     // ETH
    //     await prisma.volumeNotional.create({
    //         data: {
    //             coinCurrencyID: 2,
    //             exchangeID: 5,
    //             timestamp: new Date(),
    //             timeIntervalId: 1,
    //             value: ethVolume
    
    //         }
    //     });
    // } 

    // res.send({
    //     btcContract: btcContract,
    //     btcVolume: btcVolume,
    //     ethContract: ethContract,
    //     ethVolume: ethVolume,
    //     totalNotionalVol : btcVolume+ethVolume
    // })
}); 






export { router as okexNumberOfContract };
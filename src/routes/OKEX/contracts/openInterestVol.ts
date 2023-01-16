import express, { NextFunction, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client'
import axios from 'axios';

const router = express.Router();

router.get('/api/v1/okex/openinterestvol?:timestamp', async (req: Request, res: Response, next: NextFunction) => {
    const prisma = new PrismaClient();
    const timestamp = req.query.timestamp; // 1673398487713
    const periodInterval = req.query.periodInterval; // 5m, 1H, 1D
    const currency = req.query.currency // BTC

    const url = `https://www.okx.com/priapi/v5/rubik/stat/contracts/open-interest-volume?t=${timestamp}&period=${periodInterval}&ccy=${currency}`;
    
    // Sample Data set : [timestamp, open interest, volume]
    // [
    //     "1673366400000",
    //     "1660754243.5161",
    //     "1306297269.1245"
    // ],
    try {
        const { data : response } = await axios.get(url,{
            headers: {
                "Ok-Access-Key" : '33b8d81d-9818-41a6-89fd-a2af42f438cd'
            }
        });
        const { data } = response
        // const storeData = await prisma.user.createMany(data)

        res.json(data)
      }
      catch (err) {
        next(err)
      }
});

export { router as openInterestVolRouter };
import express, { NextFunction, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client'
import axios from 'axios';

const router = express.Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    const prisma = new PrismaClient();

    try {
        const { data : response } = await axios.get("https://www.oklink.com/api/v5/explorer/blockchain/summary",{
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

export { router as indexRouter };
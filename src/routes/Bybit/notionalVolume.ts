import express, { NextFunction, Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';

const router = express.Router();
let cache : any = {};
router.get('/api/v1/bybit/notional', async (req: Request, res: Response, next: NextFunction) => {
    
  const BTCInstruments : any = await getAllInstruments("BTC")
  const ETHInstruments : any = await getAllInstruments("ETH")
  const totalInstruments = [...BTCInstruments , ...ETHInstruments];

  const tickers = await getTickers(totalInstruments)
  const [btcContract , btcVolume, btcOpenInterest ] = getLast24HVolume(tickers, "BTC");
  const [ethContract , ethVolume, etcOpenInterest ] = getLast24HVolume(tickers, "ETH");

  res.send({
    btcContract: btcContract,
    btcVolume: btcVolume,
    ethContract: ethContract,
    ethVolume: ethVolume,
    totalNotionalVol : btcVolume + ethVolume,
    totalOpenInterest: btcOpenInterest+ etcOpenInterest

})
}); 


async function getAllInstruments(baseCoin: String) {
  // https://api.bytick.com/derivatives/v3/public/instruments-info?category=option&baseCoin=BTC
  const url = 'https://api.bytick.com';
  const endpoint = '/derivatives/v3/public/instruments-info';
  const method = 'GET'
  const apiKey = process.env.BYBIT_APIKEY;
  const secret = process.env.BYBIT_SECRET;
  const recvWindow = 5000;
  const timestamp = Date.now().toString();
  const category = "option";
  const underlying = baseCoin; // BTC || ETH
  const params={"category": category, "baseCoin": underlying}
  const signature = getSignature(timestamp, apiKey , recvWindow, secret)
  const fullendpoint = url + endpoint + `?category=${category}&baseCoin=${underlying}`;

  console.log("InternalTransfer" + " Calling...." + fullendpoint);
  try {
      const { data : response } = await axios.get(fullendpoint);
      const { result } = response
      const { list } = result
      const instrumentIds: string[] = Object.keys(list).length !== 0 ? list.map((instrument: {symbol:string}) => instrument.symbol) : [];

      return instrumentIds
    }
    catch (err) {
      return err
    }
}


function getSignature(timestamp : any , apiKey : any , recvWindow : any ,  secret :any) {
    return crypto.createHmac('sha256', secret).update(timestamp + apiKey + recvWindow ).digest('hex');
}


async function getTickers(instruments: any[]) {
    
  const url = 'https://api.bytick.com';
  const endpoint = `/derivatives/v3/public/tickers`;
  const method = 'GET'
  const category = "option";
  const fullendpoint = url + endpoint;
  let tickers: any[] = [];

  async function addToTickers(i: any) {
      if (i["status"] === "OFFLINE") {
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
                      const { data : response } = await axios.get(fullendpoint + `?category=${category}&symbol=${i}`);
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

function getLast24HVolume(data :any[], currency:string) : [number,number, number] {
  let volumeContracts = 0;
  let volumeUSD = 0;
  let volumeOpenInterest = 0;

  data.forEach(d => { 
      if (d["symbol"].includes(currency)) {
          volumeContracts += parseFloat(d["volume24h"]);
          volumeUSD += parseFloat(d["turnover24h"]);
          volumeOpenInterest += parseFloat(d["openInterest"])
      }
  });

  return [volumeContracts, volumeUSD, volumeOpenInterest];
}


export { router as byBitNotional };


// notional = turnover24h 
// notional = vol24h*spotVal
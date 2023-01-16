import { app } from './app';
import * as dotenv from "dotenv";
import { createServer } from "http";
import { Server } from 'socket.io';
import WebSocket from 'ws';

dotenv.config();

const start = async () => {

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
        console.log(`Server is running on PORT ${PORT}`)
    })
}


start();


import mysql from 'mysql2';

const connectionString = process.env.DATABASE_URL || '';
const connection = mysql.createConnection(connectionString);

export const dbConnect = {
    createDBConnection
};

function createDBConnection(){
    return mysql.createConnection(connectionString);
}
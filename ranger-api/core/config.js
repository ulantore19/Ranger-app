require('dotenv').config();


const frameDestination = 'public/frames';

const server = {
    hostname: process.env.BASE_HOSTNAME || 'http://localhost',
    ip: process.env.IP || '0.0.0.0',
    port: process.env.PORT || '3000',
};

const token = {
    secret: process.env.TOKEN_SECRET || '!!!IMPORTANT: WHOEVER READ THIS PLEASE CHANGE IT IN ENV VARIABLES',
    expirationInSec: parseInt(process.env.TOKEN_EXPIRATION_IN_SEC, 10) || -1,
};

const database = {
    name:  process.env.DB_NAME || 'ranger_db',
    connectionURI: process.env.DB_CONNECTION_URI || '',
};


module.exports = {
    server,
    token,
    database,
    frameDestination,
};
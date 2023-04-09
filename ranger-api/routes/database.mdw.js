const { DatabaseFactory } = require('../database');
const config = require('../core/config');

async function addDatabaseMdw(req, res, next) {
    const { dbConnectionURI, name: dbName } = config.database;
    const database = await DatabaseFactory.getInstance(dbConnectionURI, dbName);
    req.database = database;
    next();
}


module.exports = {
    addDatabaseMdw
}
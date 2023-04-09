const { MongoClient } = require("mongodb");
class Database {
    constructor(uri){
        this.uri = uri;
        this.client = new MongoClient(uri);
    }

    async connect(){
        await this.client.connect();
        await this.client.db('admin').command({ ping: 1 });
    }

    async getDatabaseObj(databaseName) {
        return {
            connection: this.client,
            database: this.client.db(databaseName)
        }
    }
}

class DatabaseFactory {
    constructor() {
        throw new Error('Use DatabaseFactory.getInstance()');
    }
    static async getInstance(uri, databaseName) {
        if (!DatabaseFactory.database) {
           await DatabaseFactory.init(uri);
        }
        return DatabaseFactory.database.getDatabaseObj(databaseName);
        
    }

    static async init(uri) {
        console.log('Initializing database...');
        DatabaseFactory.database  = new Database(uri);
        await DatabaseFactory.database.connect();
        console.log('Connected to a database!');
    }
}

module.exports = {
    Database,
    DatabaseFactory
}
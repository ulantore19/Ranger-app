const  BaseError = require('./base.error');

class DatabaseError extends BaseError {
    constructor(message, data) {
        super(message, data);
        this.status = 500;
    }
}

module.exports = DatabaseError;
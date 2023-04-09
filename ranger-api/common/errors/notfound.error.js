const  BaseError = require('./base.error');

class NotFoundError extends BaseError {
    constructor(message, data) {
        super(message, data);
        this.status = 404;
    }
}

module.exports = NotFoundError;
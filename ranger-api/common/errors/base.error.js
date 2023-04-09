const { template } = require('lodash');

class BaseError extends Error {
    constructor(message, data) {
        let compiledMsg = message;
        if (data) {
            const compile = template(compiledMsg);
            compiledMsg = compile(data);
        }
        super(compiledMsg);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
        this.status = 500;
        this.isCustomError = true;
    }

    toJSON() {
        return {
            error: {
                message: this.message,
                status: this.status,
            }
        }
    }
}

module.exports = BaseError;
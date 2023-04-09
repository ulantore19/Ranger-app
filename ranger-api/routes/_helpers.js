const { DocumentService } = require('../services/document_service');
const { COLLECTION_NAMES } = require('../common/enums');
const { DeviceEventEntity } = require('../entities');

function adaptRequest (req) {
    const { body, query, params, headers, database, user} = req;
    return {
        body,
        query,
        params,
        user,
        database,
        headers,
    };
}

async function getEntity({ database, collectionName, user }) {
    const documentService = new DocumentService(database, collectionName, user);
    switch (collectionName) {
        case COLLECTION_NAMES.DEVICE_EVENT:
        default:
            return new DeviceEventEntity({ user, documentService });
    }
}

module.exports = {
    adaptRequest,
    getEntity
}
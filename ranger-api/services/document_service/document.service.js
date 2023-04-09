
const { ObjectId } = require('mongodb');
const { isArray, map, forEach, has, isString } = require('lodash');

class BaseDocumentService {
    constructor(database, collectionName, user) {
        this.user = user || {};
        this.database = database.database;
        this.connection = database.connection;
        this.collectionName = collectionName;
    }

    _wrapFieldsWithObjectId(entity) {
        const fieldsToWrapWithObjectId = [
            '_id',
        ];

        const wrap = (ent) => {
            const wrappedFields = {};
            forEach(fieldsToWrapWithObjectId, field => {
                if (has(ent, field)) {
                    const fieldValue = ent[field];
                    wrappedFields[field] = isString(fieldValue) ? new ObjectId(fieldValue): fieldValue;
                }
            });
            return {...ent, ...wrappedFields};
        }

        if (isArray(entity)) {
            return  map(entity, wrap);
        }
        return wrap(entity);
    }

    async _getCollection() {
        if (!this.collection) {
            this.collection = this.database.collection(this.collectionName);
        }
        return this.collection;
    }

    _getAuditFields(updateOnly = false) {
        const auditFields = {
            updated_at: new Date(),
            updated_by: this.user._id,
        }
        
        if (!updateOnly) {
            auditFields['created_at'] = auditFields['updated_at'];
            auditFields['created_by'] = auditFields['updated_by'];
        }
        return auditFields;
    }

    async create(entity, session) {
        const auditFields = this._getAuditFields();
        const wrap = this._wrapFieldsWithObjectId;
        const wrappedEntity = wrap(entity);
        const entityToDb = {...wrappedEntity, ...auditFields};
        const collection = await this._getCollection();
        const { insertedId } = await collection.insertOne(entityToDb, {session});;
        const entityFromDb = await this.findById(insertedId, session);
        return entityFromDb;
    }

    async update(underscoreId, entityUpdate) {
        const id = new ObjectId(underscoreId);
        const auditFields = this._getAuditFields(true);
        const entityUpdateToDb = {...entityUpdate, ...auditFields};
        const collection = await this._getCollection();
        const updateResult = await collection.updateOne({ _id: id }, { $set: entityUpdateToDb });
        return updateResult
    }

    async findById(underscoreId, session) {
        const id = new ObjectId(underscoreId)
        const collection = await this._getCollection();
        const entityFromDb = await collection.findOne({ _id: id }, { session });
        return entityFromDb;
    }

    async findOne(query) {
        const collection = await this._getCollection();
        const queryWrapped = this._wrapFieldsWithObjectId(query);
        const entityFromDb = await collection.findOne(queryWrapped);
        return entityFromDb;
    }

    async getMany(query = {}, options = {}, session) {
        const { page = 1, size = 100, sort = { _id: 1 }, project = {} } = options;
        const queryWrapped = this._wrapFieldsWithObjectId(query);
        const collection = await this._getCollection();
        const entitiesFromDB =  await collection.find(queryWrapped, { session })
            .project(project)
            .sort( sort )
            .skip( page > 0 ? ( ( page - 1 ) * size ) : 0 )
            .limit( size )
            .toArray();
        return entitiesFromDB
    }

    async countDocuments(query = {}) {
        const collection = await this._getCollection();
        return await collection.countDocuments(query);
    }
}

module.exports = BaseDocumentService
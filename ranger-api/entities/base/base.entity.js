const NotFoundError = require("../../common/errors/notfound.error");
const { DocumentService } = require("../../services/document_service");

class BaseEntity {
    constructor({ user, documentService }) {
        this.user = user;
        /** @type { DocumentService } */
        this.documentService = documentService;
        this.entityName = 'base_entity';
    }

    toJSON(entityOrEntities) {
        const hideFields = this.hideFields;
        if (!hideFields || hideFields.length == 0) return entityOrEntities;
        if (isArray(entityOrEntities)) {
            return entityOrEntities.map(entity => omit(entity, hideFields));
        }
        if (!entityOrEntities) return {};
        return omit(entityOrEntities, hideFields);
    }


    async create({ body }) {
        const entity = body;
        const entityFromDB = await this.documentService.create(entity);
        return entityFromDB;
    }

    async update({ body, params }) {
        const { id } = params;
        let entityFromDB = await this.documentService.findById(id);
        if (!entityFromDB) {
            throw new NotFoundError(`${this.entityName} NOT FOUND`);
        }
        const updatedEntity = body;
        await this.documentService.update(id, updatedEntity);
        entityFromDB = await this.documentService.findById(id);
        return entityFromDB;
    }

    async getMany({ query }) {
        const entityFromDB = await this.documentService.getMany({}, query);
        const total = await this.documentService.countDocuments({});
        return { entities: entityFromDB, total };
    }

}

module.exports = BaseEntity;
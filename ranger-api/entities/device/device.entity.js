
const { BaseEntity } = require("../base");

class DeviceEntity extends BaseEntity {
    constructor({ user, documentService }) {
        super({ user, documentService });
        this.entityName = 'device_event';
    }
}

module.exports = DeviceEntity;
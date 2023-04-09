const { BaseEntity } = require("../base");

class DeviceEventEntity extends BaseEntity {
    constructor({ user, documentService }) {
        super({ user, documentService });
        this.entityName = 'device_event';
    }
}

module.exports = DeviceEventEntity;
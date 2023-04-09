const express = require('express');
const router = express.Router();
const { adaptRequest, getEntity } = require('./_helpers');
const { COLLECTION_NAMES } = require('../common/enums')
const { DeviceEventEntity } = require('../entities');

router.post( '/', async function(req, res, next) {
    const adaptedRequest = adaptRequest(req);

    /** @type {DeviceEventEntity} */
    const deviceEventEntity = await getEntity({
      ...adaptedRequest, 
      collectionName: COLLECTION_NAMES.DEVICE_EVENT});
  
    try {
      const deviceEvent = await deviceEventEntity.create(adaptedRequest);
      return res.status(200).json(deviceEvent);
    } catch (error) {
      if(!error.isCustomError) return next(error);
      return res.status(error.status).json(error.toJSON());
    }
});


router.get( '/', async function(req, res, next) {
    const adaptedRequest = adaptRequest(req);

    /** @type {DeviceEventEntity} */
    const deviceEventEntity = await getEntity({
      ...adaptedRequest, 
      collectionName: COLLECTION_NAMES.DEVICE_EVENT});
  
    try {
      const deviceEvents = await deviceEventEntity.getMany(adaptedRequest);
      return res.status(200).json(deviceEvents);
    } catch (error) {
      if(!error.isCustomError) return next(error);
      return res.status(error.status).json(error.toJSON());
    }
});


router.patch( '/:id', async function(req, res, next) {
    const adaptedRequest = adaptRequest(req);

    /** @type {DeviceEventEntity} */
    const deviceEventEntity = await getEntity({
      ...adaptedRequest, 
      collectionName: COLLECTION_NAMES.DEVICE_EVENT});

    try {
      const deviceEvent = await deviceEventEntity.update(adaptedRequest);
      return res.status(200).json(deviceEvent);
    } catch (error) {
      if(!error.isCustomError) return next(error);
      return res.status(error.status).json(error.toJSON());
    }
  });


module.exports = router;
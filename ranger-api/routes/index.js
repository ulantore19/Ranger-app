const express = require('express');
const deviceEventRouter = require('./device_event.route');
const { addDatabaseMdw } = require('./database.mdw');

const router = express.Router();

router.use(addDatabaseMdw);

router.use('/device_event', deviceEventRouter);
module.exports = router;
const config = require('./core/config');
const express = require('express');
const cors = require('cors');
const multer  = require('multer');
const path = require('path');
const fs = require('fs');
const apiRoutes = require('./routes');
const crypto = require('crypto');
const { includes } = require('lodash');

const storage = multer.diskStorage({
    destination: config.frameDestination,
    filename: function (req, file, cb) {
        const fileExt = file.originalname.split('.').pop();
        const fileHash = crypto.createHash('md5').update(file.originalname).digest("hex");

        cb(null, fileHash + '.' + fileExt);
      }
});

const upload = multer({ storage })

fs.mkdirSync(config.frameDestination, { recursive: true });

const { DatabaseFactory } = require('./database');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false}));

app.get('/ping', (req, res) => {
    res.send('pong!');
});


app.use('/api', apiRoutes);

app.post('/frames', upload.single('frame'), function (req, res, next) {
   const relativePath = req.file.path.replace('public','');
   const fullUrl = `${config.server.hostname}${relativePath}`;
   res.json({
    image_url: fullUrl,
   })
});

app.use(express.static('public'));

app.get('*', function(req, res, next){
    if (includes(req.originalUrl, '/api')) return next();
    res.sendFile(path.join(__dirname + '/public/index.html'));
});

app.use((req, res) => {
    res.status(404).json({
        error: {
            message: 'NotFound',
            status: 404,
        }
    });
});

app.use((err, req, res) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    
    //TODO: handle custom error
    res.status(err.status || 500);
    res.send('Internal Server Error');
});

const initApplication = () => app.listen(config.server.port, config.server.ip, () => {
    console.log('Listening on', `http://${config.server.ip}:${config.server.port}`);
  }).on('error', (error) => {
    console.log('Error happened:', error);
});

DatabaseFactory.init(config.database.connectionURI)
  .then(() => initApplication())
  .catch(console.log);
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// Settings
app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
//app.use(cors());
app.use(cors({
  origin: 'https://upload2025-production.up.railway.app'
}));

app.use(express.json());
app.use("/images", express.static('public/uploads'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ 
    limit: '50mb',
    extended: true, 
    parameterLimit: 10000000000 
}));

app.get('/status', (req, res) => {
  res.send('Servidor corriendo correctamente ✅');
});

// Routes
app.use(require('./routes/excel.routes'));
app.use(require('./routes/image.routes'));

module.exports = app;

const path = require('path');
const express = require('express');
const generateHandler = require('./api/generate');
const enhanceHandler = require('./api/enhance');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/generate', (req, res) => {
    return generateHandler(req, res);
});

app.post('/api/enhance', (req, res) => {
    return enhanceHandler(req, res);
});

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
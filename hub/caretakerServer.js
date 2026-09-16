const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/public', express.static(path.join(__dirname, '..', 'public')));
app.use('/assets', express.static(path.join(__dirname, '..', 'dist', 'assets')));
app.use('/sample_reports', express.static(path.join(__dirname, '..', 'sample_reports')));

const PORT = process.env.CARETAKER_PORT || 5174;

app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, 'caretaker.html'));
});

const server = http.createServer(app);
server.listen(PORT, () => {
    console.log(`\n🛡️ Mnemosync Caretaker Portal running on http://localhost:${PORT}`);
    console.log(`   Direct Link: http://localhost:${PORT}/\n`);
});

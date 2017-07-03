

import express = require('express');
import http = require('http');
import url = require('url');
import fs = require('fs');

import { initServer } from './api';
import './ping';

export const app = express();

setTimeout(() => {
    initServer(app)
    const server = http.createServer(app);
    server.listen(3000, function listening() {
        console.log('Listening on %d', server.address().port);
    })
}, 500);

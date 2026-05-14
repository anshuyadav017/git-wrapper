const express = require('express');
const path = require('path');
const wrappedRouter = require('./api/wrapped');
const cardRouter = require('./api/card');
const compareRouter = require('./api/compare');
const { errorHandler } = require('./utils/errors');

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, '../public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/wrapped', wrappedRouter);
app.use('/card', cardRouter);
app.use('/compare', compareRouter);

app.use(errorHandler);

module.exports = app;
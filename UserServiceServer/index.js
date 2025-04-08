require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
}));

const { UserRouter } = require('./Routers/users');
app.use('/v1/api/users', UserRouter);

const { OrderRouter } = require('./Routers/order');
app.use('/v1/api/order', OrderRouter);


app.get('/v1/status', (req, res) => {
    res.send('User Server is running!');
});

app.get('/', (req, res) => {
    res.send('User Server is running!');
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
    });
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`User Server running on port ${PORT}`);
});

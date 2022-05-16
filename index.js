const express = require('express');
const app = express() 
const port = process.env.PORT || 5000 

const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.json()) 

app.get('/', (req, res) => {
    res.send('Handy Man is running ')
})

app.listen(port, () => {
    console.log('Listening on port ', port);
})
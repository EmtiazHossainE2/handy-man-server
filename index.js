//1
const express = require('express');
const app = express() 
const port = process.env.PORT || 5000 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//3
const cors = require('cors')
require('dotenv').config()

//4
app.use(cors())
app.use(express.json()) 

//5 

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6r1v6.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        //7
        await client.connect();
        const serviceCollection = client.db("handy-man").collection("services");

        //8 service load (Read)
        app.get('/service', async (req, res) => {
            const query = {}
            const services = await serviceCollection.find(query).toArray()
            res.send(services)
        })

        // 
        app.get('/service/:id' , async (req,res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query)
            res.send(service)
        })

    } finally {
        //   await client.close();
    }
}
run().catch(console.dir);



//2
app.get('/', (req, res) => {
    res.send('Handy Man is running ')
})

app.listen(port, () => {
    console.log('Listening on port ', port);
})
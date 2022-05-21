//1
const express = require('express');
const app = express()
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

//3
const cors = require('cors')
require('dotenv').config()

//4
app.use(cors())
app.use(express.json())

//5 

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6r1v6.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


//14 jwt 
const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized Access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' });
        }
        req.decoded = decoded;
        next();
    })
}





//6
async function run() {
    try {
        //7
        await client.connect();
        const serviceCollection = client.db("handy-man").collection("services");
        const bookingCollection = client.db("handy-man").collection("bookings");
        const userCollection = client.db("handy-man").collection("users");

         
        // 18 verify admin middleware 
        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email
            const requesterAccount = await userCollection.findOne({ email: requester })
            if (requesterAccount.role === 'admin') {
                next()
            }
            else {
                res.status(403).send({ message: 'Forbidden Access' });
            }
        }

        //8 service load (Read)
        app.get('/service', async (req, res) => {
            const query = {}
            const services = await serviceCollection.find(query).toArray()
            res.send(services)
        })

        //9 get single service 
        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query)
            res.send(service)
        })

        //10 booking 
        app.post('/booking', async (req, res) => {
            const booking = req.body
            const query = { serviceName: booking.serviceName, email: booking.email, date: booking.date }
            const exists = await bookingCollection.findOne(query)
            if (exists) {
                return res.send({ success: false, booking: exists })
            }
            else {
                const result = await bookingCollection.insertOne(booking)
                return res.send({ success: true, result });
            }
        })

        //11 available 
        app.put('/service/:id', async (req, res) => {
            const id = req.params.id
            const updateService = req.body
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    available: updateService.available,
                },
            };
            const result = await serviceCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })

        //12 get my booking 
        app.get('/booking', verifyJWT, async (req, res) => {
            const email = req.query.email
            //15
            const decodedEmail = req.decoded.email
            if (email === decodedEmail) {
                const query = { email: email };
                const bookings = await bookingCollection.find(query).toArray();
                res.send(bookings)
            }
            else {
                return res.status(403).send({ message: 'Forbidden Access' });
            }
        })

        //13 upsert user (create or update ) 
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const user = req.body;
            const options = { upsert: true }
            const updateDoc = {
                $set: user
            };
            const result = await userCollection.updateOne(filter, updateDoc, options)
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' })
            res.send({ result, token })
        })

        //16 get users 
        app.get('/user',verifyJWT, async (req, res) => {
            const users = await userCollection.find().toArray()
            res.send(users)
        })

        //20 delete user/admin
        app.delete('/user/:email', verifyJWT, verifyAdmin, async (req, res) => {
            const email = req.params.email
            const filter = {email : email}
            const result = await userCollection.deleteOne(filter)
            res.send(result)
        })

        //17 make admin 
        app.put('/user/admin/:email', verifyJWT, verifyAdmin, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const updateDoc = {
                $set: {role : 'admin'}
            };
            const result = await userCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        app.put('/user/user/:email', verifyJWT, verifyAdmin, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const updateDoc = {
                $set: {role : 'user'}
            };
            const result = await userCollection.updateOne(filter, updateDoc)
            res.send(result)
        })



        // 19 check admin
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email
            const user = await userCollection.findOne({ email: email })
            const isAdmin = user?.role === 'admin'
            // console.log(isAdmin);
            res.send({ admin: isAdmin })
        })

        //20 get user info (profile)
        app.get('/user/:email', verifyJWT, async (req, res) => {
            const email = req.params.email
            // console.log(email);
            const userInfo = await userCollection.findOne({email : email})
            res.send(userInfo)
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
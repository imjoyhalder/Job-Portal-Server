const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.y8uksmr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const jobsCollection = await client.db('Job-Portal').collection('jobs')
    const jobApplicationCollection = await client.db('Job-Portal').collection('job_applications')

    app.get('/jobs', async (req, res) => {
      const email = req.query?.email
      let query = {}
      if (email) {
        query = { hr_email: email }
      }

      const cursor = jobsCollection.find(query)
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/jobs/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await jobsCollection.findOne(query)
      res.send(result)
    })


    //Auth Related APIs
    app.post('/jwt', async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.JWT_SECRET , { expiresIn: '1h' })
      res.send(token)
    })


    // job application apis
    app.get('/job-application', async (req, res) => {
      const email = req.query.email;
      const query = { applicant_email: email }
      const result = await jobApplicationCollection.find(query).toArray()

      //worst way
      for (const application of result) {
        const query1 = { _id: new ObjectId(application.job_id) }
        const job = await jobsCollection.findOne(query1)
        if (job) {
          application.title = job.title,
            application.company = job.company
          application.company_logo = job.company_logo
          application.location = job.location
        }
      }

      res.send(result)
    })

    app.post('/job-applications', async (req, res) => {
      const application = req.body;
      const result = await jobApplicationCollection.insertOne(application)
      res.send(result)
    })

    app.post('/job-post', async (req, res) => {
      const application = req.body;
      const result = await jobsCollection.insertOne(application)



      const id = application.job_id
      const query = { _id: new ObjectId(id) }

      const job = await jobsCollection.findOne(query)
      let count = 0;
      if (job.applicationCount) {
        newCount = job.applicationCount + 1;
      }
      else {
        count = 1;
      }

      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          applicationCount: newCount
        }
      }

      const updateResult = await jobsCollection.updateOne(filter, updatedDoc)

      res.send(result)
    })





  } finally {

  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Job portal server is running')
})

app.listen(port, () => {
  console.log('Job portal Server is running on: ', port)
})
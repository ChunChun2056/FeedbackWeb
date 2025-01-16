// db.js
const { MongoClient, ObjectId } = require('mongodb');

// Connection URI for MongoDB Atlas (replace with your actual URI from the .env file)
const uri = process.env.MONGODB_URI; // Use the environment variable for the connection string

// Create a new MongoClient
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function connectToDatabase() {
  try {
    // Connect the client to the server
    await client.connect();
    console.log('Connected to MongoDB Atlas');

    // Establish and verify connection
    await client.db('admin').command({ ping: 1 });
    console.log('MongoDB Atlas connection ping successful');

    // Return the database instance
    return client.db('test'); // Replace 'test' with your database name
  } catch (error) {
    console.error('Error connecting to MongoDB Atlas:', error);
    throw error; // Throw the error to be handled by the caller
  }
}

module.exports = { connectToDatabase, ObjectId };
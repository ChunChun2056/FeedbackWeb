// db.js
const { MongoClient, ObjectId } = require('mongodb');

// Connection URI (replace with your actual URI)
const uri = 'mongodb://localhost:27017/'; // Assuming you're running MongoDB locally

// Create a new MongoClient
const client = new MongoClient(uri);

async function connectToDatabase() {
    try {
        // Connect the client to the server
        await client.connect();
        console.log('Connected to MongoDB');

        // Establish and verify connection
        await client.db('admin').command({ ping: 1 });
        console.log('MongoDB connection ping successful');

        return client.db(); // Return the database instance
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error; // Throw the error to be handled by the caller
    }
}

module.exports = { connectToDatabase, ObjectId };
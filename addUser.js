require('dotenv').config(); // Load environment variables
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI; // MongoDB Atlas connection string
const DB_NAME = 'Cluster0'; // Replace with your database name
const COLLECTION_NAME = 'users'; // Replace with your collection name

async function addUser() {
  const username = 'admin';
  const password = 'S@n!1212';

  // Hash the password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Connect to MongoDB Atlas
  const client = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Insert the user into the collection
    const result = await collection.insertOne({
      username,
      password: hashedPassword,
    });

    console.log('User added successfully:', result.insertedId);
  } catch (error) {
    console.error('Error adding user:', error);
  } finally {
    await client.close();
  }
}

addUser();
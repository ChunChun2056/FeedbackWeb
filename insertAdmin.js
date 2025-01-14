const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const uri = 'mongodb://localhost:27017'; // Replace with your MongoDB connection string
const dbName = 'test'; // Replace with your database name

async function insertAdmin() {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    // Hash the admin password
    const password = 'S@n!1212'; // Replace with the desired admin password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert the admin user
    const adminUser = {
      username: 'admin',
      password: hashedPassword,
      role: 'admin', // Add a role field to distinguish admin users
    };

    const result = await usersCollection.insertOne(adminUser);
    console.log('Admin user inserted:', result.insertedId);
  } catch (error) {
    console.error('Error inserting admin user:', error);
  } finally {
    await client.close();
  }
}

insertAdmin();
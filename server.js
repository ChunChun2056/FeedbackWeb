const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { connectToDatabase, ObjectId } = require('./db');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
const rateLimit = require('express-rate-limit');
const app = express();

app.use(express.json());

const uri = 'mongodb://localhost:27017'; // Replace with your MongoDB connection string
const dbName = 'test'; // Replace with your database name

// Session Middleware
app.use(
  session({
    secret: '9hjjaywgksk#sax+!^j3+m9$z8rj(=4suy_t6mm*u(2h*&ocn&', // Replace with a strong secret key
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true if using HTTPS
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24, // Session expiration time (e.g., 1 day)
    },
  })
);

// Rate limit for login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: 'Too many login attempts, please try again later',
});

app.use('/login', loginLimiter);

let db;

// Connect to MongoDB
MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((client) => {
    db = client.db(dbName);
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });

function handleError(res, error, message = 'An unexpected error occurred') {
  console.error(message + ':', error);
  res.status(500).json({ error: message });
}

// Authentication Middleware
function requireLogin(req, res, next) {
    if (req.session && req.session.authenticated) {
      return next(); // User is authenticated, proceed
    } else {
      // Redirect to the login page if the user is not authenticated
      return res.redirect('/login.html');
    }
    }

// Serve the login page
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Signup route
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  // Password complexity rules
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);

  if (password.length < minLength) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }
  if (!hasUppercase) {
    return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
  }
  if (!hasLowercase) {
    return res.status(400).json({ error: 'Password must contain at least one lowercase letter' });
  }
  if (!hasNumber) {
    return res.status(400).json({ error: 'Password must contain at least one number' });
  }
  if (!hasSpecialChar) {
    return res.status(400).json({ error: 'Password must contain at least one special character' });
  }

  // Check if user already exists
  const userExists = await db.collection('users').findOne({ username });
  if (userExists) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  // Hash the password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Save user to the database
  await db.collection('users').insertOne({ username, password: hashedPassword });
  res.status(201).json({ message: 'User created successfully' });
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    // Find user in the database
    const user = await db.collection('users').findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  
    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  
    // Set session after successful login
    req.session.authenticated = true;
    req.session.userId = user._id; // Store user ID in session
    res.status(200).json({ message: 'Login successful' });
  });

// Logout Route
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error logging out' });
    }
    res.clearCookie('connect.sid'); // Clear the session cookie
    res.status(200).json({ message: 'Logout successful' });
  });
});

// Check Login Status Route
app.get('/check-login', (req, res) => {
  if (req.session && req.session.authenticated) {
    res.status(200).send('User is logged in');
  } else {
    res.status(401).send('User is not logged in');
  }
});

// Protect routes that require authentication
app.get('/', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/create.html', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'create.html'));
});

app.get('/edit.html', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'edit.html'));
});

// Serve static files (after authentication middleware)
app.use(express.static('public'));

// ... (rest of your routes remain unchanged)

// Start the server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});

app.get('/surveys', async (req, res) => {
    console.log('GET /surveys - Request received');
    try {
        const surveys = await db.collection('surveys').find({}).toArray();
        res.json(surveys);
    } catch (error) {
        handleError(res, error, 'Failed to fetch surveys');
    }
});

app.post('/surveys', requireLogin, async (req, res) => {
    console.log('POST /surveys - Request received');
    console.log('Request body:', req.body);

    const newSurvey = {
        _id: uuidv4(), // Use UUID as _id instead of letting MongoDB generate ObjectId
        ...req.body,
        uniqueUrl: uuidv4()
    };

    try {
        const result = await db.collection('surveys').insertOne(newSurvey);
        res.status(201).json(newSurvey);
    } catch (error) {
        handleError(res, error, 'Failed to create survey');
    }
});

app.get('/surveys/:id', requireLogin, async (req, res) => {
    const surveyId = req.params.id;
    console.log(`GET /surveys/${surveyId} - Request received`);

    try {
        const survey = await db.collection('surveys').findOne({ _id: surveyId });
        if (survey) {
            res.json(survey);
        } else {
            console.error(`Survey not found - id: ${surveyId}`);
            res.status(404).send('Survey not found');
        }
    } catch (error) {
        handleError(res, error, 'Failed to fetch survey');
    }
});

app.get('/surveys/:id', requireLogin, async (req, res) => {
    const surveyId = req.params.id;
    console.log(`GET /surveys/${surveyId} - Request received`);

    try {
        if (!ObjectId.isValid(surveyId)) {
            console.error(`Invalid survey ID format - id: ${surveyId}`);
            return res.status(400).send('Invalid survey ID format');
        }

        const survey = await db.collection('surveys').findOne({ _id: new ObjectId(surveyId) });
        if (survey) {
            res.json(survey);
        } else {
            console.error(`Survey not found - id: ${surveyId}`);
            res.status(404).send('Survey not found');
        }
    } catch (error) {
        handleError(res, error, 'Failed to fetch survey');
    }
});

app.put('/surveys/:id', requireLogin, async (req, res) => {
    const surveyId = req.params.id;
    console.log(`PUT /surveys/${surveyId} - Request received`);
    console.log('Request body:', req.body);

    try {
        const result = await db.collection('surveys').updateOne(
            { _id: surveyId },
            { $set: req.body }
        );

        if (result.matchedCount === 0) {
            console.error(`Survey not found - id: ${surveyId}`);
            res.status(404).send('Survey not found');
        } else {
            const updatedSurvey = await db.collection('surveys').findOne({ _id: surveyId });
            res.json(updatedSurvey);
        }
    } catch (error) {
        handleError(res, error, 'Failed to update survey');
    }
});

app.delete('/surveys/:id', requireLogin, async (req, res) => {
    const surveyId = req.params.id;
    console.log(`DELETE /surveys/${surveyId} - Request received`);

    try {
        const result = await db.collection('surveys').deleteOne({ _id: surveyId });
        if (result.deletedCount === 0) {
            console.error(`Survey not found - id: ${surveyId}`);
            res.status(404).send('Survey not found');
        } else {
            res.status(204).send();
        }
    } catch (error) {
        handleError(res, error, 'Failed to delete survey');
    }
});


app.get('/survey/:uniqueUrl', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'survey.html'));  // This remains public
});

// Public route to access a survey via unique URL
app.get('/s/:uniqueUrl', async (req, res) => {
    const uniqueUrl = req.params.uniqueUrl;
    console.log(`GET /s/${uniqueUrl} - Request received`);

    try {
        const survey = await db.collection('surveys').findOne({ uniqueUrl: uniqueUrl });
        if (survey) {
            res.json(survey);  // Respond with the survey data
        } else {
            console.error(`Survey not found - uniqueUrl: ${uniqueUrl}`);
            res.status(404).send('Survey not found');
        }
    } catch (error) {
        handleError(res, error, 'Failed to fetch survey by uniqueUrl');
    }
});

// Store response
app.post('/surveys/:id/submit', async (req, res) => {
    const surveyId = req.params.id;
    const responseData = {
        surveyId,
        timestamp: new Date(),
        responses: req.body.responses,
        completed: req.body.completed,
        version: 1
    };

    try {
        await db.collection('responses').insertOne(responseData);
        res.status(201).json({ message: 'Response recorded' });
    } catch (error) {
        handleError(res, error, 'Failed to store response');
    }
});

// Get responses for a survey
app.get('/surveys/:id/responses', requireLogin, async (req, res) => {
    const surveyId = req.params.id;
    
    try {
        const responses = await db.collection('responses')
            .find({ surveyId })
            .sort({ timestamp: -1 })
            .toArray();
        res.json(responses);
    } catch (error) {
        handleError(res, error, 'Failed to fetch responses');
    }
});

app.get('/surveys/:id', async (req, res) => {
    try {
      const survey = await Survey.findById(req.params.id);
      if (!survey) {
        return res.status(404).json({ error: 'Survey not found' });
      }
      res.json(survey); // Ensure this includes the pageName field
    } catch (error) {
      res.status(500).json({ error: 'Error fetching survey' });
    }
  });

function convertToCSV(responses) {
    // Implement CSV conversion
    return 'timestamp,answers\n' + responses.map(r => 
        `${r.timestamp},${JSON.stringify(r.responses)}`
    ).join('\n');
}

app.use((req, res) => {
    console.error(`404 Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).send('404 Not Found');
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).send('Internal Server Error');
});

// General Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).send('Internal Server Error');
});
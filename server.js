const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { connectToDatabase, ObjectId } = require('./db');
const session = require('express-session'); // Add this line
const app = express();
const port = 3000; // You defined port here

// --- Temporary Admin Credentials (Replace with Database in Production) ---
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'password';

app.use(express.json());

// Session Middleware
app.use(session({
    secret: 'your-secret-key', // Replace with a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

let db;

connectToDatabase()
    .then(database => {
        db = database;
        app.listen(port, () => {
            console.log(`Server listening on port ${port}`);
        });
    })
    .catch(error => {
        console.error('Error starting server:', error);
        process.exit(1);
    });

function handleError(res, error, message = 'An unexpected error occurred') {
    console.error(message + ':', error);
    res.status(500).json({ error: message });
}

// Authentication Middleware
function requireLogin(req, res, next) {
    console.log("Session Check:", req.session);
    if (req.session && req.session.authenticated) {
        console.log("User is authenticated");
        return next(); // User is authenticated, proceed
    } else {
        console.log('User is not authenticated, redirecting to login');
        return res.redirect('/login.html'); // Redirect to login without using status 401
    }
}

// Serve the login page
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Login Route
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Authenticate the user (set a session variable)
        req.session.authenticated = true;
        res.status(200).send('Login successful');
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Logout Route
app.get('/logout', (req, res) => {
    req.session.destroy(); // Destroy the session
    res.redirect('/login.html');
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
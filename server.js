const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { connectToDatabase, ObjectId } = require('./db');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

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

app.get('/surveys', async (req, res) => {
    console.log('GET /surveys - Request received');
    try {
        const surveys = await db.collection('surveys').find({}).toArray();
        res.json(surveys);
    } catch (error) {
        handleError(res, error, 'Failed to fetch surveys');
    }
});

app.post('/surveys', async (req, res) => {
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

app.get('/surveys/:id', async (req, res) => {
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

app.get('/surveys/:id', async (req, res) => {
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

app.put('/surveys/:id', async (req, res) => {
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

app.delete('/surveys/:id', async (req, res) => {
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
    res.sendFile(path.join(__dirname, 'public', 'survey.html'));  // Changed from index.html
});

app.get('/s/:uniqueUrl', async (req, res) => {
    const uniqueUrl = req.params.uniqueUrl;
    console.log(`GET /s/${uniqueUrl} - Request received`);

    try {
        const survey = await db.collection('surveys').findOne({ uniqueUrl: uniqueUrl });
        if (survey) {
            res.json(survey);
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

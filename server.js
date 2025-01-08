const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

const surveysFilePath = path.join(__dirname, 'storage', 'surveys.json');

// Ensure the storage directory and file exist
const storageDir = path.join(__dirname, 'storage');
if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir);
}
if (!fs.existsSync(surveysFilePath)) {
    fs.writeFileSync(surveysFilePath, '[]');
}


// Helper function to read surveys from the JSON file
function readSurveys() {
    try {
        const data = fs.readFileSync(surveysFilePath);
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading surveys file:', error); // Log the error
        return []; // Return an empty array if there's an error reading the file
    }
}

// Helper function to write surveys to the JSON file
function writeSurveys(surveys) {
    try {
        fs.writeFileSync(surveysFilePath, JSON.stringify(surveys, null, 2));
    } catch (error) {
        console.error('Error writing to surveys file:', error); // Log the error
    }
}

// Get all surveys
app.get('/surveys', (req, res) => {
    const surveys = readSurveys();
    res.json(surveys);
});

// Create a new survey
app.post('/surveys', (req, res) => {
    console.log('POST /surveys - Request received'); // Log the request
    console.log('Request body:', req.body); // Log the request body

    const newSurvey = {
        id: uuidv4(),
        ...req.body,
        uniqueUrl: uuidv4() // Generate a unique URL
    };

    try {
        const surveys = readSurveys();
        surveys.push(newSurvey);
        writeSurveys(surveys);
        res.status(201).json(newSurvey);
    } catch (error) {
        console.error('Error creating survey:', error); // Log the error
        res.status(500).json({ error: 'Failed to create survey' }); // Send an error response
    }
});

// Get a specific survey by its unique URL
app.get('/s/:uniqueUrl', (req, res) => {
    const uniqueUrl = req.params.uniqueUrl;
    console.log(`GET /s/${uniqueUrl} - Request received`); // Log the request

    try {
        const surveys = readSurveys();
        const survey = surveys.find(s => s.uniqueUrl === uniqueUrl);
        if (survey) {
            res.json(survey);
        } else {
            console.error(`Survey not found - uniqueUrl: ${uniqueUrl}`); // Log if survey not found
            res.status(404).send('Survey not found');
        }
    } catch (error) {
        console.error('Error fetching survey:', error); // Log the error
        res.status(500).send('Error fetching survey');
    }
});

// Get a specific survey by its ID for editing
app.get('/surveys/:id', (req, res) => {
    console.log('GET /surveys/:id - Request received');
    try {
        const surveys = readSurveys();
        const surveyId = req.params.id;
        const survey = surveys.find(s => s.id === surveyId);

        if (survey) {
            res.json(survey);
        } else {
            console.error(`Survey not found - id: ${surveyId}`);
            res.status(404).send('Survey not found');
        }
    } catch (error) {
        console.error('Error fetching survey:', error);
        res.status(500).send('Error fetching survey');
    }
});

// Serve the survey page
app.get('/survey/:uniqueUrl', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Update a survey
app.put('/surveys/:id', (req, res) => {
    const surveyId = req.params.id;
    console.log(`PUT /surveys/${surveyId} - Request received`); // Log the request
    console.log('Request body:', req.body); // Log the request body

    try {
        const surveys = readSurveys();
        const index = surveys.findIndex(s => s.id === surveyId);
        if (index !== -1) {
            const updatedSurvey = { ...surveys[index], ...req.body };
            surveys[index] = updatedSurvey;
            writeSurveys(surveys);
            res.json(updatedSurvey);
        } else {
            console.error(`Survey not found - id: ${surveyId}`); // Log if survey not found
            res.status(404).send('Survey not found');
        }
    } catch (error) {
        console.error('Error updating survey:', error); // Log the error
        res.status(500).send('Error updating survey');
    }
});

// Delete a survey
app.delete('/surveys/:id', (req, res) => {
    const surveyId = req.params.id;
    console.log(`DELETE /surveys/${surveyId} - Request received`); // Log the request

    try {
        const surveys = readSurveys();
        const index = surveys.findIndex(s => s.id === surveyId);
        if (index !== -1) {
            surveys.splice(index, 1);
            writeSurveys(surveys);
            res.status(204).send();
        } else {
            console.error(`Survey not found - id: ${surveyId}`); // Log if survey not found
            res.status(404).send('Survey not found');
        }
    } catch (error) {
        console.error('Error deleting survey:', error); // Log the error
        res.status(500).send('Error deleting survey');
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
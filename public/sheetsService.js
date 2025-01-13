// sheetsService.js
const { google } = require('googleapis');
const sheets = google.sheets('v4');

// Initialize auth client
const auth = new google.auth.GoogleAuth({
  keyFile: 'path/to/your/credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

async function initializeSheetForSurvey(surveyName) {
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  // Create a new spreadsheet
  const spreadsheet = await sheets.spreadsheets.create({
    resource: {
      properties: {
        title: `Survey Responses - ${surveyName}`
      }
    }
  });

  return spreadsheet.data.spreadsheetId;
}

async function submitResponse(spreadsheetId, responses) {
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  // Format responses as a row
  const values = [Object.values(responses)];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Sheet1!A:Z',
    valueInputOption: 'RAW',
    resource: {
      values
    }
  });
}

module.exports = { initializeSheetForSurvey, submitResponse };
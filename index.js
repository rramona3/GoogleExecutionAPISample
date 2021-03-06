var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

//NOTE: 
//1) this is access scope for app script itself - it depends from what script is doing.
//in the project console only "Google Apps Script Execution API" should be enabled - 
//If you enable Drive API in the project console - it doesn't matter - scopes should be specified here in any case.   

// 2) If modifying these scopes, delete your previously saved credentials
// at script-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/drive'];

var CLIENT_SECRET_PATH='client_secret.json';
var TOKEN_PATH = 'script-nodejs-quickstart.json';

var config=require('./config');
var SCRIPT_ID=config.scriptId;

// Load client secrets from a local file.
fs.readFile(CLIENT_SECRET_PATH, function processClientSecrets(err, content) {
   console.log('processClientSecrets...');
   if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
   }
   // Authorize a client with the loaded credentials, then call the
   // Google Apps Script Execution API.
   authorize(JSON.parse(content), callAppsScript);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
   console.log('authorize...');
   var clientSecret = credentials.installed.client_secret;
   var clientId = credentials.installed.client_id;
   var redirectUrl = credentials.installed.redirect_uris[0];
   var auth = new googleAuth();
   var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

   // Check if we have previously stored a token.
   fs.readFile(TOKEN_PATH, function (err, token) {
      if (err) {
         getNewToken(oauth2Client, callback);
      } else {
         console.log('Already authorized. \nTo reset authorization delete script-nodejs-quickstart.json');
         oauth2Client.credentials = JSON.parse(token);
         callback(oauth2Client);
      }
   });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
   console.log('getNewToken...');   
   var authUrl = oauth2Client.generateAuthUrl({
      //'offline' - after granting access code to copy will appear
      access_type: 'offline',
      //required parameter! Cannot be empty 
      scope: SCOPES
   });
   console.log('Authorize this app in your browser');
   var opener=require('opener');
   opener(authUrl);
   var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
   });
   rl.question('Enter the code from that page here: ', function (code) {
      rl.close();
      oauth2Client.getToken(code, function (err, token) {
         if (err) {
            console.log('Error while trying to retrieve access token', err);
            return;
         }
         oauth2Client.credentials = token;
         storeToken(token);
         callback(oauth2Client);
      });
   });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
   console.log('storeToken...');
   fs.writeFile(TOKEN_PATH, JSON.stringify(token));
   console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Call an Apps Script function to list the folders in the user's root
 * Drive folder.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function callAppsScript(auth) {
   console.log('callAppsScript...');  
   //Current APi ID from script publish dialog 
   var scriptId = SCRIPT_ID;
   var script = google.script('v1');

   // Make the API request. The request object is included here as 'resource'.
   script.scripts.run({
      auth: auth,
      resource: {
         function: 'getFoldersUnderRoot'
      },
      scriptId: scriptId
   }, function (err, resp) {
      if (err) {
         // The API encountered a problem before the script started executing.
         console.log('The API returned an error: ' + err);
         return;
      }
      if (resp.error) {
         // The API executed, but the script returned an error.

         // Extract the first (and only) set of error details. The values of this
         // object are the script's 'errorMessage' and 'errorType', and an array
         // of stack trace elements.
         var error = resp.error.details[0];
         console.log('Script error message: ' + error.errorMessage);
         console.log('Script error stacktrace:');

         if (error.scriptStackTraceElements) {
            // There may not be a stacktrace if the script didn't start executing.
            for (var i = 0; i < error.scriptStackTraceElements.length; i++) {
               var trace = error.scriptStackTraceElements[i];
               console.log('\t%s: %s', trace.function, trace.lineNumber);
            }
         }
      } else {
         // The structure of the result will depend upon what the Apps Script
         // function returns. Here, the function returns an Apps Script Object
         // with String keys and values, and so the result is treated as a
         // Node.js object (folderSet).
         var folderSet = resp.response.result;
         if (Object.keys(folderSet).length == 0) {
            console.log('No folders returned!');
         } else {
            console.log('Folders under your root folder:');
            Object.keys(folderSet).forEach(function (id) {
               console.log('\t%s (%s)', folderSet[id], id);
            });
         }
      }

   });
}
Description
---

There is a official [sample](https://developers.google.com/apps-script/guides/rest/quickstart/nodejs) from Google how to execute Google App Script remotely using node.js

I have changed it to make it more useful for me:
- added logging
- added browser launch for authorization request
- changed store location of access token to local folder from user profile
- added additional comments  in code (see NOTE:) to explain details that was unobvious for me
 
How to start
---
- open Google's [sample](https://developers.google.com/apps-script/guides/rest/quickstart/nodejs) page. Follow instruction in Prerequisites and in "Step 1: Turn on the Google Apps Script Execution API"
- download code from this repo
- update script id in **config.js** with the script ID of your target script.
- do "npm update"
- run the sample "node index.js"

Useful links
---
- Pluralsight's course [Introduction to OAuth2, OpenID Connect and JSON Web Tokens (JWT)](http://app.pluralsight.com/courses/oauth2-json-web-tokens-openid-connect-introduction)






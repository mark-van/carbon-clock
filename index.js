'use strict';

// Imports dependencies and set up http server
const
  express = require('express'),
  request = require('request'),
  app = express().use(express.json()), // creates express http server
  carbonZero = new Date('2050-01-01T00:00:00'); //Representative of UNs misson to achieve carbon neutrality by 2050

let clockValue;
// Sets server port and logs message on success//cool
app.listen(process.env.PORT || 3000, () => console.log('webhook is listening'));
 
// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
    //console.log(req);
    let body = req.body;
    //console.log(body);
    // Checks this is an event from a page subscription
    if (body.object === 'page') {
  
      // Iterates over each entry - there may be multiple if batched
      body.entry.forEach(function(entry) {
  
        // Gets the message. entry.messaging is an array, but 
        // will only ever contain one message, so we get index 0
        let webhook_event = entry.messaging[0];
        //console.log(webhook_event);

         // Get the sender PSID
        let sender_psid = webhook_event.sender.id;
        console.log('Sender PSID: ' + sender_psid);

        // Check if the event is a message or postback and
        // pass the event to the appropriate handler function
        if (webhook_event.message) {
            handleMessage(sender_psid, webhook_event.message);    
        }    
      });
  
      // Returns a '200 OK' response to all requests
      res.status(200).send('EVENT_RECEIVED');
    } else {
      // Returns a '404 Not Found' if event is not from a page subscription
      res.sendStatus(404);
      console.log("404 status");
    }
    
  });


// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = "wowthatscool"
      
    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
      
    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
    
      // Checks the mode and token sent is correct
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        
        // Responds with the challenge token from the request
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
      
      } else {
        // Responds with '403 Forbidden' if verify tokens do not match
        console.log('something happened');
        res.sendStatus(403);      
      }
    }
  }); 

function climateClock(){
  let currentTime = new Date();
  let diff = carbonZero.getTime() - currentTime.getTime();
  clockValue = msToTime(diff);
}

function msToTime(s) {
  let ms = s % 1000;
  s = (s - ms) / 1000;
  let secs = s % 60;
  s = (s - secs) / 60;
  let mins = s % 60;
  s = (s - mins) / 60;
  let hrs = s % 24;
  s = (s - hrs) / 24;
  let days = s % 365;
  let years = (s - days) / 365;

  return years+ 'YRS' + days + 'DAYS' + hrs + ':' + mins + ':' + secs + '.' + ms;
}

  // Handles messages events
function handleMessage(sender_psid, received_message) {

    climateClock();
    let response = {
      "text": 'Must achieve carbon neutrality in:\n' + `${clockValue}`
    }
    // Sends the response message
    callSendAPI(sender_psid, response);  
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
    "recipient": {
        "id": sender_psid
    },
    "message": response
    }

     // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": "EAAH3r4IwzVIBAD3sqoaXe13buzaWhMCYoUZAz8Q65OAPufn6Pua0sLjR6Xven8JLUPyFDhHjn7VtUZB0Mpgu73oklNFEY7OESbteTj5nP2I1QZAB0vfOdWVUNHmyV4nUBBdrtFHgGe38xS6LazotE5UYZAtPrXVzZB2rgtqMZA8HeMv5XjpBkn8RFZCz7uHR0IUpLnI9ZBKdUQZDZD" },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
    if (!err) {
        console.log('message sent!');
        //console.log(res, body);
    } else {
        console.error("Unable to send message:" + err);
    }
    }); 
}
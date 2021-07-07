'use strict';

// Imports dependencies and set up http server
const
  express = require('express'),
  //bodyParser = require('body-parser'),
  axios = require('axios'),
  request = require('request'),
  app = express().use(express.json()); // creates express http server

let one_time_notif_token;
let count = 0;

// Sets server port and logs message on success//cool
app.listen(process.env.PORT || 3000, () => console.log('webhook is listening'));
 
// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
    //console.log(req);
    let body = req.body;
    console.log(body);
    // Checks this is an event from a page subscription
    if (body.object === 'page') {
  
      // Iterates over each entry - there may be multiple if batched
      body.entry.forEach(function(entry) {
  
        // Gets the message. entry.messaging is an array, but 
        // will only ever contain one message, so we get index 0
        let webhook_event = entry.messaging[0];
        console.log(webhook_event);

         // Get the sender PSID
        let sender_psid = webhook_event.sender.id;
        console.log('Sender PSID: ' + sender_psid);

        // Check if the event is a message or postback and
        // pass the event to the appropriate handler function
        if (webhook_event.message) {
            handleMessage(sender_psid, webhook_event.message);        
        } else if (webhook_event.postback) {
            handlePostback(sender_psid, webhook_event.postback);
        } else if (webhook_event.optin){
            handleOptin(sender_psid, webhook_event.optin);
        }
      });
  
      // Returns a '200 OK' response to all requests
      res.status(200).send('EVENT_RECEIVED');
    } else {
      // Returns a '404 Not Found' if event is not from a page subscription
      res.sendStatus(404);
      console.log("404 thing");
    }
    if(one_time_notif_token && count == 0){
        console.log("going");
        sendFollowUp();
        count = 1;
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

  // Handles messages events
function handleMessage(sender_psid, received_message) {

    let response;

    // Check if the message contains text
    if (received_message.text) {    
        // Create the payload for a basic text message
        // response = {
        //     "text": `You sent the message: "${received_message.text}". Now send me an image!`
        // }
        response =  {
              "attachment": {
                "type":"template",
                "payload": {
                  "template_type":"one_time_notif_req",
                  "title":"Hear Back?",
                  "payload":"hello people"
              }
            }
        };

    } else if (received_message.attachments) {
  
        // Gets the URL of the message attachment
        let attachment_url = received_message.attachments[0].payload.url;
        response = {
            "attachment": {
              "type": "template",
              "payload": {
                "template_type": "generic",
                "elements": [{
                  "title": "Is this the right picture?",
                  "subtitle": "Tap a button to answer.",
                  "image_url": "https://i.imgur.com/vVAmpxh.jpeg",
                  "buttons": [
                    {
                      "type": "postback",
                      "title": "Yes!",
                      "payload": "yes",
                    },
                    {
                      "type": "postback",
                      "title": "No!",
                      "payload": "no",
                    }
                  ],
                }]
              }
            }
          }
    } 

    // Sends the response message
    callSendAPI(sender_psid, response);  
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
    let response;
  
    // Get the payload for the postback
    let payload = received_postback.payload;
  
    // Set the response based on the postback payload
    if (payload === 'yes') {
      response = { "text": "Thanks!" }
    } else if (payload === 'no') {
      response = { "text": "Oops, try sending another image." }
    }
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
}


function handleOptin(sender_psid, received_postback) {
    let response;
  
    // Get the payload for the postback
    one_time_notif_token = received_postback.one_time_notif_token;
    console.log(received_postback.payload);//same as ther payload I sent is when handling the text message
    console.log(one_time_notif_token);
    // Create the payload for a basic text message
    response = {
        "text": "Awesome, we'll get back to you when it happens"
    }
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
        console.log(res, body);
    } else {
        console.error("Unable to send message:" + err);
    }
    }); 
}

async function sendFollowUp(){
    // try{
    //     let post = 'https://graph.facebook.com/v11.0/me/messages?access_token=EAAH3r4IwzVIBAD3sqoaXe13buzaWhMCYoUZAz8Q65OAPufn6Pua0sLjR6Xven8JLUPyFDhHjn7VtUZB0Mpgu73oklNFEY7OESbteTj5nP2I1QZAB0vfOdWVUNHmyV4nUBBdrtFHgGe38xS6LazotE5UYZAtPrXVzZB2rgtqMZA8HeMv5XjpBkn8RFZCz7uHR0IUpLnI9ZBKdUQZDZD';
    //     let data = {
    //         "recipient": {
    //           "one_time_notif_token":"one_time_notif_token"
    //         },
    //         "message": {
    //           "text":"Did this work?"
    //         }
    //       }; //should be string?
    //     let config = {headers: {'Content-Type': 'application/json'}};
    //     res = await axios.post(post,data,config);
    //     console.log(res.data);
    // } catch (e){
    //     console.log(e);
    //     console.log("error in followup")
    // }
    let request_body = {
        "recipient": {
            "one_time_notif_token":`${one_time_notif_token}`
        },
        "message": {
            "text":"Did this work?"
        }
    }; 
    request({
        "uri": "https://graph.facebook.com/v11.0/me/messages",
        "qs": { "access_token": "EAAH3r4IwzVIBAD3sqoaXe13buzaWhMCYoUZAz8Q65OAPufn6Pua0sLjR6Xven8JLUPyFDhHjn7VtUZB0Mpgu73oklNFEY7OESbteTj5nP2I1QZAB0vfOdWVUNHmyV4nUBBdrtFHgGe38xS6LazotE5UYZAtPrXVzZB2rgtqMZA8HeMv5XjpBkn8RFZCz7uHR0IUpLnI9ZBKdUQZDZD" },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
    if (!err) {
        console.log('message sent2!');
        console.log(res, body);
    } else {
        console.error("Unable to send message2:" + err);
    }
    }); 
}
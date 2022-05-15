const admin = require('firebase-admin');
const functions = require('firebase-functions');
const cors = require('cors')({ origin: true});
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fir-base-node-default-rtdb.firebaseio.com/"
});

const { SessionsClient } = require('dialogflow');

exports.dialogflowGateway = functions.https.onRequest((request, response) => {
  cors(request, response, async () => {
    try {
      // sessionId as a identifier and queryInput as the object
      // containing the message the user sent
      const { queryInput, sessionId } = request.body;
  
      // set up a new session based on project name and identifier received
      const sessionClient = new SessionsClient({ credentials: serviceAccount });
      const session = sessionClient.sessionPath('fir-base-node', sessionId);
  
      // get response from dialog which tries to detect the proper intent
      const responses = await sessionClient.detectIntent({ session, queryInput});
  
      // and send this response back
      const result = responses[0].queryResult;
      response.send(result);
    } catch (error) {
      console.log('HERE YOU HAVE AN ERROR: ', error);
      response.send('Internal server error');
    }
  });
});

const { WebhookClient } = require('dialogflow-fulfillment');

exports.dialogflowWebhook = functions.https.onRequest(async (request, response) => {
  const agent = new WebhookClient({ request, response });

  // retrive all the intent collected
  const result = request.body.queryResult;
  
  // set welcome response
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
  // set fallback response
  function fallback(agent) {
    agent.add(`Sorry, can you try again?`);
  }
  // set updateProfile fulfillment response
  async function updateProfileHandler(agent) {
    // init firestore 
    const db = admin.firestore();
    // specify collection and identifier to be used
    const profile = db.collection('users').doc(Math.random().toString().slice(-5));

    // retrieve props defined on intent and collected on conversation
    const { name, color } = result.parameters;

    // fill the object instatiated arlier
    await profile.set({ name, color })
    agent.add(`Welcome aboard my friend!`);
  }

  // now we map our agent intents to the functions we just created
  let intentMap = new Map();
  intentMap.set('Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('Update Profile', updateProfileHandler);
  
  // finally we send this map way back
  agent.handleRequest(intentMap);
});
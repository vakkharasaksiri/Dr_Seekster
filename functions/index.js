//https://3636d4e7.ngrok.io/aog-hackday/us-central1/dialogflowFirebaseFulfillment

// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict'
require('firebase-admin')
// const admin = require('firebase-admin');
// admin.initializeApp(functions.config().firebase);
const functions = require('firebase-functions')
const response = require('./lib/response')
const surface = require('./lib/surface')
const permission = require('./lib/permission')
const event = require('./lib/event')
const dailyUpdate = require('./lib/dailyUpdate')
const routineUpdate = require('./lib/routineUpdate')
const notification = require('./lib/notification')
const config = require('./config.json')
const moment = require('moment')

//Database
var admin = require("firebase-admin");

var serviceAccount = require("./config/aog-hackday-firebase-adminsdk-wtlrf-243f8e4b4b.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://aog-hackday.firebaseio.com"
});


const {
  dialogflow,
  Suggestions
} = require('actions-on-google')

const app = dialogflow({
  clientId: config.clientId
})

app.intent('Default Welcome Intent', welcome)
app.intent('Simple Response', response.simpleResponse)
app.intent('Basic Card', response.basicCard)
app.intent('Surface checking', surface.surfaceChecking)
app.intent('Ask for Permission', permission.askForPermission)
app.intent('Ask for Date Permission', permission.askForDatePermission)
app.intent('Ask for Sign in', permission.askForSignIn)
app.intent('This is cancel', cancel)
app.intent('Conversation with params', conversataionWithParams)
app.intent('Conversation with params - yes', conversataionWithParamsYes)
app.intent('Setup Daily update', dailyUpdate.setupDailyUpdate)
app.intent('Setup Routine', routineUpdate.setupRoutine)
app.intent('Setup Notification', notification.setupNotification)

//Seekster
app.intent('Job_Request', jobRequest)
app.intent('Job_Request - yes', jobRequestYes)
app.intent('When_Job', whenJob)
//app.intent('Job_Request - date - yes', jobRequestDateYes)

// intent for listen event
app.intent('ask_for_permission_confirmation', event.confirmPermission)
app.intent('ask_for_datetime_confirmation', event.confirmDatePermission)
app.intent('ask_for_sign_in_confirmation', event.confirmSignIn)
app.intent('actions_intent_NO_INPUT', event.noInput)
app.intent('Finish Update Routine Setup', dailyUpdate.finish)

function jobRequest (conv,params) {
  
  console.log(params)
  console.log(conv.body.queryResult.languageCode)
  const date2 = moment(params['date'])
  const time2 = moment(params['time'])
  conv.user.storage.dateBook = params['date']
  conv.user.storage.timeBook = params['time']
  console.log(conv.user.storage.dateBook)
  if(conv.body.queryResult.languageCode=="en-us"){
    conv.ask(`Do you confirm the cleaner at ${time2.format("LT")} on ${date2.format("MMM Do YYYY")}?`)
  }
  else{
    conv.ask(`คุณต้องการทำความสะอาดตอน ${time2.format("LT")} วันที่ ${date2.format("MMM Do YYYY")}?`)
  }
}

function jobRequestYes (conv,params) {
  console.log(params)
  const date2 = moment(conv.user.storage.dateBook)
  if(conv.body.queryResult.languageCode=="en-us"){
    conv.close(`You booking have been confirmed.`)
  }
  else{
    conv.close(`โอเคฉันจองให้คุณแล้ว`)
  }
  //return admin.database().ref('/service').push({date2: date2});
}

function whenJob(conv,params){
  const date2 = moment(conv.user.storage.dateBook)
  const time2 = moment(conv.user.storage.timeBook)
  if(conv.body.queryResult.languageCode=="en-us"){
    conv.close(`Your next booking is at ${time2.format("LT")} on ${date2.format("MMM Do YYYY")}`)
  }
  else{
    conv.close(`คุณได้เรียกใช้งานSeekster วันที่ ${date2.format("LT")} เวลา ${time2.format("MMM Do YYYY")}`)
  }
}




// function jobRequestDateYes (conv,params) {
//   console.log(params)
//   conv.ask(`Your booking is confirmed at ${params['date']}`)
// }

function conversataionWithParams (conv, params) {
  console.log(params)
  if(conv.body.queryResult.languageCode=="en-us"){
    conv.ask(`Do you confirm to order ${params['number-integer']} ${params['menu']}?`)
  }
  else{
    conv.ask(`คุณยืนยันการจอง ${params['number-integer']} ${params['menu']}?`)
  }
}

function conversataionWithParamsYes (conv, params) {
  console.log(params)
  conv.ask(`I will process to order now`)
  
}

function welcome (conv) {
  console.log(conv.body.queryResult.languageCode)
  if(conv.body.queryResult.languageCode=="en-us"){
    conv.ask('Hi, how can I help you?')
    conv.ask(new Suggestions(['Hire a Maid']))
  }
  else{
    conv.ask(`    สวัสดีผมช่วยอะไรคุณได้บ้างครับ`)
    conv.ask(new Suggestions(['เรียกแม่บ้าน']))
  }
  

  // Save to user storage
  conv.user.storage.count = 1
  // Save to conversation storage
  conv.data.count = 1
}

function cancel (conv) {
  conv.ask('This is cancel')
}

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app)

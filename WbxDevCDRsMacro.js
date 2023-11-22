/*
# Webex Device CDR
# Written by Jeremy Willans, Stephane Cohen 
# Version: 1.0
#
# USE AT OWN RISK, MACRO NOT FULLY TESTED NOR SUPPLIED WITH ANY GUARANTEE
#
# Usage -
#  This macro will send "call info" details at the end of each call
#  The data can sent to a Webex Space or HTTP Server (POST) inluding Power BI.
#
# Change History
# 1.0 20231120 Initial Release based on https://github.com/jeremywillans/roomos-macros 2.0 
#
*/

import xapi from 'xapi';

// Webex Space Parameters
const webexEnabled = true; // Enable for Webex Space Message Logging
const roomId = 'XXX'; // Specify a Room ID
const botTkn = 'XXX'; // Specify a BOT ACCESS Token

// HTTP JSON Post Parameters
const httpEnabled = true; // Enable for JSON HTTP POST Destination
const httpUrl = 'https://XXX.requestcatcher.com/'
const httpAuthorization = 'supersecret123'; // Authorization Header Content for HTTP POST
const httpPowerBi = false ; // Enable if destination service is Power BI Streaming Dataset

// Global Parameters
const debugMode = true; // Enable extended logging to debug console

// ----- EDIT BELOW THIS LINE AT OWN RISK ----- //
const webexAuth = `Authorization: Bearer ${botTkn}`;
const contentType = 'Content-Type: application/json';
const acceptType = 'Accept: application/json';
const webexMessageUrl = 'https://webexapis.com/v1/messages'; // Message URL
const httpAuth = `Authorization: ${httpAuthorization}`;
const vimtDomain = '@m.webex.com';
const googleDomain = 'meet.google.com';
const msftDomain = 'teams.microsoft.com';
const zoomDomain = '(@zm..\.us|@zoomcrc.com)';
const pexipDomain = '@pexip.com';

// global variables
//
let callInfo = {};  // our copy of call Disconnect event obj 
const systemInfo = {};
let errorResult = false;
let skipLog = false;
let callDestination = false;
let callMatched = false;

// Initialize Variables
function initVariables() {
  errorResult = false;
  skipLog = false;
  callDestination = false;
  callMatched = false;
}

// Sleep Function
async function sleep(ms) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Time Formatter
function formatTime(seconds) {
  const d = Math.floor((seconds / 3600) / 24);
  const h = Math.floor((seconds / 3600) % 24);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 3600 % 60);
  const dDisplay = d > 0 ? d + (d === 1 ? (h > 0 || m > 0 ? ' day, ' : ' day') : (h > 0 || m > 0 ? ' days, ' : ' days')) : '';
  const hDisplay = h > 0 ? h + (h === 1 ? (m > 0 || s > 0 ? ' hour, ' : ' hour') : (m > 0 || s > 0 ? ' hours, ' : ' hours')) : '';
  const mDisplay = m > 0 ? m + (m === 1 ? ' minute' : ' minutes') : '';
  const sDisplay = s > 0 ? s + (s === 1 ? ' second' : ' seconds') : '';

  if (m < 1) {
    return `${dDisplay}${hDisplay}${mDisplay}${sDisplay}`;
  }

  return `${dDisplay}${hDisplay}${mDisplay}`;
}

// Post content to Webex Space
async function postContent() {
  if (debugMode) console.debug('Process postContent function');
  let blockquote;

  let markdown = (`**System Name:** ${systemInfo.systemName}  \n**Serial Number:** ${systemInfo.serialNumber}  \n**SW Release:** ${systemInfo.softwareVersion}`);
  // if (callDestination) { markdown += `\n**Destination:** \`${callDestination}\`  \n**Call Type:** ${formatType(callType)}`; }
  if (callDestination) { markdown += `  \n**Call Destination:** ${callDestination}`; }
  if (callInfo.Duration) { markdown += `  \n**Call Duration:** ${formatTime(callInfo.Duration)}`; }
  if (callInfo.CauseType) { markdown += `  \n**Disconnect Cause:** ${callInfo.CauseType}`; }

  const messageContent = { roomId, markdown };

  try {
    const result = await xapi.command('HttpClient Post', { Header: [contentType, acceptType, webexAuth], Url: webexMessageUrl }, JSON.stringify(messageContent));
    if (result.StatusCode !== '200') {
      console.error(`postContent response: ${result}`);
      errorResult = true;
    }
    console.debug('postContent message sent.');
  } catch (error) {
    console.error(`postContent error: ${error.message}`);
    errorResult = true;
  }
}

// Post JSON content to HTTP Server
async function postJSON() {
  console.debug('Process postJSON function');
  let timestamp = Date.now();
  if (httpPowerBi) {
    const ts = new Date(timestamp);
    timestamp = ts.toISOString();
  }
  let messageContent = callInfo
  messageContent.system=systemInfo.systemName
  messageContent.destination=callDestination

  if (httpPowerBi) {
    messageContent = [messageContent];
  }

  console.debug(`Posting to ${httpUrl}`);
  console.debug(messageContent)

  try {
    const result = await xapi.command('HttpClient Post', { Header: [contentType, acceptType, httpAuth], Url: httpUrl }, JSON.stringify(messageContent));
    if (result.StatusCode.match(/20[04]/)) {
      if (debugMode) console.debug('postJSON message sent.');
      return;
    }
    console.error(`postJSON status: ${result.StatusCode}`);
    if (result.message && debugMode) {
      console.debug(result.message);
    }
  } catch (error) {
    console.error('postJSON error encountered');
    console.debug(error.message);
  }
}

// Process enabled services
async function processRequest() {
  if (httpEnabled) {
    postJSON();
  }

  if (webexEnabled) {
    await postContent();
  }
  await sleep(600);
  if (debugMode) console.debug('Init Variables');
  initVariables();
}

// Process Call Disconnect event
xapi.Event.CallDisconnect.on((event) => {
  callInfo = event;
  if (debugMode) console.debug('in CallDisconnect Evt');
  if (debugMode) console.debug(event);
  callInfo.Duration = Number(event.Duration);
  processRequest()
});

// called by outgoing call indication and status active calls == 1 EVTs
// sets globals : callDestination 
// SC : we won't use the call classification... just retain pertinent data 
async function processCall() {
  
  if (debugMode) console.debug('in processCall');
  
  let call;
  try {
    [call] = await xapi.Status.Call.get();
    if (debugMode) console.debug(call);
  } catch (e) {
    // No Active Call
    return;
  }
  callDestination = call.CallbackNumber;
}

xapi.Status.SystemUnit.State.NumberOfActiveCalls.on(async (numCalls) => {
  console.log(`Got NumberOfActiveCalls Evt : ${numCalls}`);
  if (numCalls === '1') {
    processCall();
  }
});

// Debugging Buttons
xapi.Event.UserInterface.Extensions.Panel.Clicked.on((event) => {
  if (event.PanelId === 'test_services') {
    callInfo.Duration = 15;
    callInfo.CauseType = 'LocalDisconnect';
    // callType = 'webex';
    callDestination = 'spark:123456789@webex.com';
    skipLog = true;
    processRequest();
  }
});

// Initialize Function
// set systemInfo obj
// 
async function init() {
  // Get System Name / Contact Name
  systemInfo.systemName = await xapi.Status.UserInterface.ContactInfo.Name.get();
  // Get System SN
  systemInfo.serialNumber = await xapi.Status.SystemUnit.Hardware.Module.SerialNumber.get();
  if (systemInfo.systemName === '') {
    systemInfo.systemName = systemInfo.serialNumber;
  }
  // Get SW Version
  systemInfo.softwareVersion = await xapi.Status.SystemUnit.Software.Version.get();
  // HTTP Client needed for sending outbound requests
  await xapi.Config.HttpClient.Mode.set('On');
  initVariables();
}

init();

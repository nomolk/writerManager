// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar";

var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;
  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
    initView();
  } else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

async function getEvents(calenderId) {
  var startDate = new Date();
  var endDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  endDate.setMonth(endDate.getMonth() + 2);
  response = await gapi.client.calendar.events.list({
    'calendarId': calenderId,
    'timeMin': startDate.toISOString(),
    'timeMax': endDate.toISOString(),
    'showDeleted': false,
    'singleEvents': true,
    'maxResults': 100,
    'orderBy': 'startTime'
  });
  return response.result.items;
}

async function getSingleEvent(calenderId, eventId) {
  response = await gapi.client.calendar.events.get({
    'calendarId': calenderId,
    'eventId': eventId
  });
  return response.result.item;
}

async function getPersonalCalendar(){
  return await getEvents(PERSONAL_CALENDER_ID);
}

async function getSiteCalendar(){
  return await getEvents(SITE_CALENDER_ID);
}

async function getCalendarList(){
  response = await gapi.client.calendar.calendarList.list();
  return response.result.items;
}

async function updateEvent(calenderId, eventId, description) {
  var event = getSingleEvent(calenderId, eventId);
  event.description = description;
  response = await gapi.client.calendar.events.patch({
    'calendarId': calenderId,
    'eventId': eventId,
    'resource': event
  });
  return (response.status == 200)
}

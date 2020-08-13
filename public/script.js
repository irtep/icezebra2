import { firebaseConfig } from './config.js';
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const listenSend = document.getElementById('sendMsg').addEventListener('click', sMbuttonClicked);
const messageLine = document.getElementById('chatInput');
const messut = document.getElementById('chatWindow');
const customersName = document.getElementById('customersName');
const listenName = document.getElementById('submitName').addEventListener('click', subName);
const myChat = {
  docRefId: null,
  id: null,
  myName: null,
  messages: [],
  helperOnline: false,
  helperId: null
};
// event listener for enter:
messageLine.addEventListener("keydown", function (e) {
  if (e.keyCode === 13) {  //checks whether the pressed key is "Enter"
    if (myChat.myName === null) {
      subName();
    } else {
      if (messageLine.value !== '') {
        const freshMsg = sendMessage(myChat.myName, messageLine.value);
        messageLine.value = '';
        myChat.messages.push(freshMsg);
        console.log('myChat: ', myChat);
        db.collection('chats').doc(myChat.docRefId).update({
          messages: myChat.messages
        });
      }
    }
  }
});
// makes correct message line
function sendMessage(myName, myMessage){
  const d = new Date();
  const h = d.getHours();
  const m = d.getMinutes();
  const s = d.getSeconds();
  const newMsg = messageLine.value;
  const allMsg = `<br>${h}:${m}:${s} ${myName}: ${myMessage}`;
  return allMsg;
}
// sendMessageButton clicked
function sMbuttonClicked() {
  if (messageLine.value !== '') {
    const freshMsg = sendMessage(myChat.myName, messageLine.value);
    messageLine.value = '';
    myChat.messages.push(freshMsg);
    console.log('sending, docrefid...', myChat);
    db.collection('chats').doc(myChat.docRefId).update({
      messages: myChat.messages
    });
  }
}
// submits customers name
function subName() {
  myChat.myName = customersName.value;
  if (customersName.value === '') {
    const rdNbr =  1 + Math.floor(Math.random() * 100);
    myChat.myName = 'tuntematon asiakas ' + rdNbr;
  }
  // show what need to show, and dont want dont
  document.getElementById('mainPart').classList.remove('noShow');
  document.getElementById('askName').classList.add('noShow');
  messageLine.focus();
  // create chat id stamp
  myChat.id = new Date().getTime() + myChat.myName;
  // sign in to firebase
  firebase.auth().signInAnonymously().catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
  // ...
  });
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in.
      console.log('logged in');
        // check if any service agents online
        db.collection('agentsOnline').get().then((querySnapshot) => {
          querySnapshot.forEach( snap => {
            console.log('how many: ', snap.data().howManyAgents);
            // if 0 agents online:
            if (snap.data().howManyAgents === 0) {
              messut.innerHTML = `Chat on tällä hetkellä kiinni. Mutta lähetä meille emailia (support(a)trident-finland.fi)
              tai koita uudelleen myöhemmin.`;
              // hide irrelevant stuff
              document.getElementById('sendMsg').classList.add('noShow');
              document.getElementById('chatInput').classList.add('noShow');
            } else {
              const customerEnters = sendMessage(myChat.myName, 'avasi chatin.');
              myChat.messages.push(customerEnters);
              // start connection check db
              const seconds = new Date().getTime() / 1000;
              db.collection('connectionCheck').doc(myChat.id).set({
                lastCheck: seconds
              });
              // this will send connection check to server,
              // if this will not be received, the chat will be terminated
              setInterval( () => {
                console.log('sending connectionCheck');
                const newSeconds = new Date().getTime() / 1000;
                db.collection('connectionCheck').doc(myChat.id).update({
                  lastCheck: newSeconds
                });
              }, 30000);
              // start chat db
              db.collection("chats").doc(myChat.id).set({
                chatId: myChat.id,
                name: myChat.myName,
                messages: myChat.messages,
                hasAgent: false,
                agent: null,
                terminated: false,
                borders: 'yellowBorders',
                docRefId: myChat.id
              });
              myChat.docRefId = myChat.id;
            } // if agents online ends
          });
        }); // agents online check ends
      } else {
        console.log('error in logging in');
      }
  }); // on authChange ends
  messageLine.focus();
}
// real-time listener
db.collection("chats").orderBy("name").onSnapshot(snapshot => {
  let changes = snapshot.docChanges();
  changes.forEach(change => {
    //console.log(change.doc.data());
    if (change.type == "added") {
      if (change.doc.data().chatId === myChat.id) {
        messut.innerHTML += change.doc.data().messages;
      }
    } else if (change.type == "removed") {
      //console.log('change type removed');
    } else if (change.type === 'modified') {
      if (change.doc.data().chatId === myChat.id) {
        messut.innerHTML += change.doc.data().messages[change.doc.data().messages.length - 1];
        myChat.messages.push(change.doc.data().messages[change.doc.data().messages.length - 1]);
        // scrolling to down
        messut.scrollTop = messut.scrollHeight;
      }
    }
  });
});
// when window is loaded
window.onload = ( ()=> {
  // focus on command line:
  customersName.focus();
});
//window.onbeforeunload = ( ()=> {
 // this doesnt really work.. closing is too fast, gotta do pinging system to decide when user is disconnected.
/*
 const customerLeaves = sendMessage(myChat.myName, 'sulki chatin.');
 myChat.messages.push(customerLeaves);
 db.collection('chats').doc(myChat.docRefId).update({
   messages: myChat.messages,
   terminated: true
 });
 // Delete old chat from database
 db.collection("chats").doc(myChat.docRefId).delete();
});
*/

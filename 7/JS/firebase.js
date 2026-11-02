import { 
    initializeApp 
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
    getDatabase,
    ref,
    get,
    push,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyANqe9MKdfwNW1RDuWYFquov_wxcxxvx7k",
    authDomain: "web-app-with-firebase-p6.firebaseapp.com",
    databaseURL:"https://web-app-with-firebase-p6-default-rtdb.firebaseio.com/",
    projectId: "web-app-with-firebase-p6",
    storageBucket: "web-app-with-firebase-p6.firebasestorage.app",
    messagingSenderId: "720693819643",
    appId: "1:720693819643:web:564dbe66d4ccd6aca3585e"
};
 
const firebaseApp = initializeApp(FIREBASE_CONFIG);
export const auth = getAuth(firebaseApp);
export const database = getDatabase(firebaseApp);
 
export{
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
    ref,
    get,
    push,
    serverTimestamp
};
 
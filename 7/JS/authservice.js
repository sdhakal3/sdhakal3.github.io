import {
    auth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from "./firebase.js";
 
export async function signUp(email, password){
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    return credential.user;
}
 
export async function logIn(email, password){
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
}
export function logOut(){
    return signOut(auth);
}
 
export async function changePassword(currentPassword, newPassword){
    const user = auth.currentUser;
    if (user === null || !user.email) {
        const error = new Error("Nobody is signed in.");
        error.code = "app/not-signed-in";
        throw error;
    }
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
}
// Calls a function now and every time the user signs in or out
export function watchSignInState(onChange){
    return onAuthStateChanged(auth, onChange);
}
 
// waits for firebase to finish restoring the saved session (but only once)

export function waitForSignInState(){
    return new Promise(resolve => {
        const stopWatching = onAuthStateChanged(auth, user => {
            stopWatching();
            resolve(user);
        });
    });
}
 
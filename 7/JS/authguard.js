import { 
    watchSignInState 
} from "./authservice.js";
 
const CHECKING_CLASS = "checking_auth";
const LOGIN_PAGE_URL = new URL("../login_page/index.html?reason=login-required", import.meta.url).href;
 
// reveals only when user is logged in
function revealPage(){
    document.documentElement.classList.remove(CHECKING_CLASS);
}
/** Replaces this page in history with the login page, so Back does not loop. */
function sendToLoginPage(){
    window.location.replace(LOGIN_PAGE_URL);
}
// reacts to log in changes across sites
function handleSignInChange(user) {
    if (user === null) {
        sendToLoginPage();
    } else {
        revealPage();
    }
}
watchSignInState(handleSignInChange);
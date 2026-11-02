import { 
    watchSignInState, 
    logOut 
} from "./authservice.js";
import { 
    createElement 
} from "./domhelper.js";
 
const AUTH_CONTROL_ID = "authLink";
const HOME_URL = new URL("../index.html", import.meta.url).href;
const LOGIN_URL = new URL("../login_page/index.html", import.meta.url).href;
 
const LABELS = {
    login: "Login",
    logout: "Log out",
    loggingOut: "Logging out...",
    logoutFailed: "Could not log out. Try again."
};
async function handleLogoutClick(event) {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = LABELS.loggingOut;
    try {
        await logOut();
        window.location.assign(HOME_URL);
    } catch {
        button.disabled = false;
        button.textContent = LABELS.logoutFailed;
    }
}
 
// nav link for login page
function createLoginLink() {
    return createElement("a", { id: AUTH_CONTROL_ID, href: LOGIN_URL }, LABELS.login);
}
function createLogoutButton() {
    const button = createElement("button",
        { id: AUTH_CONTROL_ID, type: "button", class: "nav_button" }, LABELS.logout);
    button.addEventListener("click", handleLogoutClick);
    return button;
}
function updateAuthControl(user) {
    const currentControl = document.getElementById(AUTH_CONTROL_ID);
    if (currentControl === null) {
        return;
    }
    const shouldShowLogout = user !== null;
    const isShowingLogout = currentControl.tagName === "BUTTON";
    if (shouldShowLogout !== isShowingLogout) {
        currentControl.replaceWith(shouldShowLogout ? createLogoutButton() : createLoginLink());
    }
}
watchSignInState(updateAuthControl);
 
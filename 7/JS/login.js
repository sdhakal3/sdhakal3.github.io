import { 
    signUp, 
    logIn, 
    logOut, 
    changePassword, 
    watchSignInState 
} from "./authservice.js";
import { 
    runWithFeedback, 
    showStatus, 
    clearStatus } from "./feedback.js";
 
const MIN_PASSWORD_LENGTH = 8;
 
const ELEMENT_IDS = {
    checkingMessage: "authChecking",
    pageNotice: "pageNotice",
    signedOutView: "signedOutView",
    signedInView: "signedInView",
    heading: "authHeading",
    intro: "authIntro",
    showLoginButton: "showLoginButton",
    showSignupButton: "showSignupButton",
    loginForm: "loginForm",
    loginStatus: "loginStatus",
    signupForm: "signupForm",
    signupStatus: "signupStatus",
    accountEmail: "accountEmail",
    logoutButton: "logoutButton",
    logoutStatus: "logoutStatus",
    passwordForm: "passwordForm",
    passwordStatus: "passwordStatus"
};
 
const MODES = { 
    login: "login", 
    signup: "signup" 
};
 
const MODE_TEXT = {
    login: { heading: "Log in", intro: "Log in to explore the instruments and send us feedback." },
    signup: { heading: "Create an account", intro: "Sign up with your email address and a password." }
};
 
const MESSAGES = {
    loggingIn: "Logging in...",
    signingUp: "Creating your account...",
    loggingOut: "Logging out...",
    changingPassword: "Updating your password...",
    passwordChanged: "Your password was updated.",
    passwordTooShort: `Your password needs at least ${MIN_PASSWORD_LENGTH} characters.`,
    passwordsDiffer: "The two passwords do not match.",
    sameAsCurrent: "Your new password must be different from your current one.",
    loginRequired: "Please log in or sign up to see that page."
};
 
const LOGIN_REQUIRED_REASON = "login-required";
 
function findElements(){
    const elements = {};
    for (const [name, id] of Object.entries(ELEMENT_IDS)) {
        elements[name] = document.getElementById(id);
    }
    return elements;
}

function findPasswordProblem(password, confirmation){
    if (password.length < MIN_PASSWORD_LENGTH) {
        return MESSAGES.passwordTooShort;
    }
    if (password !== confirmation) {
        return MESSAGES.passwordsDiffer;
    }
    return null;
}
function showMode(elements, mode){
    const isLogin = mode === MODES.login;
    elements.loginForm.hidden = !isLogin;
    elements.signupForm.hidden = isLogin;
    elements.showLoginButton.setAttribute("aria-pressed", String(isLogin));
    elements.showSignupButton.setAttribute("aria-pressed", String(!isLogin));
    elements.heading.textContent = MODE_TEXT[mode].heading;
    elements.intro.textContent = MODE_TEXT[mode].intro;
    clearStatus(elements.loginStatus);
    clearStatus(elements.signupStatus);
}

function showViewForUser(elements, user){
    elements.checkingMessage.hidden = true;
    elements.signedInView.hidden = user === null;
    elements.signedOutView.hidden = user !== null;
    if (user !== null) {
        elements.accountEmail.textContent = user.email;
        elements.pageNotice.hidden = true;
    } else {
        showMode(elements, MODES.login);
    }
}
async function handleLoginSubmit(elements, event){
    event.preventDefault();
    const form = event.currentTarget;
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;
    const succeeded = await runWithFeedback({
        submitButton: form.querySelector("button[type=submit]"),
        statusContainer: elements.loginStatus,
        workingText: MESSAGES.loggingIn,
        successText: null,
        task: () => logIn(email, password)
    });
    if (succeeded) {
        form.reset();
    }
}
async function handleSignupSubmit(elements, event){
    event.preventDefault();
    const form = event.currentTarget;
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;
    const problem = findPasswordProblem(password, form.elements.confirmation.value);
    if (problem !== null) {
        showStatus(elements.signupStatus, "error", problem);
        return;
    }
    const succeeded = await runWithFeedback({
        submitButton: form.querySelector("button[type=submit]"),
        statusContainer: elements.signupStatus,
        workingText: MESSAGES.signingUp,
        successText: null,
        task: () => signUp(email, password)
    });
    if (succeeded) {
        form.reset();
    }
}

async function handlePasswordSubmit(elements, event){
    event.preventDefault();
    const form = event.currentTarget;
    const currentPassword = form.elements.currentPassword.value;
    const newPassword = form.elements.newPassword.value;
    const problem = findPasswordProblem(newPassword, form.elements.confirmation.value);
    if (problem !== null) {
        showStatus(elements.passwordStatus, "error", problem);
        return;
    }
    if (newPassword === currentPassword) {
        showStatus(elements.passwordStatus, "error", MESSAGES.sameAsCurrent);
        return;
    }
    const succeeded = await runWithFeedback({
        submitButton: form.querySelector("button[type=submit]"),
        statusContainer: elements.passwordStatus,
        workingText: MESSAGES.changingPassword,
        successText: MESSAGES.passwordChanged,
        task: () => changePassword(currentPassword, newPassword)
    });
    if (succeeded) {
        form.reset();
    }
}
function handleLogoutClick(elements){
    return runWithFeedback({
        submitButton: elements.logoutButton,
        statusContainer: elements.logoutStatus,
        workingText: MESSAGES.loggingOut,
        successText: null,
        task: logOut
    });
}
 
function addEventListeners(elements){
    elements.showLoginButton.addEventListener("click", () => showMode(elements, MODES.login));
    elements.showSignupButton.addEventListener("click", () => showMode(elements, MODES.signup));
    elements.loginForm.addEventListener("submit", event => handleLoginSubmit(elements, event));
    elements.signupForm.addEventListener("submit", event => handleSignupSubmit(elements, event));
    elements.passwordForm.addEventListener("submit", event => handlePasswordSubmit(elements, event));
    elements.logoutButton.addEventListener("click", () => handleLogoutClick(elements));
}
function initializeLoginPage(){
    const elements = findElements();
    addEventListeners(elements);
    showRedirectNotice(elements);
    watchSignInState(user => showViewForUser(elements, user));
}
initializeLoginPage();
 
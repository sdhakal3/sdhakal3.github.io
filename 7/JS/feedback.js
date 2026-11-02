import { 
    createElement 
} from "./domhelper.js";
 
const STATUS_KINDS = {
    working: { cssClass: "status_working", role: "status" },
    success: { cssClass: "status_success", role: "status" },
    error: { cssClass: "status_error", role: "alert" }
};
 
const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";
 
const ERROR_MESSAGES = {
    "auth/invalid-credential": "That email and password do not match an account. Check them and try again.",
    "auth/invalid-email": "That email address does not look right. Check it and try again.",
    "auth/user-not-found": "That email and password do not match an account. Check them and try again.",
    "auth/wrong-password": "That email and password do not match an account. Check them and try again.",
    "auth/email-already-in-use": "An account with that email already exists. Try logging in instead.",
    "auth/weak-password": "Please choose a password with at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Please wait a few minutes and try again.",
    "auth/network-request-failed": "Could not reach the server. Check your internet connection and try again.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/requires-recent-login": "Please log out, log back in, and try again.",
    "app/not-signed-in": "Please log in first.",
    "app/login-required": "Please log in to see the instruments.",
    "app/no-data": "The instrument data was not found in the database.",
    "app/timeout": "This is taking too long. Check your connection and try again."
};

export function describeError(error) {
    if (error && ERROR_MESSAGES[error.code]) {
        return ERROR_MESSAGES[error.code];
    }
    if (error && /permission[_ ]denied/i.test(error.message || "")) {
        return "You do not have permission to do that. Try logging in again.";
    }
    return DEFAULT_ERROR_MESSAGE;
}
 
// anti infinite wait
export async function withTimeout(promise, timeoutMs){
    let timerId = null;
    const timeout = new Promise((resolve, reject) => {
        timerId = setTimeout(() => {
            const error = new Error("Timed out.");
            error.code = "app/timeout";
            reject(error);
        }, timeoutMs);
    });
    try {
        return await Promise.race([promise, timeout]);
    } finally {
        clearTimeout(timerId);
    }
}
 
// Shows only one message in status container
export function showStatus(statusContainer, kind, text){
    const { cssClass, role } = STATUS_KINDS[kind];
    const message = createElement("p", { class: `status_item ${cssClass}`, role });
    if (kind === "working") {
        message.append(createElement("span", { class: "spinner", "aria-hidden": "true" }));
    }
    message.append(text);
    statusContainer.replaceChildren(message);
}
// empty status container
export function clearStatus(statusContainer) {
    statusContainer.replaceChildren();
}
 
export async function runWithFeedback({submitButton, statusContainer, workingText, successText, task}){
    submitButton.disabled = true;
    submitButton.setAttribute("aria-busy", "true");
    showStatus(statusContainer, "working", workingText);
    try {
        const result = await task();
        if (successText === null) {
            clearStatus(statusContainer);
        } else {
            const text = typeof successText === "function" ? successText(result) : successText;
            showStatus(statusContainer, "success", text);
        }
        return true;
    } catch (error) {
        showStatus(statusContainer, "error", describeError(error));
        return false;
    } finally {
        submitButton.disabled = false;
        submitButton.removeAttribute("aria-busy");
    }
}
 
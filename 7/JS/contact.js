import { 
    database, 
    ref, 
    push, 
    serverTimestamp 
} from "./firebase.js";
import { 
    waitForSignInState 
} from "./authservice.js";
import { 
    runWithFeedback, 
    showStatus, 
    withTimeout 
} from "./feedback.js";
 
const DATABASE_PATH = "contactMessages";
const SAVE_TIMEOUT_MS = 10000;
 
const ELEMENT_IDS = {
    form: "contactForm",
    status: "contactStatus",
    submitButton: "contactSubmit"
};
const MESSAGES = {
    saving: "Sending your feedback...",
    needHelpedAnswer: "Please tell us whether the site helped you.",
    needSomeText: "Please write something in at least one of the two boxes.",
    needLogin: "Please log in before sending feedback."
};

function readMessageFromForm(form, user){
    const formData = new FormData(form);
    return {
        uid: user.uid,
        name: String(formData.get("name") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        helped: String(formData.get("helped") || ""),
        experience: String(formData.get("experience") || "").trim(),
        improve: String(formData.get("improve") || "").trim()
    };
}
function findMessageProblem(message){
    if (message.helped === "") {
        return MESSAGES.needHelpedAnswer;
    }
    if (message.experience === "" && message.improve === "") {
        return MESSAGES.needSomeText;
    }
    return null;
}
async function saveMessage(message){
    const savedReference = await withTimeout(
        push(ref(database, DATABASE_PATH), { ...message, createdAt: serverTimestamp() }),
        SAVE_TIMEOUT_MS);
    return savedReference.key;
}

function fillEmail(form, user){
    if (user !== null && user.email) {
        form.elements.email.value = user.email;
    }
}
async function handleSubmit(elements, event){
    event.preventDefault();
    const user = await waitForSignInState();
    if (user === null) {
        showStatus(elements.status, "error", MESSAGES.needLogin);
        return;
    }
    const message = readMessageFromForm(elements.form, user);
    const problem = findMessageProblem(message);
    if (problem !== null) {
        showStatus(elements.status, "error", problem);
        return;
    }
    const succeeded = await runWithFeedback({
        submitButton: elements.submitButton,
        statusContainer: elements.status,
        workingText: MESSAGES.saving,
        successText: key => `Thank you! Your feedback was received and saved. Reference number: ${key}`,
        task: () => saveMessage(message)
    });
    if (succeeded) {
        elements.form.reset();
        fillEmail(elements.form, user);
    }
}
async function initializeContactPage(){
    const elements = {
        form: document.getElementById(ELEMENT_IDS.form),
        status: document.getElementById(ELEMENT_IDS.status),
        submitButton: document.getElementById(ELEMENT_IDS.submitButton)
    };
    elements.form.addEventListener("submit", event => handleSubmit(elements, event));
    fillEmail(elements.form, await waitForSignInState());
}
initializeContactPage();
 
import { 
    database, 
    ref, 
    get 
} from "./firebase.js";
import { 
    waitForSignInState 
} from "./authservice.js";
import { 
    createElement 
} from "./domhelper.js";
import { describeError, 
    withTimeout 
} from "./feedback.js";

/* ---------- Constants ---------- */

const DATABASE_PATH = "families";
const IMAGE_DIR = "../img/";
const EXTRA_INFO_URL = "../extra_info/index.html";
const LOAD_TIMEOUT_MS = 10000;
const ELEMENT_IDS = {
    appRoot: "app",
    prompt: "prompt",
    backButton: "back"
};

const CSS_CLASSES = {
    choiceRow: "families",
    choiceButton: "family",
    choiceLabel: "family_name",
    cardList: "cards",
    card: "card",
    figure: "img_container",
    imageBox: "img_box",
    clefOnlyBox: "clef_box",
    instrumentImage: "instrument_img",
    rangeImage: "range_img",
    clefImage: "clef_img",
    seatingImage: "seating_img",
    songList: "songs",
    song: "song",
    songImage: "song_img",
    nextSteps: "next_steps",
    actionButton: "action_button",
    visuallyHidden: "visually_hidden",
    statusMessage: "status_message"
};
const MESSAGES = {
    loading: "Loading instruments...",
    chooseFamily: "Choose an instrument family to start.",
    backToFamilies: "\u2190 Back to families",
    loadFailed: "Sorry, the instrument data could not be loaded.",
    retry: "Try again",
    chooseDifferentFamily: "Choose a different family",
    reviewBasics: "Review the music theory basics",
    nextStepsHeading: "What would you like to do next?",
    rangeAndClefHeading: "Musical range and clef",
    piecesHeading: "Popular songs/pieces that feature the instrument:",
    referencesHeading: "References",
    opensInNewTab: " (opens in a new tab)"
};

function createFigure(image, imageClass) {
    return createElement("figure", { class: CSS_CLASSES.figure },
        createElement("img", { src: IMAGE_DIR + image.src, alt: image.alt, class: imageClass }),
        createElement("figcaption", {}, image.caption));
}

function createFootnoteMarker(number){
    const link = createElement("a",
        { href: `#fn${number}`, id: `ref${number}`, title: "Jump to footnote" }, `[${number}]`);
    return createElement("sup", {}, link);
}

function createChoiceButton(choice, onChoose){
    const button = createElement("button",
        { type: "button", class: `${CSS_CLASSES.choiceButton} ${choice.id}` },
        createElement("span", { class: CSS_CLASSES.choiceLabel }, choice.name));
    button.addEventListener("click", () => onChoose(choice));
    return button;
}

function createChoiceRow(choices, onChoose){
    const row = createElement("div", { class: CSS_CLASSES.choiceRow });
    row.append(...choices.map(choice => createChoiceButton(choice, onChoose)));
    return row;
}
function createActionButton(label, onClick){
    const button = createElement("button",
        { type: "button", class: CSS_CLASSES.actionButton }, label);
    button.addEventListener("click", onClick);
    return button;
}

function createIntroCard(instrument){
    return createElement("section", { class: CSS_CLASSES.card },
        createFigure(instrument.image, CSS_CLASSES.instrumentImage),
        createElement("h2", {}, instrument.whatTitle),
        createElement("p", {}, instrument.intro, createFootnoteMarker(1)));
}

function createRangeCard(instrument){
    const hasRangeImage = instrument.range.image !== null;
    const boxClasses = hasRangeImage
        ? CSS_CLASSES.imageBox
        : `${CSS_CLASSES.imageBox} ${CSS_CLASSES.clefOnlyBox}`;
    const imageBox = createElement("div", { class: boxClasses });
    if (hasRangeImage) {
        imageBox.append(createFigure(instrument.range.image, CSS_CLASSES.rangeImage));
    }
    imageBox.append(createFigure(instrument.clef.image, CSS_CLASSES.clefImage));

    return createElement("section", { class: CSS_CLASSES.card },
        imageBox,
        createElement("h2", {}, MESSAGES.rangeAndClefHeading),
        createElement("p", {}, instrument.range.text, createFootnoteMarker(2)),
        createElement("p", {}, instrument.clef.text, createFootnoteMarker(3)));
}
function createSeatingCard(instrument){
    return createElement("section", { class: CSS_CLASSES.card },
        createFigure(instrument.seating.image, CSS_CLASSES.seatingImage),
        createElement("h2", {}, instrument.seatTitle),
        createElement("p", {}, instrument.seating.text, createFootnoteMarker(4)));
}

function createPieceFigure(piece){
    const link = createElement("a", { href: piece.url, target: "_blank", rel: "noopener" },
        createElement("img", { src: IMAGE_DIR + piece.cover, alt: piece.alt, class: CSS_CLASSES.songImage }),
        createElement("span", { class: CSS_CLASSES.visuallyHidden }, MESSAGES.opensInNewTab));
    const caption = createElement("figcaption", {},
        createElement("strong", {}, piece.composer), createElement("br"), piece.title);
    return createElement("figure", { class: CSS_CLASSES.song }, link, caption);
}

function createPiecesCard(instrument){
    const songList = createElement("div", { class: CSS_CLASSES.songList });
    songList.append(...instrument.pieces.map(createPieceFigure));
    return createElement("section", { class: CSS_CLASSES.card },
        createElement("h2", {}, MESSAGES.piecesHeading), songList);
}

function createReferencesCard(instrument){
    const list = createElement("ol");
    instrument.references.forEach((reference, index) => {
        const link = createElement("a", { href: reference.url }, reference.title);
        list.append(createElement("li", { id: `fn${index + 1}` },
            `${reference.source}, \u201C`, link, "\u201D."));
    });
    return createElement("section", { class: CSS_CLASSES.card },
        createElement("h2", {}, MESSAGES.referencesHeading), list);
}

function createNextStepsCard(family, onPickInstrument, onPickFamily){
    const actions = createElement("div", { class: CSS_CLASSES.nextSteps },
        createActionButton(`Explore another ${family.name.toLowerCase()} instrument`, onPickInstrument),
        createActionButton(MESSAGES.chooseDifferentFamily, onPickFamily),
        createElement("a", { href: EXTRA_INFO_URL, class: CSS_CLASSES.actionButton }, MESSAGES.reviewBasics));
    return createElement("section", { class: CSS_CLASSES.card },
        createElement("h2", {}, MESSAGES.nextStepsHeading), actions);
}

function findPageElements(){
    return {
        appRoot: document.getElementById(ELEMENT_IDS.appRoot),
        promptElement: document.getElementById(ELEMENT_IDS.prompt),
        backButton: document.getElementById(ELEMENT_IDS.backButton)
    };
}

function updateBackButton(backButton, backSettings){
    backButton.hidden = backSettings === null;
    backButton.onclick = backSettings === null ? null : backSettings.onBack;
    if (backSettings !== null) {
        backButton.textContent = backSettings.label;
    }
}
function displayContent(pageElements, content, promptText, backSettings, shouldMoveFocus){
    pageElements.promptElement.textContent = promptText;
    pageElements.appRoot.replaceChildren(content);
    pageElements.appRoot.removeAttribute("aria-busy");
    updateBackButton(pageElements.backButton, backSettings);
    if (shouldMoveFocus) {
        pageElements.promptElement.focus();
    }
    window.scrollTo(0, 0);
}

function showLoadingMessage(pageElements){
    pageElements.appRoot.setAttribute("aria-busy", "true");
    pageElements.promptElement.textContent = MESSAGES.loading;
    updateBackButton(pageElements.backButton, null);
    pageElements.appRoot.replaceChildren(
        createElement("p", { class: CSS_CLASSES.statusMessage, role: "status" }, MESSAGES.loading));
}

function showLoadError(pageElements, errorText, onRetry){
    pageElements.appRoot.removeAttribute("aria-busy");
    pageElements.promptElement.textContent = MESSAGES.loadFailed;
    const message = createElement("div", { class: CSS_CLASSES.statusMessage, role: "alert" },
        createElement("p", {}, MESSAGES.loadFailed),
        createElement("p", {}, errorText),
        createActionButton(MESSAGES.retry, onRetry));
    pageElements.appRoot.replaceChildren(message);
}

function showFamilyStep(context, shouldMoveFocus){
    const row = createChoiceRow(context.families,
        family => showStep(context, { family, instrument: null }, true));
    displayContent(context.pageElements, row, MESSAGES.chooseFamily, null, shouldMoveFocus);
}
function showInstrumentStep(context, family){
    const row = createChoiceRow(family.instruments,
        instrument => showStep(context, {family, instrument}, true));
    const backSettings = {
        label: MESSAGES.backToFamilies,
        onBack: () => showStep(context, {family: null, instrument: null}, true)
    };
    displayContent(context.pageElements, row,
        `Now pick a ${family.name.toLowerCase()} instrument.`, backSettings, true);
}

function showDetailStep(context, family, instrument){
    const showFamilyInstruments = () => showStep(context, { family, instrument: null }, true);
    const showFamilies = () => showStep(context, { family: null, instrument: null }, true);

    const cards = createElement("div", { class: CSS_CLASSES.cardList });
    cards.append(
        createIntroCard(instrument),
        createRangeCard(instrument),
        createSeatingCard(instrument),
        createPiecesCard(instrument),
        createReferencesCard(instrument),
        createNextStepsCard(family, showFamilyInstruments, showFamilies));

    const backSettings = {
        label: `\u2190 Back to ${family.name.toLowerCase()}`,
        onBack: showFamilyInstruments
    };
    displayContent(context.pageElements, cards,
        `You picked ${instrument.name.toLowerCase()}!`, backSettings, true);
}

function showStep(context, selection, shouldMoveFocus){
    if (selection.family === null) {
        showFamilyStep(context, shouldMoveFocus);
    } else if (selection.instrument === null) {
        showInstrumentStep(context, selection.family);
    } else {
        showDetailStep(context, selection.family, selection.instrument);
    }
}

function toList(value){
    if (Array.isArray(value)) {
        return value.filter(item => item !== null && item !== undefined);
    }
    return value ? Object.values(value) : [];
}

function normalizeInstrument(rawInstrument){
    return {
        ...rawInstrument,
        range: { ...rawInstrument.range, image: rawInstrument.range.image ?? null },
        pieces: toList(rawInstrument.pieces),
        references: toList(rawInstrument.references)
    };
}

function normalizeFamilies(rawFamilies){
    return toList(rawFamilies).map(family => ({
        ...family,
        instruments: toList(family.instruments).map(normalizeInstrument)
    }));
}
async function fetchInstrumentFamilies(){
    const user = await waitForSignInState();
    if (user === null) {
        throw Object.assign(new Error("Login required."), {code: "app/login-required"});
    }
    const snapshot = await withTimeout(get(ref(database, DATABASE_PATH)), LOAD_TIMEOUT_MS);
    if (!snapshot.exists()) {
        throw Object.assign(new Error("No data."), {code: "app/no-data" });
    }
    return normalizeFamilies(snapshot.val());
}

// loads and starts the two step process
async function loadAndStart(pageElements){
    showLoadingMessage(pageElements);
    try {
        const families = await fetchInstrumentFamilies();
        const context = { pageElements, families };
        showStep(context, { family: null, instrument: null }, false);
    } catch (error) {
        showLoadError(pageElements, describeError(error), () => loadAndStart(pageElements));
    }
}
loadAndStart(findPageElements());
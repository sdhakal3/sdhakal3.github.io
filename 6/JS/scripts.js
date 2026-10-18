"use strict";

const DATA_URL = "../JS/choices.json";
const IMAGE_DIR = "../img/";
const EXTRA_INFO_URL = "../extra_info/index.html";
const FETCH_TIMEOUT_MS = 10000;

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

// text seen by the user
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



// creates an element with attributes and children

function createElement(tagName, attributes = {}, ...children) {
    const element = document.createElement(tagName);
    for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value);
    }
    element.append(...children);
    return element;
}

// Creates a captioned image
function createFigure(image, imageClass) {
    return createElement("figure", { class: CSS_CLASSES.figure },
        createElement("img", { src: IMAGE_DIR + image.src, alt: image.alt, class: imageClass }),
        createElement("figcaption", {}, image.caption));
}

//  Creates a superscript footnote marker that points at a reference
function createFootnoteMarker(number) {
    const link = createElement("a",
        { href: `#fn${number}`, id: `ref${number}`, title: "Jump to footnote" }, `[${number}]`);
    return createElement("sup", {}, link);
}

// touch-friendly button for the two choice steps

function createChoiceButton(choice, onChoose) {
    const button = createElement("button",
        { type: "button", class: `${CSS_CLASSES.choiceButton} ${choice.id}` },
        createElement("span", { class: CSS_CLASSES.choiceLabel }, choice.name));
    button.addEventListener("click", () => onChoose(choice));
    return button;
}

// creates the row of choice buttons for a step

function createChoiceRow(choices, onChoose) {
    const row = createElement("div", { class: CSS_CLASSES.choiceRow });
    row.append(...choices.map(choice => createChoiceButton(choice, onChoose)));
    return row;
}

// standard action button.
function createActionButton(label, onClick) {
    const button = createElement("button",
        { type: "button", class: CSS_CLASSES.actionButton }, label);
    button.addEventListener("click", onClick);
    return button;
}

// the "What is X?" card

function createIntroCard(instrument) {
    return createElement("section", { class: CSS_CLASSES.card },
        createFigure(instrument.image, CSS_CLASSES.instrumentImage),
        createElement("h2", {}, instrument.whatTitle),
        createElement("p", {}, instrument.intro, createFootnoteMarker(1)));
}

// creates the range and clef card
function createRangeCard(instrument) {
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

// the orchestra seating card
function createSeatingCard(instrument) {
    return createElement("section", { class: CSS_CLASSES.card },
        createFigure(instrument.seating.image, CSS_CLASSES.seatingImage),
        createElement("h2", {}, instrument.seatTitle),
        createElement("p", {}, instrument.seating.text, createFootnoteMarker(4)));
}

// Creates one clickable cover that links to a piece of music.
function createPieceFigure(piece) {
    const link = createElement("a", { href: piece.url, target: "_blank", rel: "noopener" },
        createElement("img", { src: IMAGE_DIR + piece.cover, alt: piece.alt, class: CSS_CLASSES.songImage }),
        createElement("span", { class: CSS_CLASSES.visuallyHidden }, MESSAGES.opensInNewTab));
    const caption = createElement("figcaption", {},
        createElement("strong", {}, piece.composer), createElement("br"), piece.title);
    return createElement("figure", { class: CSS_CLASSES.song }, link, caption);
}

// creates the card of songs that feature the instrument

function createPiecesCard(instrument) {
    const songList = createElement("div", { class: CSS_CLASSES.songList });
    songList.append(...instrument.pieces.map(createPieceFigure));
    return createElement("section", { class: CSS_CLASSES.card },
        createElement("h2", {}, MESSAGES.piecesHeading), songList);
}

// numbered reference list, item numbers match the footnote markers.
function createReferencesCard(instrument) {
    const list = createElement("ol");
    instrument.references.forEach((reference, index) => {
        const link = createElement("a", { href: reference.url }, reference.title);
        list.append(createElement("li", { id: `fn${index + 1}` },
            `${reference.source}, \u201C`, link, "\u201D."));
    });
    return createElement("section", { class: CSS_CLASSES.card },
        createElement("h2", {}, MESSAGES.referencesHeading), list);
}

// the closing card at the bottom of the page

function createNextStepsCard(family, onPickInstrument, onPickFamily) {
    const actions = createElement("div", { class: CSS_CLASSES.nextSteps },
        createActionButton(`Explore another ${family.name.toLowerCase()} instrument`, onPickInstrument),
        createActionButton(MESSAGES.chooseDifferentFamily, onPickFamily),
        createElement("a", { href: EXTRA_INFO_URL, class: CSS_CLASSES.actionButton }, MESSAGES.reviewBasics));
    return createElement("section", { class: CSS_CLASSES.card },
        createElement("h2", {}, MESSAGES.nextStepsHeading), actions);
}



// the page elements that the script updates

function findPageElements() {
    return {
        appRoot: document.getElementById(ELEMENT_IDS.appRoot),
        promptElement: document.getElementById(ELEMENT_IDS.prompt),
        backButton: document.getElementById(ELEMENT_IDS.backButton)
    };
}

// shows or hides the Back button
function updateBackButton(backButton, backSettings) {
    backButton.hidden = backSettings === null;
    backButton.onclick = backSettings === null ? null : backSettings.onBack;
    if (backSettings !== null) {
        backButton.textContent = backSettings.label;
    }
}

// replaces the page content and the prompt text
function displayContent(pageElements, content, promptText, backSettings, shouldMoveFocus) {
    pageElements.promptElement.textContent = promptText;
    pageElements.appRoot.replaceChildren(content);
    pageElements.appRoot.removeAttribute("aria-busy");
    updateBackButton(pageElements.backButton, backSettings);
    if (shouldMoveFocus) {
        pageElements.promptElement.focus();
    }
    window.scrollTo(0, 0);
}

// loading message
function showLoadingMessage(pageElements) {
    pageElements.appRoot.setAttribute("aria-busy", "true");
    pageElements.promptElement.textContent = MESSAGES.loading;
    updateBackButton(pageElements.backButton, null);
    pageElements.appRoot.replaceChildren(
        createElement("p", { class: CSS_CLASSES.statusMessage, role: "status" }, MESSAGES.loading));
}

// error message, try loading again?
function showLoadError(pageElements, onRetry) {
    pageElements.appRoot.removeAttribute("aria-busy");
    pageElements.promptElement.textContent = MESSAGES.loadFailed;
    const message = createElement("div", { class: CSS_CLASSES.statusMessage, role: "alert" },
        createElement("p", {}, MESSAGES.loadFailed),
        createActionButton(MESSAGES.retry, onRetry));
    pageElements.appRoot.replaceChildren(message);
}

// Step 1 of the two-step

function showFamilyStep(context, shouldMoveFocus) {
    const row = createChoiceRow(context.families,
        family => showStep(context, { family, instrument: null }, true));
    displayContent(context.pageElements, row, MESSAGES.chooseFamily, null, shouldMoveFocus);
}

// Step 2 of the two-step
function showInstrumentStep(context, family) {
    const row = createChoiceRow(family.instruments,
        instrument => showStep(context, { family, instrument }, true));
    const backSettings = {
        label: MESSAGES.backToFamilies,
        onBack: () => showStep(context, { family: null, instrument: null }, true)
    };
    displayContent(context.pageElements, row,
        `Now pick a ${family.name.toLowerCase()} instrument.`, backSettings, true);
}

// info after the two-step sequence
function showDetailStep(context, family, instrument) {
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

// shows the step that matches the user's choices 
function showStep(context, selection, shouldMoveFocus) {
    if (selection.family === null) {
        showFamilyStep(context, shouldMoveFocus);
    } else if (selection.instrument === null) {
        showInstrumentStep(context, selection.family);
    } else {
        showDetailStep(context, selection.family, selection.instrument);
    }
}

// Loads the instrument data (AJAX request).
async function fetchInstrumentFamilies() {
    const response = await fetch(DATA_URL, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data.families)) {
        throw new Error("The instrument data has no list of families.");
    }
    return data.families;
}

// loads the data, then starts the two-step chooser
async function loadAndStart(pageElements) {
    showLoadingMessage(pageElements);
    try {
        const families = await fetchInstrumentFamilies();
        const context = { pageElements, families };
        showStep(context, { family: null, instrument: null }, false);
    } catch {
        showLoadError(pageElements, () => loadAndStart(pageElements));
    }
}
loadAndStart(findPageElements());
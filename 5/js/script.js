async function getData() {
  const url = "js/boardingData.json";
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error(error.message);
  }
}

function setText(id, text){
    document.getElementById(id).textContent = text;
}

function updateCard(grid, cards){
    const cardElem = document.getElementById(grid).querySelectorAll(".card");
    cardElem.forEach((elem, i)=>{
        elem.querySelector("h3").textContent=cards[i].title;
        elem.querySelector("p").textContent=cards[i].description;
    });
}

function updateText(info){
    document.title = info.title;
    setText("styleName", info.header);
    setText("heroTitle", info.hero.headline);
    setText("heroDesc", info.hero.description);
    setText("sec1Title", info.sections.overview.title);
    setText("sec1Subtitle", info.sections.overview.subtitle);
    updateCard("sec1Grid", info.sections.overview.cards);
    setText("sec2Title", info.sections.equipment.title);
    setText("sec2Subtitle", info.sections.equipment.subtitle);
    updateCard("sec2Grid", info.sections.equipment.cards);
}

function updateImage(img){
    const i = document.getElementById("heroSection");
    i.style.setProperty("--hero-img", `url('${img}')`);
}

async function change(){
    try{
        const i = await getData();
        updateText(i);
        updateImage(i.hero.image); 
    }   catch (error){
        console.error(error.message);
    }
}
document
    .getElementById("changeThemeBtn")
    .addEventListener("click", change);

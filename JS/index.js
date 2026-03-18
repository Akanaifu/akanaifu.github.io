import content from "../DATA/index.json" with { type: "json" };

function createElement(tagName, className) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  return element;
}

function renderHero(main, hero) {
  if (!hero) {
    return;
  }

  const section = createElement("section", "hero");
  const title = createElement("h1");
  const subtitle = createElement("p", "subtitle");

  title.textContent = hero.title;
  subtitle.textContent = hero.subtitle;

  section.append(title, subtitle);
  main.appendChild(section);
}

function renderAbout(main, sectionData) {
  const section = createElement("section", sectionData.className);
  const title = createElement("h2");
  const content = createElement("div", "about-content");

  title.textContent = sectionData.title;
  sectionData.paragraphs.forEach((paragraphText) => {
    const paragraph = createElement("p");
    paragraph.innerHTML = paragraphText;
    content.appendChild(paragraph);
  });

  section.append(title, content);
  main.appendChild(section);
}

function renderTimeline(main, sectionData) {
  const section = createElement("section", sectionData.className);
  const title = createElement("h2");
  title.textContent = sectionData.title;
  section.appendChild(title);

  sectionData.items.forEach((item) => {
    const itemElement = createElement("div", "timeline-item");
    const itemTitle = createElement("h3");
    const itemContent = createElement("div", "timeline-content");

    itemTitle.textContent = item.title;
    item.entries.forEach((entry) => {
      const paragraph = createElement("p");
      const badge = createElement("span", "badge");
      badge.textContent = entry.badge;
      paragraph.append(badge, document.createTextNode(entry.text));
      itemContent.appendChild(paragraph);
    });

    itemElement.append(itemTitle, itemContent);
    section.appendChild(itemElement);
  });

  main.appendChild(section);
}

function renderCards(main, sectionData) {
  const section = createElement("section", sectionData.className);
  const title = createElement("h2");
  const grid = createElement("div", "skills-grid");

  title.textContent = sectionData.title;
  sectionData.cards.forEach((cardData) => {
    const card = createElement("div", "skill-card");
    const cardTitle = createElement("h3");
    const cardDescription = createElement("p");

    cardTitle.textContent = cardData.title;
    cardDescription.textContent = cardData.description;
    card.append(cardTitle, cardDescription);
    grid.appendChild(card);
  });

  section.append(title, grid);
  main.appendChild(section);
}

function renderIndex() {
  const main = document.getElementById("index-content");
  if (!main) {
    return;
  }

  renderHero(main, content.hero);

  content.sections.forEach((sectionData) => {
    if (sectionData.type === "about") {
      renderAbout(main, sectionData);
      return;
    }

    if (sectionData.type === "timeline") {
      renderTimeline(main, sectionData);
      return;
    }

    if (sectionData.type === "cards") {
      renderCards(main, sectionData);
    }
  });
}

renderIndex();

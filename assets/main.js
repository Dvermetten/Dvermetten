const escapeHtml = (text) =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const escapeAttr = (text) => escapeHtml(text);

const makeExternalLink = (url, label) =>
  `<a class="inline-link" href="${escapeAttr(url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`;

const autoLinkText = (text) => {
  const escaped = escapeHtml(text);
  return escaped.replace(/https?:\/\/[^\s<]+/g, (rawMatch) => {
    const cleanUrl = rawMatch.replace(/[),.;:]+$/, "");
    const suffix = rawMatch.slice(cleanUrl.length);
    return `${makeExternalLink(cleanUrl, cleanUrl)}${suffix}`;
  });
};

const hideSection = (sectionSelector) => {
  const section = document.querySelector(sectionSelector);
  if (section) {
    section.classList.add("is-hidden");
  }
};

const showSection = (sectionSelector) => {
  const section = document.querySelector(sectionSelector);
  if (section) {
    section.classList.remove("is-hidden");
  }
};

const renderLastUpdated = (lastUpdated) => {
  const target = document.querySelector("#last-updated");
  if (!target) {
    return;
  }

  const parsed = lastUpdated ? new Date(lastUpdated) : new Date();
  const isValidDate = !Number.isNaN(parsed.getTime());
  const dateToShow = isValidDate ? parsed : new Date();
  const formatted = dateToShow.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  target.textContent = `Last updated: ${formatted}`;
};

const renderQuickNav = () => {
  const nav = document.querySelector("#quick-nav");
  if (!nav) {
    return;
  }

  const sections = Array.from(document.querySelectorAll("main section[id]"))
    .filter((section) => !section.classList.contains("is-hidden"))
    .map((section) => {
      const heading = section.querySelector("h2");
      return {
        id: section.id,
        label: heading ? heading.textContent.trim() : section.id,
      };
    });

  if (sections.length === 0) {
    nav.classList.add("is-hidden");
    nav.innerHTML = "";
    return;
  }

  nav.classList.remove("is-hidden");
  nav.innerHTML = sections
    .map((item) => `<a href="#${escapeAttr(item.id)}">${escapeHtml(item.label)}</a>`)
    .join("");
};

const renderHero = (profile = {}) => {
  const hero = document.querySelector("#hero");
  const contactItems = [];
  const photoSrc = profile.photo || "assets/diederick.jpg";

  if (profile.email) {
    contactItems.push(`<li><a href="mailto:${escapeAttr(profile.email)}">${escapeHtml(profile.email)}</a></li>`);
  }

  if (profile.website) {
    contactItems.push(
      `<li><a href="${escapeAttr(profile.website)}" target="_blank" rel="noreferrer">Website</a></li>`
    );
  }

  if (profile.github) {
    contactItems.push(
      `<li><a href="${escapeAttr(profile.github)}" target="_blank" rel="noreferrer">GitHub</a></li>`
    );
  }

  if (profile.orcid) {
    contactItems.push(
      `<li><a href="${escapeAttr(profile.orcid)}" target="_blank" rel="noreferrer">ORCID</a></li>`
    );
  }

  hero.innerHTML = `
    <div class="hero-layout">
      <img
        class="hero-photo"
        src="${escapeAttr(photoSrc)}"
        alt="Profile photo of ${escapeHtml(profile.name || "CV owner")}" 
      />
      <div>
        <h1 class="name">${escapeHtml(profile.name || "Your Name")}</h1>
        <p class="tagline">${escapeHtml(profile.title || "Academic Title")}</p>
        ${contactItems.length > 0 ? `<ul class="contact-list">${contactItems.join("")}</ul>` : ""}
      </div>
    </div>
  `;
};

const renderAbout = (about) => {
  if (!about || !String(about).trim()) {
    hideSection("#about-section");
    return;
  }

  showSection("#about-section");
  document.querySelector("#about-text").textContent = about;
};

const renderProfileDetails = (profile = {}) => {
  const details = [];

  if (profile.birthDateAndPlace) {
    details.push(`Date and place of birth: ${profile.birthDateAndPlace}`);
  }

  if (profile.nationality) {
    details.push(`Nationality: ${profile.nationality}`);
  }

  if (details.length === 0) {
    hideSection("#profile-details-section");
    return;
  }

  showSection("#profile-details-section");
  const list = document.querySelector("#profile-details-list");
  list.innerHTML = details.map((item) => `<li>${autoLinkText(item)}</li>`).join("");
};

const renderEducation = (education = []) => {
  if (!Array.isArray(education) || education.length === 0) {
    hideSection("#education-section");
    return;
  }

  showSection("#education-section");
  const container = document.querySelector("#education-list");
  container.innerHTML = education
    .map(
      (item) => `
        <article>
          <p class="item-title">${escapeHtml(item.degree || "")}</p>
          <p class="item-meta">${escapeHtml(item.years || "")} | ${escapeHtml(item.institution || "")}</p>
          ${item.focus ? `<p>${autoLinkText(item.focus)}</p>` : ""}
        </article>
      `
    )
    .join("");
};

const renderResearch = (researchInterests = []) => {
  if (!Array.isArray(researchInterests) || researchInterests.length === 0) {
    hideSection("#research-section");
    return;
  }

  showSection("#research-section");
  const list = document.querySelector("#research-list");
  list.innerHTML = researchInterests.map((topic) => `<li>${escapeHtml(topic)}</li>`).join("");
};

const formatLatexPublicationText = (raw) => {
  let text = String(raw).trim();

  text = text.replace(/\\href\{([^{}]+)\}\{([^{}]+)\}/g, "$2 ($1)");
  text = text.replace(/\\(emph|textit|textbf|underline)\{([^{}]*)\}/g, "$2");
  text = text.replace(/\\["'`^~=.uvHcdbtk]\{?([A-Za-z])\}?/g, "$1");
  text = text.replace(/\\([%&_#$])/g, "$1");
  text = text.replace(/\\,/g, ",");
  text = text.replace(/\\~/g, " ");
  text = text.replace(/\\\\/g, " ");
  text = text.replace(/\$/g, "");
  text = text.replace(/[{}]/g, "");
  text = text.replace(/\s+/g, " ").trim();

  return autoLinkText(text);
};

const parseLatexPublicationCategories = (texContent) => {
  const lines = texContent.split(/\r?\n/);
  const categories = [];
  let currentCategory = null;
  let inEnumerate = false;
  let currentItem = [];

  const pushCurrentItem = () => {
    if (!currentCategory || currentItem.length === 0) {
      return;
    }

    const joined = currentItem.join(" ").replace(/\s+/g, " ").trim();
    if (joined) {
      currentCategory.items.push(joined);
    }
    currentItem = [];
  };

  for (const originalLine of lines) {
    const line = originalLine.trim();
    if (!line) {
      continue;
    }

    const subsectionMatch = line.match(/^\\subsection\*\{(.+)\}$/);
    if (subsectionMatch) {
      pushCurrentItem();
      currentCategory = { title: subsectionMatch[1].trim(), items: [] };
      categories.push(currentCategory);
      inEnumerate = false;
      continue;
    }

    if (line.startsWith("\\begin{enumerate}")) {
      inEnumerate = true;
      continue;
    }

    if (line.startsWith("\\end{enumerate}")) {
      pushCurrentItem();
      inEnumerate = false;
      continue;
    }

    if (!inEnumerate || !currentCategory) {
      continue;
    }

    if (line.startsWith("\\item")) {
      pushCurrentItem();
      currentItem.push(line.replace(/^\\item\s*/, ""));
      continue;
    }

    currentItem.push(line);
  }

  pushCurrentItem();
  return categories.filter((category) => category.items.length > 0);
};

const renderPublicationCategories = (categories) => {
  if (!Array.isArray(categories) || categories.length === 0) {
    hideSection("#publications-section");
    return;
  }

  showSection("#publications-section");
  const container = document.querySelector("#publications-list");
  container.innerHTML = categories
    .map((category, index) => {
      const items = category.items
        .map((item) => `<li>${formatLatexPublicationText(item)}</li>`)
        .join("");

      return `
        <details class="publication-group" ${index === 0 ? "open" : ""}>
          <summary>${escapeHtml(category.title)} (${category.items.length})</summary>
          <ol class="publication-list">${items}</ol>
        </details>
      `;
    })
    .join("");
};

const renderJsonPublications = (publications = []) => {
  if (!Array.isArray(publications) || publications.length === 0) {
    hideSection("#publications-section");
    return;
  }

  showSection("#publications-section");
  const container = document.querySelector("#publications-list");
  container.innerHTML = `
    <details class="publication-group" open>
      <summary>Selected Publications (${publications.length})</summary>
      <ol class="publication-list">
        ${publications
          .map(
            (item) => `
              <li>
                ${escapeHtml(item.authors || "")} (${escapeHtml(item.year || "")}).
                "${escapeHtml(item.title || "")}."
                <em>${escapeHtml(item.venue || "")}</em>.
              </li>
            `
          )
          .join("")}
      </ol>
    </details>
  `;
};

const renderExperience = (experience = []) => {
  if (!Array.isArray(experience) || experience.length === 0) {
    hideSection("#experience-section");
    return;
  }

  showSection("#experience-section");
  const list = document.querySelector("#experience-list");
  list.innerHTML = experience
    .map(
      (item) => `
      <article>
        <p class="item-title">${escapeHtml(item.role || "")}</p>
        <p class="item-meta">${escapeHtml(item.years || "")} | ${escapeHtml(item.organization || "")}</p>
        ${item.summary ? `<p>${autoLinkText(item.summary)}</p>` : ""}
      </article>
    `
    )
    .join("");
};

const renderSimpleListSection = (sectionSelector, listSelector, items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    hideSection(sectionSelector);
    return;
  }

  showSection(sectionSelector);
  const list = document.querySelector(listSelector);
  list.innerHTML = items.map((item) => `<li>${autoLinkText(item)}</li>`).join("");
};

const renderSupervisionDetails = (groups = [], fallbackItems = []) => {
  const sectionSelector = "#supervision-section";
  const container = document.querySelector("#supervision-list");

  const summaryItems = Array.isArray(fallbackItems) ? fallbackItems : [];
  const detailGroups = Array.isArray(groups) ? groups : [];

  if (summaryItems.length === 0 && detailGroups.length === 0) {
    hideSection(sectionSelector);
    return;
  }

  const summaryMarkup =
    summaryItems.length > 0
      ? `<ul class="plain-list">${summaryItems.map((item) => `<li>${autoLinkText(item)}</li>`).join("")}</ul>`
      : "";

  const detailsMarkup =
    detailGroups.length > 0
      ? `
        <h3 class="section-subtitle">Student Details</h3>
        <div class="detail-groups">
          ${detailGroups
            .map((group) => {
              const students = Array.isArray(group.students) ? group.students : [];
              const studentItems = students
                .map((student) => {
                  const name = escapeHtml(student.name || "Unnamed Student");
                  const meta = [student.program, student.years].filter(Boolean).map(escapeHtml).join(" | ");
                  const topic = student.topic ? autoLinkText(student.topic) : "";
                  return `
                    <li>
                      <strong>${name}</strong>${meta ? ` - <span>${meta}</span>` : ""}
                      ${topic ? `<br />${topic}` : ""}
                    </li>
                  `;
                })
                .join("");

              return `
                <details class="detail-card">
                  <summary>${escapeHtml(group.heading || "Supervision Group")} (${students.length})</summary>
                  <div class="detail-card-body">
                    <ul>${studentItems}</ul>
                  </div>
                </details>
              `;
            })
            .join("")}
        </div>
      `
      : "";

  showSection(sectionSelector);
  container.innerHTML = `${summaryMarkup}${detailsMarkup}`;
};

const renderCompetitionDetails = (competitions = [], fallbackItems = []) => {
  const sectionSelector = "#organization-section";
  const container = document.querySelector("#organization-list");

  const summaryItems = Array.isArray(fallbackItems) ? fallbackItems : [];
  const detailItems = Array.isArray(competitions) ? competitions : [];

  if (summaryItems.length === 0 && detailItems.length === 0) {
    hideSection(sectionSelector);
    return;
  }

  const summaryMarkup =
    summaryItems.length > 0
      ? `<ul class="plain-list">${summaryItems.map((item) => `<li>${autoLinkText(item)}</li>`).join("")}</ul>`
      : "";

  const detailsMarkup =
    detailItems.length > 0
      ? `
        <h3 class="section-subtitle">Competition Details</h3>
        <div class="detail-groups">
          ${detailItems
            .map((competition) => {
              const linkMarkup = competition.link
                ? `<p>${makeExternalLink(competition.link, competition.link)}</p>`
                : "";
              return `
                <details class="detail-card">
                  <summary>${escapeHtml(competition.name || "Competition")}${
                    competition.year ? ` (${escapeHtml(competition.year)})` : ""
                  }</summary>
                  <div class="detail-card-body">
                    ${linkMarkup}
                  </div>
                </details>
              `;
            })
            .join("")}
        </div>
      `
      : "";

  showSection(sectionSelector);
  container.innerHTML = `${summaryMarkup}${detailsMarkup}`;
};

const renderTutorialDetails = (tutorials = [], fallbackItems = []) => {
  const sectionSelector = "#tutorials-section";
  const container = document.querySelector("#tutorials-list");

  const summaryItems = Array.isArray(fallbackItems) ? fallbackItems : [];
  const detailItems = Array.isArray(tutorials) ? tutorials : [];

  if (summaryItems.length === 0 && detailItems.length === 0) {
    hideSection(sectionSelector);
    return;
  }

  const summaryMarkup =
    summaryItems.length > 0
      ? `<ul class="plain-list">${summaryItems.map((item) => `<li>${autoLinkText(item)}</li>`).join("")}</ul>`
      : "";

  const detailsMarkup =
    detailItems.length > 0
      ? `
        <h3 class="section-subtitle">Tutorial Details</h3>
        <div class="detail-groups">
          ${detailItems
            .map((tutorial) => {
              return `
                <details class="detail-card">
                  <summary>${escapeHtml(tutorial.title || "Tutorial")}${
                    tutorial.year ? ` (${escapeHtml(tutorial.year)})` : ""
                  }</summary>
                  <div class="detail-card-body">
                    ${tutorial.venue ? `<p><strong>Venue:</strong> ${escapeHtml(tutorial.venue)}</p>` : ""}
                    ${tutorial.role ? `<p><strong>Role:</strong> ${escapeHtml(tutorial.role)}</p>` : ""}
                    ${tutorial.description ? `<p>${autoLinkText(tutorial.description)}</p>` : ""}
                  </div>
                </details>
              `;
            })
            .join("")}
        </div>
      `
      : "";

  showSection(sectionSelector);
  container.innerHTML = `${summaryMarkup}${detailsMarkup}`;
};

const renderSoftwareList = (containerSelector, projects = []) => {
  const container = document.querySelector(containerSelector);
  container.innerHTML = projects
    .map((project) => {
      const title = project.url
        ? makeExternalLink(project.url, project.name || project.url)
        : escapeHtml(project.name || "");

      const subItems = Array.isArray(project.subProjects)
        ? `<ul>${project.subProjects.map((item) => `<li>${autoLinkText(item)}</li>`).join("")}</ul>`
        : "";

      return `
        <article class="software-item">
          <p class="item-title">${title}</p>
          ${project.description ? `<p>${autoLinkText(project.description)}</p>` : ""}
          ${subItems}
        </article>
      `;
    })
    .join("");
};

const renderSoftwareOutputs = (softwareOutputs = {}) => {
  const core = Array.isArray(softwareOutputs.coreDeveloper) ? softwareOutputs.coreDeveloper : [];
  const contrib = Array.isArray(softwareOutputs.contributor) ? softwareOutputs.contributor : [];

  if (core.length === 0 && contrib.length === 0) {
    hideSection("#software-section");
    return;
  }

  showSection("#software-section");
  renderSoftwareList("#software-core-list", core);
  renderSoftwareList("#software-contrib-list", contrib);
};

const renderCv = (cv) => {
  renderHero(cv.profile || {});
  renderLastUpdated(cv.lastUpdated);
  renderAbout(cv.about || "");
  renderProfileDetails(cv.profile || {});
  renderEducation(cv.education || []);
  renderResearch(cv.researchInterests || []);
  renderExperience(cv.experience || []);

  renderSupervisionDetails(cv.supervisionDetails || [], cv.supervisionActivities || []);
  renderSimpleListSection("#awards-section", "#awards-list", cv.awardsAndDistinctions || cv.awardsAndGrants || []);
  renderSimpleListSection("#teaching-section", "#teaching-list", cv.teachingActivities || cv.teaching || []);
  renderCompetitionDetails(cv.organizationCompetitions || [], cv.organization || []);
  renderSimpleListSection("#reviewing-section", "#reviewing-list", cv.reviewing || []);
  renderTutorialDetails(cv.tutorialDetails || [], cv.tutorialsAndInvitedPresentations || []);
  renderSimpleListSection(
    "#funding-section",
    "#funding-list",
    cv.awardedFundingAndInvitations || []
  );
  renderSoftwareOutputs(cv.softwareOutputs || {});
  renderQuickNav();
};

const loadLatexPublications = async () => {
  const response = await fetch("data/pubs.tex");
  if (!response.ok) {
    throw new Error(`Failed to load publications: ${response.status}`);
  }

  const tex = await response.text();
  return parseLatexPublicationCategories(tex);
};

const loadCv = async () => {
  try {
    const cvResponse = await fetch("data/cv.json");

    if (!cvResponse.ok) {
      throw new Error(`Failed to load CV data: ${cvResponse.status}`);
    }

    const cv = await cvResponse.json();
    renderCv(cv);

    try {
      const publicationCategories = await loadLatexPublications();
      if (publicationCategories.length > 0) {
        renderPublicationCategories(publicationCategories);
      } else {
        renderJsonPublications(cv.publications || []);
      }
    } catch (publicationError) {
      console.warn(publicationError);
      renderJsonPublications(cv.publications || []);
    }
  } catch (error) {
    document.querySelector("#main-content").innerHTML = `
      <section class="card">
        <h2>Could not load CV data</h2>
        <p>${escapeHtml(error.message)}</p>
        <p>Check that <code>data/cv.json</code> exists and is valid JSON.</p>
      </section>
    `;
  }
};

loadCv();

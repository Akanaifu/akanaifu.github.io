function capitalizeFirstLetter(val) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

async function fetchJson(file) {
  const res = await fetch(file);
  if (!res.ok) throw new Error(`Erreur chargement ${file}: ${res.status}`);
  return res.json();
}

function getTableHeaders(table) {
  return Array.from(table.querySelectorAll("thead th")).map((th) =>
    th.textContent.trim(),
  );
}

function ensureTbody(table) {
  let tbody = table.querySelector("tbody");
  if (!tbody) {
    tbody = document.createElement("tbody");
    table.appendChild(tbody);
  }
  return tbody;
}

function getCategory(item) {
  return item["catégorie"] ?? item.categorie ?? "";
}

function groupByCategory(data) {
  const map = new Map();

  data.forEach((item) => {
    const key = getCategory(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });

  const groups = Array.from(map.entries()).map(([categorie, rows]) => ({
    categorie,
    rows,
  }));

  groups.sort((a, b) => a.categorie.localeCompare(b.categorie, "fr"));

  groups.forEach((group) => {
    group.rows.sort((a, b) => String(a.nom).localeCompare(String(b.nom), "fr"));
  });

  return groups;
}

function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generateThemeColors(categories) {
  const colors = {};
  const huePalette = [176, 194, 214, 236, 258, 286, 320];

  categories.forEach((category, index) => {
    const hue = huePalette[index % huePalette.length];
    const alpha = 0.24 + (index % 3) * 0.04;

    colors[category] = {
      rowBackground: `linear-gradient(135deg, rgba(16, 22, 32, 0.9), hsla(${hue}, 84%, 56%, ${alpha}))`,
      rowText: `hsl(${hue}, 85%, 88%)`,
      categoryText: `hsl(${hue}, 95%, 82%)`,
      border: `hsla(${hue}, 88%, 64%, 0.58)`,
    };
  });

  return colors;
}

function injectCategoryStyles(categoryColors) {
  const styleId = "dynamic-category-styles";
  const existingStyle = document.getElementById(styleId);

  if (existingStyle) {
    existingStyle.remove();
  }

  const styleElement = document.createElement("style");
  styleElement.id = styleId;

  let cssRules = "";

  for (const [categorie, couleurs] of Object.entries(categoryColors)) {
    const className = slugify(categorie);

    cssRules += `
      #table tr.cat-${className} {
        background: ${couleurs.rowBackground};
      }
      #table tr.cat-${className} td {
        color: ${couleurs.rowText};
        border-bottom-color: rgba(120, 170, 190, 0.25);
      }
      #table tr.cat-${className} td.category-label {
        color: ${couleurs.categoryText};
        border-left: 2px solid ${couleurs.border};
      }
      #table tr.cat-${className} a.activity-link {
        color: ${couleurs.rowText};
      }
    `;
  }

  styleElement.textContent = cssRules;
  document.head.appendChild(styleElement);
}

function buildGroupedTbodyHtml(groups, headers) {
  return groups
    .map(({ categorie, rows }) => {
      const catClass = `cat-${slugify(categorie)}`;

      return rows
        .map((row, idx) => {
          const nomSlug = slugify(row.nom);
          const nomLink = `<a href="activite.html?activity=${nomSlug}" class="activity-link">${capitalizeFirstLetter(row.nom) ?? ""}</a>`;

          if (idx === 0) {
            const firstRowCells = [
              `<td class="category-label ${catClass}" data-label="${headers[0]}" rowspan="${rows.length}">${capitalizeFirstLetter(categorie)}</td>`,
              `<td data-label="${headers[1]}">${row.cours ?? ""}</td>`,
              `<td data-label="${headers[2]}"><u>${nomLink}</u></td>`,
              `<td data-label="${headers[3]}">${row.heures_prestees ?? ""}</td>`,
              `<td data-label="${headers[4]}">${row.heures_valorisees ?? ""}</td>`,
            ];
            return `<tr class="${catClass}">${firstRowCells.join("")}</tr>`;
          }

          const otherRowCells = [
            `<td data-label="${headers[1]}">${row.cours ?? ""}</td>`,
            `<td data-label="${headers[2]}"><u>${nomLink}</u></td>`,
            `<td data-label="${headers[3]}">${row.heures_prestees ?? ""}</td>`,
            `<td data-label="${headers[4]}">${row.heures_valorisees ?? ""}</td>`,
          ];
          return `<tr class="${catClass}">${otherRowCells.join("")}</tr>`;
        })
        .join("");
    })
    .join("");
}

function calculateTotals(data) {
  const parseHours = (value) => {
    if (!value) return 0;
    const cleaned = String(value).replace(/[^\d.,]/g, "");
    const normalized = cleaned.replace(",", ".");
    return parseFloat(normalized) || 0;
  };

  const totalPrestees = data.reduce(
    (sum, item) => sum + parseHours(item.heures_prestees),
    0,
  );
  const totalValorisees = data.reduce(
    (sum, item) => sum + parseHours(item.heures_valorisees),
    0,
  );

  return { totalPrestees, totalValorisees };
}

function buildTotalRow(headers, totals) {
  return `
    <tr class="total-row">
      <td class="category-label total-label" data-label="${headers[0]}">Total</td>
      <td data-label="${headers[1]}"></td>
      <td data-label="${headers[2]}"></td>
      <td data-label="${headers[3]}">~${totals.totalPrestees}h</td>
      <td data-label="${headers[4]}">${totals.totalValorisees}h</td>
    </tr>
  `;
}

async function createTab(idTab, file) {
  try {
    const data = await fetchJson(file);

    if (window.updateVeloHours) {
      const veloStats = await window.updateVeloHours();
      if (veloStats) {
        const veloEntry = data.find(
          (item) => String(item.nom).toLowerCase() === "vélo",
        );
        if (veloEntry) {
          veloEntry.heures_prestees = `~${veloStats.hours}h`;
        }
      }
    }

    const groups = groupByCategory(data);
    const categoryColors = generateThemeColors(groups.map((g) => g.categorie));
    injectCategoryStyles(categoryColors);

    const table = document.getElementById(idTab);
    const headers = getTableHeaders(table);
    const tbody = ensureTbody(table);
    const totals = calculateTotals(data);

    tbody.innerHTML =
      buildGroupedTbodyHtml(groups, headers) + buildTotalRow(headers, totals);
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  createTab("table", "DATA/tabPortfolio.json");
});

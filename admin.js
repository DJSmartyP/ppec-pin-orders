import { designs, materials, variants } from "./catalogue.js?v=20260903k";
import { adminEmails, collectionName, firebaseConfig, plannedPostagePence, unitPricePence } from "./firebase-config.js?v=20260903k";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const signInButton = document.querySelector("#sign-in-button");
const signOutButton = document.querySelector("#sign-out-button");
const authMessage = document.querySelector("#auth-message");
const dashboard = document.querySelector("#dashboard");
const metricGrid = document.querySelector("#metric-grid");
const aggregateBody = document.querySelector("#aggregate-body");
const aggregateFoot = document.querySelector("#aggregate-foot");
const materialTotals = document.querySelector("#material-totals");
const designTotals = document.querySelector("#design-totals");
const submissionList = document.querySelector("#submission-list");
const exportButton = document.querySelector("#export-csv");
const profitResultGrid = document.querySelector("#profit-result-grid");
const profitInputs = {
  sellingPrice: document.querySelector("#profit-selling-price"),
  postagePrice: document.querySelector("#profit-postage-price"),
  usdRate: document.querySelector("#profit-usd-rate"),
  vograceShipping: document.querySelector("#profit-vograce-shipping"),
  fixedCosts: document.querySelector("#profit-fixed-costs"),
  percentCost: document.querySelector("#profit-percent-cost")
};
const tierLists = {
  acrylic: document.querySelector("#acrylic-tier-list"),
  wood: document.querySelector("#wood-tier-list")
};
const addTierButtons = {
  acrylic: document.querySelector("#add-acrylic-tier"),
  wood: document.querySelector("#add-wood-tier")
};
const defaultTierPrices = {
  acrylic: [
    { minQty: 1, cost: "1.53" },
    { minQty: 16, cost: "1.25" },
    { minQty: 50, cost: "1.20" },
    { minQty: 100, cost: "1.10" },
    { minQty: 300, cost: "1.05" },
    { minQty: 500, cost: "0.99" },
    { minQty: 1000, cost: "0.94" }
  ],
  wood: [
    { minQty: 1, cost: "0.96" },
    { minQty: 16, cost: "0.92" },
    { minQty: 50, cost: "0.89" },
    { minQty: 100, cost: "0.86" },
    { minQty: 300, cost: "0.83" },
    { minQty: 500, cost: "0.80" },
    { minQty: 1000, cost: "0.75" }
  ]
};

const configured = isFirebaseConfigured();
const app = configured ? initializeApp(firebaseConfig) : null;
const auth = configured ? getAuth(app) : null;
const db = configured ? getFirestore(app) : null;
const hasProfitTools = Boolean(profitResultGrid && profitInputs.sellingPrice && profitInputs.postagePrice);

let submissions = [];
let aggregates = createEmptyAggregates();

if (hasProfitTools) {
  initialiseProfitInputs();
}

if (!configured) {
  signInButton.disabled = true;
  showAuthMessage("Firebase is not configured yet. Add your project details in firebase-config.js before using the dashboard.", "warning");
} else {
  signInButton.addEventListener("click", async () => {
    showAuthMessage("");
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error(error);
      showAuthMessage("Google sign-in did not complete. Please try again.", "error");
    }
  });

  signOutButton.addEventListener("click", () => signOut(auth));

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      setSignedOut();
      return;
    }

    if (!isAuthorisedAdmin(user.email)) {
      setSignedOut();
      showAuthMessage(`${user.email} is signed in, but is not listed as an authorised admin.`, "error");
      await signOut(auth);
      return;
    }

    signInButton.classList.add("hidden");
    signOutButton.classList.remove("hidden");
    dashboard.classList.remove("hidden");
    showAuthMessage(`Signed in as ${user.email}.`, "success");
    await loadSubmissions();
  });
}

if (exportButton) {
  exportButton.addEventListener("click", () => {
    const csv = buildCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ppec-badge-interest-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  });
}

if (submissionList) {
  submissionList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-delete-id]");
    if (!button) return;

    const submission = submissions.find((item) => item.id === button.dataset.deleteId);
    const label = submission ? `${submission.discordUsername || "this submission"}` : "this submission";

    if (!window.confirm(`Delete the submission from ${label}? This cannot be undone.`)) return;

    button.disabled = true;
    try {
      await deleteDoc(doc(db, collectionName, button.dataset.deleteId));
      await loadSubmissions();
    } catch (error) {
      console.error(error);
      showAuthMessage("That submission could not be deleted. Please try again.", "error");
      button.disabled = false;
    }
  });
}

async function loadSubmissions() {
  showAuthMessage("Loading submissions...", "");

  try {
    const snapshot = await getDocs(collection(db, collectionName));
    submissions = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .sort((a, b) => normaliseDate(b.submittedAt) - normaliseDate(a.submittedAt));

    aggregates = createEmptyAggregates();
    submissions.forEach(addSubmissionToAggregates);
    renderAdminPage();
    showAuthMessage(`${submissions.length} submission${submissions.length === 1 ? "" : "s"} loaded.`, "success");
  } catch (error) {
    console.error(error);
    showAuthMessage("Submissions could not be loaded. Check your Firestore rules and admin email.", "error");
  }
}

function renderAdminPage() {
  const totals = calculateTotals();

  if (hasProfitTools) {
    renderProfitEstimate(totals);
  }

  if (metricGrid) {
    metricGrid.innerHTML = [
      metric("Submissions", submissions.length),
      metric("Total pins", totals.totalPins),
      metric("Estimated badge sales", formatPounds(totals.totalPins * unitPricePence)),
      metric("Planned postage", formatPounds(submissions.length * plannedPostagePence)),
      metric("Acrylic / Wood", `${totals.acrylicTotal} / ${totals.woodTotal}`)
    ].join("");
  }

  if (aggregateBody && aggregateFoot) {
    aggregateBody.innerHTML = designs.map((design) => {
      const acrylic = aggregates.byVariant[`${design.id}_acrylic`];
      const wood = aggregates.byVariant[`${design.id}_wood`];
      return `
        <tr>
          <th scope="row">${design.name}</th>
          <td>${acrylic}</td>
          <td>${wood}</td>
          <td>${acrylic + wood}</td>
        </tr>
      `;
    }).join("");

    aggregateFoot.innerHTML = `
      <tr>
        <th scope="row">Total</th>
        <td>${totals.acrylicTotal}</td>
        <td>${totals.woodTotal}</td>
        <td>${totals.totalPins}</td>
      </tr>
    `;
  }

  if (materialTotals) {
    materialTotals.innerHTML = materials.map((material) => {
      const total = designs.reduce((sum, design) => sum + aggregates.byVariant[`${design.id}_${material.id}`], 0);
      return `<div><span>${material.label}</span><strong>${total}</strong></div>`;
    }).join("");
  }

  if (designTotals) {
    designTotals.innerHTML = designs.map((design) => {
      return `<div><span>${design.name}</span><strong>${aggregates.byDesign[design.id]}</strong></div>`;
    }).join("");
  }

  if (submissionList) {
    renderSubmissionList();
  }
}

function renderSubmissionList() {
  if (!submissions.length) {
    submissionList.innerHTML = `<p class="empty-state">No submissions yet.</p>`;
    return;
  }

  submissionList.innerHTML = submissions.map((submission) => {
    const rows = variants
      .filter((variant) => getQuantity(submission, variant.key) > 0)
      .map((variant) => `<li>${variant.designName} · ${variant.materialName}: <strong>${getQuantity(submission, variant.key)}</strong></li>`)
      .join("");

    return `
      <article class="submission-card">
        <div>
          <h3>${escapeHtml(submission.discordUsername || "No Discord username")}</h3>
          <p>${formatDate(submission.submittedAt)} · ${submission.totalPins || 0} pins · ${formatPounds((submission.estimatedSpendPence || 0))} badge estimate · ${formatPounds(plannedPostagePence)} planned postage</p>
          <ul>${rows || "<li>No quantities recorded</li>"}</ul>
        </div>
        <button class="danger-button" type="button" data-delete-id="${submission.id}">Delete</button>
      </article>
    `;
  }).join("");
}

function initialiseProfitInputs() {
  const savedValues = readProfitInputs();
  profitInputs.sellingPrice.value = savedValues.sellingPrice || formatInputPounds(unitPricePence);
  profitInputs.postagePrice.value = savedValues.postagePrice || formatInputPounds(plannedPostagePence);
  profitInputs.usdRate.value = savedValues.usdRate || "0.7402";
  profitInputs.vograceShipping.value = savedValues.vograceShipping || "20.00";
  profitInputs.fixedCosts.value = savedValues.fixedCosts || "";
  profitInputs.percentCost.value = savedValues.percentCost || "";
  renderTierInputs("acrylic", savedValues.tiers?.acrylic || defaultTiers("acrylic", savedValues.acrylicCost));
  renderTierInputs("wood", savedValues.tiers?.wood || defaultTiers("wood", savedValues.woodCost));

  Object.values(profitInputs).filter(Boolean).forEach((input) => {
    input.addEventListener("input", () => {
      saveProfitInputs();
      renderAdminPage();
    });
  });

  Object.entries(tierLists).forEach(([material, list]) => {
    if (!list) return;

    list.addEventListener("input", () => {
      saveProfitInputs();
      renderAdminPage();
    });

    list.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-remove-tier]");
      if (!button) return;

      const rows = [...list.querySelectorAll(".tier-row")];
      if (rows.length <= 1) return;

      const tiers = readTiersFromDom(material);
      tiers.splice(Number(button.dataset.removeTier), 1);
      renderTierInputs(material, tiers);
      saveProfitInputs();
      renderAdminPage();
    });

    addTierButtons[material]?.addEventListener("click", () => {
      const tiers = readTiersFromDom(material);
      tiers.push({ minQty: nextTierQuantity(tiers), cost: "" });
      renderTierInputs(material, tiers);
      saveProfitInputs();
      renderAdminPage();
    });
  });
}

function renderProfitEstimate({ acrylicTotal, woodTotal, totalPins }) {
  const sellingPricePence = poundsInputToPence(profitInputs.sellingPrice.value || formatInputPounds(unitPricePence));
  const postagePricePence = poundsInputToPence(profitInputs.postagePrice.value || formatInputPounds(plannedPostagePence));
  const usdToGbpRate = numberInput(profitInputs.usdRate.value || "0.7402");
  const acrylicTier = tierForQuantity("acrylic", acrylicTotal);
  const woodTier = tierForQuantity("wood", woodTotal);
  const vograceShippingCents = dollarsInputToCents(profitInputs.vograceShipping.value || "20");
  const fixedCostsPence = poundsInputToPence(profitInputs.fixedCosts.value);
  const percentCostRate = numberInput(profitInputs.percentCost.value) / 100;

  const badgeRevenuePence = totalPins * sellingPricePence;
  const plannedPostageRevenuePence = submissions.length * postagePricePence;
  const revenuePence = badgeRevenuePence + plannedPostageRevenuePence;
  const productCostUsdCents = (acrylicTotal * acrylicTier.costCents) + (woodTotal * woodTier.costCents);
  const vograceTotalUsdCents = productCostUsdCents + vograceShippingCents;
  const productCostPence = Math.round(productCostUsdCents * usdToGbpRate);
  const vograceShippingPence = Math.round(vograceShippingCents * usdToGbpRate);
  const percentCostPence = Math.round(revenuePence * percentCostRate);
  const totalCostPence = productCostPence + vograceShippingPence + fixedCostsPence + percentCostPence;
  const profitPence = revenuePence - totalCostPence;
  const margin = revenuePence > 0 ? `${Math.round((profitPence / revenuePence) * 1000) / 10}%` : "0%";
  const variableCostPerPin = totalPins > 0 ? (productCostPence + percentCostPence) / totalPins : 0;
  const contributionPerPin = sellingPricePence - variableCostPerPin;
  const breakEvenPins = contributionPerPin > 0 && fixedCostsPence > 0
    ? Math.ceil(fixedCostsPence / contributionPerPin)
    : fixedCostsPence > 0 ? "Not covered" : 0;

  profitResultGrid.innerHTML = [
    profitMetric("Badge revenue", formatPounds(badgeRevenuePence)),
    profitMetric("Planned postage charged", formatPounds(plannedPostageRevenuePence)),
    profitMetric("Total estimated revenue", formatPounds(revenuePence)),
    profitMetric("Vograce product cost", formatDollars(productCostUsdCents)),
    profitMetric("Vograce total with shipping", formatDollars(vograceTotalUsdCents)),
    profitMetric("Estimated Vograce cost", formatPounds(productCostPence + vograceShippingPence)),
    profitMetric("Other fixed + percentage costs", formatPounds(fixedCostsPence + percentCostPence)),
    profitMetric("Estimated profit", formatPounds(profitPence), profitPence >= 0 ? "good" : "bad"),
    profitMetric("Profit margin", margin),
    profitMetric("Break-even pins", breakEvenPins),
    profitMetric("Acrylic tier used", tierLabel(acrylicTier, acrylicTotal)),
    profitMetric("Wood tier used", tierLabel(woodTier, woodTotal))
  ].join("");
}

function calculateTotals() {
  const totalPins = variants.reduce((sum, variant) => sum + aggregates.byVariant[variant.key], 0);
  const acrylicTotal = designs.reduce((sum, design) => sum + aggregates.byVariant[`${design.id}_acrylic`], 0);
  const woodTotal = designs.reduce((sum, design) => sum + aggregates.byVariant[`${design.id}_wood`], 0);
  return { acrylicTotal, totalPins, woodTotal };
}

function profitMetric(label, value, tone = "") {
  return `
    <article class="profit-result ${tone}">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `;
}

function saveProfitInputs() {
  localStorage.setItem("ppecProfitInputs", JSON.stringify({
    sellingPrice: profitInputs.sellingPrice.value,
    postagePrice: profitInputs.postagePrice.value,
    usdRate: profitInputs.usdRate.value,
    vograceShipping: profitInputs.vograceShipping.value,
    fixedCosts: profitInputs.fixedCosts.value,
    percentCost: profitInputs.percentCost.value,
    tiers: {
      acrylic: readTiersFromDom("acrylic"),
      wood: readTiersFromDom("wood")
    }
  }));
}

function readProfitInputs() {
  try {
    return JSON.parse(localStorage.getItem("ppecProfitInputs")) || {};
  } catch {
    return {};
  }
}

function renderTierInputs(material, tiers) {
  if (!tierLists[material]) return;

  const normalisedTiers = normaliseTiers(tiers);
  tierLists[material].innerHTML = normalisedTiers.map((tier, index) => `
    <div class="tier-row">
      <label>
        From qty
        <input type="number" min="1" step="1" inputmode="numeric" value="${tier.minQty}" data-tier-min>
      </label>
      <label>
        Cost per pin ($)
        <input type="number" min="0" step="0.01" inputmode="decimal" value="${tier.cost}" placeholder="0.00" data-tier-cost>
      </label>
      <button class="danger-button compact-button" type="button" data-remove-tier="${index}" ${normalisedTiers.length === 1 ? "disabled" : ""}>Remove</button>
    </div>
  `).join("");
}

function readTiersFromDom(material) {
  if (!tierLists[material]) return defaultTiers(material);

  const rows = [...tierLists[material].querySelectorAll(".tier-row")];
  return normaliseTiers(rows.map((row) => ({
    minQty: row.querySelector("[data-tier-min]").value,
    cost: row.querySelector("[data-tier-cost]").value
  })));
}

function normaliseTiers(tiers) {
  const rows = tiers
    .map((tier) => ({
      minQty: Math.max(1, Math.floor(numberInput(tier.minQty || 1))),
      cost: String(tier.cost ?? "")
    }))
    .sort((a, b) => a.minQty - b.minQty);

  return rows.length ? rows : defaultTiers();
}

function defaultTiers(material = "wood", cost = "") {
  if (cost) return [{ minQty: 1, cost }];
  return defaultTierPrices[material] || [{ minQty: 1, cost: "" }];
}

function nextTierQuantity(tiers) {
  const highest = tiers.reduce((max, tier) => Math.max(max, numberInput(tier.minQty)), 0);
  return highest > 0 ? highest + 25 : 1;
}

function tierForQuantity(material, quantity) {
  const tiers = readTiersFromDom(material);
  const activeTier = tiers
    .filter((tier) => quantity >= tier.minQty)
    .at(-1) || tiers[0] || defaultTiers(material)[0];

  return {
    minQty: activeTier.minQty,
    cost: activeTier.cost,
    costCents: dollarsInputToCents(activeTier.cost)
  };
}

function tierLabel(tier, quantity) {
  if (!quantity) return "No pins";
  return `${formatDollars(tier.costCents)} from ${tier.minQty}+`;
}

function addSubmissionToAggregates(submission) {
  variants.forEach((variant) => {
    const quantity = getQuantity(submission, variant.key);
    aggregates.byVariant[variant.key] += quantity;
    aggregates.byDesign[variant.designId] += quantity;
    aggregates.byMaterial[variant.materialId] += quantity;
  });
}

function buildCsv() {
  const lines = [];
  lines.push(["PPEC Badge Interest Export"].join(","));
  lines.push([]);
  lines.push(["Manufacturing totals"]);
  lines.push(["Design", "Acrylic", "Wood", "Total"].map(csvCell).join(","));

  designs.forEach((design) => {
    const acrylic = aggregates.byVariant[`${design.id}_acrylic`];
    const wood = aggregates.byVariant[`${design.id}_wood`];
    lines.push([design.name, acrylic, wood, acrylic + wood].map(csvCell).join(","));
  });

  lines.push([]);
  lines.push(["Individual submissions"]);
  lines.push([
    "Submission ID",
    "Submitted at",
    "Discord username",
    ...variants.map((variant) => `${variant.designName} ${variant.materialName}`),
    "Total pins",
    "Estimated badge spend",
    "Planned postage"
  ].map(csvCell).join(","));

  submissions.forEach((submission) => {
    lines.push([
      submission.id,
      formatDate(submission.submittedAt),
      submission.discordUsername || "",
      ...variants.map((variant) => getQuantity(submission, variant.key)),
      submission.totalPins || 0,
      formatPounds(submission.estimatedSpendPence || 0),
      formatPounds(plannedPostagePence)
    ].map(csvCell).join(","));
  });

  return `${lines.join("\n")}\n`;
}

function createEmptyAggregates() {
  return {
    byVariant: Object.fromEntries(variants.map((variant) => [variant.key, 0])),
    byDesign: Object.fromEntries(designs.map((design) => [design.id, 0])),
    byMaterial: Object.fromEntries(materials.map((material) => [material.id, 0]))
  };
}

function metric(label, value) {
  return `
    <article class="metric-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `;
}

function getQuantity(submission, key) {
  const value = submission.quantities?.[key];
  return Number.isFinite(value) ? value : 0;
}

function setSignedOut() {
  signInButton.classList.remove("hidden");
  signOutButton.classList.add("hidden");
  dashboard.classList.add("hidden");
}

function isAuthorisedAdmin(email) {
  return adminEmails.map((item) => item.toLowerCase()).includes(String(email || "").toLowerCase());
}

function isFirebaseConfigured() {
  return Object.values(firebaseConfig).every((value) => value && !String(value).startsWith("YOUR_"));
}

function showAuthMessage(message, tone = "") {
  authMessage.textContent = message;
  authMessage.className = `form-message ${tone}`.trim();
}

function formatPounds(pence) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0
  }).format(pence / 100);
}

function formatInputPounds(pence) {
  return String((pence / 100).toFixed(2));
}

function poundsInputToPence(value) {
  return Math.round(numberInput(value) * 100);
}

function dollarsInputToCents(value) {
  return Math.round(numberInput(value) * 100);
}

function formatDollars(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(cents / 100);
}

function numberInput(value) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function formatDate(value) {
  const date = normaliseDate(value);
  if (!date) return "Pending timestamp";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function normaliseDate(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  return new Date(value);
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[character]));
}

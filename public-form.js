import { designs, materials, variants } from "./catalogue.js";
import { collectionName, firebaseConfig, unitPricePence } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  addDoc,
  collection,
  getFirestore,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const MAX_QUANTITY_PER_VARIANT = 99;

const catalogue = document.querySelector("#catalogue");
const form = document.querySelector("#interest-form");
const totalPinsEl = document.querySelector("#total-pins");
const estimatedSpendEl = document.querySelector("#estimated-spend");
const messageEl = document.querySelector("#form-message");
const submitButton = document.querySelector("#submit-button");
const discordInput = document.querySelector("#discord-username");
const confirmInput = document.querySelector("#confirm-genuine");

const quantities = Object.fromEntries(variants.map((variant) => [variant.key, 0]));
const configured = isFirebaseConfigured();
const db = configured ? getFirestore(initializeApp(firebaseConfig)) : null;

renderCatalogue();
updateSummary();

if (!configured) {
  showMessage("Firebase is not configured yet. Add your project details in firebase-config.js before collecting responses.", "warning");
}

catalogue.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const key = button.dataset.key;
  const direction = button.dataset.action === "increase" ? 1 : -1;
  setQuantity(key, quantities[key] + direction);
});

catalogue.addEventListener("input", (event) => {
  const input = event.target.closest("input[data-key]");
  if (!input) return;

  setQuantity(input.dataset.key, Number.parseInt(input.value || "0", 10), false);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage("");

  const totalPins = calculateTotalPins();
  const discordUsername = discordInput.value.trim();

  if (!configured) {
    showMessage("Firebase is not configured yet, so this response cannot be saved.", "error");
    return;
  }

  if (totalPins < 1) {
    showMessage("Please choose at least one badge before submitting.", "error");
    return;
  }

  if (!discordUsername) {
    showMessage("Please add your Discord username.", "error");
    discordInput.focus();
    return;
  }

  if (!confirmInput.checked) {
    showMessage("Please confirm these are quantities you genuinely intend to buy.", "error");
    confirmInput.focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";

  try {
    await addDoc(collection(db, collectionName), {
      discordUsername,
      quantities: { ...quantities },
      totalPins,
      estimatedSpendPence: totalPins * unitPricePence,
      submittedAt: serverTimestamp()
    });

    resetForm();
    showMessage("Thank you. Your interest has been recorded. You can submit again later if you need to send a revised response.", "success");
  } catch (error) {
    console.error(error);
    showMessage("Sorry, something went wrong while saving your response. Please try again.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit interest";
  }
});

function renderCatalogue() {
  catalogue.innerHTML = designs.map((design) => {
    const controls = materials.map((material) => {
      const key = `${design.id}_${material.id}`;
      return `
        <div class="quantity-row">
          <span class="material-label">${material.label}</span>
          <div class="stepper" aria-label="${design.name} ${material.label} quantity">
            <button type="button" data-action="decrease" data-key="${key}" aria-label="Remove one ${design.name} ${material.label} badge">-</button>
            <input inputmode="numeric" type="number" min="0" max="${MAX_QUANTITY_PER_VARIANT}" value="0" data-key="${key}" aria-label="${design.name} ${material.label} quantity">
            <button type="button" data-action="increase" data-key="${key}" aria-label="Add one ${design.name} ${material.label} badge">+</button>
          </div>
        </div>
      `;
    }).join("");

    return `
      <article class="badge-card">
        <div class="badge-image-wrap">
          <img src="${design.image}" alt="${design.alt}" loading="lazy">
        </div>
        <div class="badge-card-body">
          <div>
            <h2>${design.name}</h2>
            <p>${design.note}</p>
            <p class="badge-meta">2-inch pin · £3 each</p>
          </div>
          <div class="quantity-group">${controls}</div>
        </div>
      </article>
    `;
  }).join("");
}

function setQuantity(key, value, syncInput = true) {
  if (!Object.hasOwn(quantities, key)) return;

  const nextValue = Number.isFinite(value) ? value : 0;
  quantities[key] = Math.max(0, Math.min(MAX_QUANTITY_PER_VARIANT, nextValue));

  const input = catalogue.querySelector(`input[data-key="${key}"]`);
  if (input && (syncInput || input.value !== String(quantities[key]))) {
    input.value = quantities[key];
  }

  updateSummary();
}

function updateSummary() {
  const totalPins = calculateTotalPins();
  totalPinsEl.textContent = totalPins;
  estimatedSpendEl.textContent = formatPounds(totalPins * unitPricePence);
}

function calculateTotalPins() {
  return Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0);
}

function resetForm() {
  Object.keys(quantities).forEach((key) => {
    quantities[key] = 0;
  });

  catalogue.querySelectorAll("input[data-key]").forEach((input) => {
    input.value = "0";
  });

  discordInput.value = "";
  confirmInput.checked = false;
  updateSummary();
}

function showMessage(message, tone = "") {
  messageEl.textContent = message;
  messageEl.className = `form-message ${tone}`.trim();
}

function formatPounds(pence) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0
  }).format(pence / 100);
}

function isFirebaseConfigured() {
  return Object.values(firebaseConfig).every((value) => value && !String(value).startsWith("YOUR_"));
}

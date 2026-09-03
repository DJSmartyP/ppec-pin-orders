import { designs, materials, variants } from "./catalogue.js?v=20260903b";
import { adminEmails, collectionName, firebaseConfig, unitPricePence } from "./firebase-config.js?v=20260903b";
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

const configured = isFirebaseConfigured();
const app = configured ? initializeApp(firebaseConfig) : null;
const auth = configured ? getAuth(app) : null;
const db = configured ? getFirestore(app) : null;

let submissions = [];
let aggregates = createEmptyAggregates();

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

async function loadSubmissions() {
  showAuthMessage("Loading submissions...", "");

  try {
    const snapshot = await getDocs(collection(db, collectionName));
    submissions = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .sort((a, b) => normaliseDate(b.submittedAt) - normaliseDate(a.submittedAt));

    aggregates = createEmptyAggregates();
    submissions.forEach(addSubmissionToAggregates);
    renderDashboard();
    showAuthMessage(`${submissions.length} submission${submissions.length === 1 ? "" : "s"} loaded.`, "success");
  } catch (error) {
    console.error(error);
    showAuthMessage("Submissions could not be loaded. Check your Firestore rules and admin email.", "error");
  }
}

function renderDashboard() {
  const totalPins = variants.reduce((sum, variant) => sum + aggregates.byVariant[variant.key], 0);
  const acrylicTotal = designs.reduce((sum, design) => sum + aggregates.byVariant[`${design.id}_acrylic`], 0);
  const woodTotal = designs.reduce((sum, design) => sum + aggregates.byVariant[`${design.id}_wood`], 0);

  metricGrid.innerHTML = [
    metric("Submissions", submissions.length),
    metric("Total pins", totalPins),
    metric("Estimated sales", formatPounds(totalPins * unitPricePence)),
    metric("Acrylic / Wood", `${acrylicTotal} / ${woodTotal}`)
  ].join("");

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
      <td>${acrylicTotal}</td>
      <td>${woodTotal}</td>
      <td>${totalPins}</td>
    </tr>
  `;

  materialTotals.innerHTML = materials.map((material) => {
    const total = designs.reduce((sum, design) => sum + aggregates.byVariant[`${design.id}_${material.id}`], 0);
    return `<div><span>${material.label}</span><strong>${total}</strong></div>`;
  }).join("");

  designTotals.innerHTML = designs.map((design) => {
    return `<div><span>${design.name}</span><strong>${aggregates.byDesign[design.id]}</strong></div>`;
  }).join("");

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
          <p>${formatDate(submission.submittedAt)} · ${submission.totalPins || 0} pins · ${formatPounds((submission.estimatedSpendPence || 0))}</p>
          <ul>${rows || "<li>No quantities recorded</li>"}</ul>
        </div>
        <button class="danger-button" type="button" data-delete-id="${submission.id}">Delete</button>
      </article>
    `;
  }).join("");
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
    "Estimated spend"
  ].map(csvCell).join(","));

  submissions.forEach((submission) => {
    lines.push([
      submission.id,
      formatDate(submission.submittedAt),
      submission.discordUsername || "",
      ...variants.map((variant) => getQuantity(submission, variant.key)),
      submission.totalPins || 0,
      formatPounds(submission.estimatedSpendPence || 0)
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

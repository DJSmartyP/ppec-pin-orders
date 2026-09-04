# PPEC Badge Interest

A small GitHub Pages-ready web app for collecting genuine interest in Phantom Peak Explorers Club badge pins.

The public form does not authenticate users and deliberately does not deduplicate browsers, create edit tokens, or stop people submitting more than once. This lets people send another response later if they need to revise their quantities.

## What It Includes

- Separate intro page explaining that the form is for information and planning only.
- Four badge designs, each available as acrylic or wood.
- 2-inch pins priced at £3 each.
- Planned postage shown as £2 per order.
- Admin profit estimate treats postage as £2 charged and £1.55 estimated cost per order.
- Admin profit estimate includes Ko-fi at 5% per order and PayPal at 30p plus 2.9% per order, calculated against badges plus planned postage.
- Admin money figures show pounds and pence, rather than rounding to whole pounds.
- Independent quantity controls for all eight design/material variants.
- Discord username field.
- Live total pins and estimated spend.
- Explicit confirmation checkbox before submission.
- Firebase Firestore submission storage.
- Firebase Authentication only for the admin dashboard.
- Admin dashboard split into dashboard, calculations, and submissions pages.
- Admin dashboard with aggregate totals, material/design totals, click-through individual submission records, bogus submission deletion, profit estimates, and CSV export.
- Firestore security rules for public create-only access and admin read/list/delete access.

## Files

```text
index.html                  Intro/planning notice
badges.html                 Public interest form
thanks.html                 Post-submission thank-you page
admin.html                  Admin dashboard totals
admin-calculations.html     Admin cost and profit calculator
admin-submissions.html      Admin individual submissions and CSV export
styles.css                  Shared styling
catalogue.js                Badge catalogue and variant definitions
public-form.js              Public form behaviour and Firestore create
admin.js                    Shared admin sign-in, dashboard, calculations, delete and CSV export behaviour
firebase-config.js          Firebase config, admin email list and shared pricing/postage settings
firestore.rules             Firestore security rules
firebase.json               Firebase rules deployment config
assets/images/products/     Replaceable final badge artwork
assets/images/mockups/      Temporary split wood/acrylic rollover mock-ups
assets/images/optimised/    Lightweight WebP display images used by the live pages
assets/images/reference/    Temporary/reference product photos
```

## Firebase Setup

1. Create a Firebase project.
2. Add a web app in Firebase project settings.
3. Enable Firestore Database in production mode.
4. Enable Authentication > Sign-in method > Google.
5. In Authentication > Settings > Authorised domains, add your GitHub Pages domain, for example `yourusername.github.io`.
6. Copy the Firebase web app config into `firebase-config.js`.
7. Replace `your-admin-email@example.com` in `firebase-config.js` with the Google email allowed to use the dashboard.
8. Replace `your-admin-email@example.com` in `firestore.rules` with the same email address.
9. Publish the Firestore rules.

If you use the Firebase CLI:

```bash
cp .firebaserc.example .firebaserc
```

Edit `.firebaserc` so `YOUR_PROJECT_ID` is your real Firebase project ID, then run:

```bash
firebase deploy --only firestore:rules
```

You can also paste the contents of `firestore.rules` into the Firebase Console rules editor.

## GitHub Pages Setup

1. Create a new GitHub repository.
2. Add all files from this project.
3. Commit and push to GitHub.
4. In the repository settings, open Pages.
5. Set the source to your default branch and root folder.
6. Add the resulting GitHub Pages domain to Firebase Authentication authorised domains.

## Replacing Badge Artwork

The public form uses lightweight WebP split-finish mock-ups in `assets/images/optimised/` for speed. The temporary full-size mock-ups in `assets/images/mockups/` and the original artwork in `assets/images/products/` are kept as replaceable source files.

The original artwork lives at:

- `assets/images/products/ppec-logo.png`
- `assets/images/products/explorers-card.png`
- `assets/images/products/curiosity.png`
- `assets/images/products/ppec-pride-logo.png`

Replace those files with final artwork later, keeping the same filenames. If you rename the files, update `catalogue.js` and regenerate the matching WebP files in `assets/images/optimised/`.

Replace the mock-up files later if you get better product renders, keeping the same filenames, then regenerate the matching optimised WebP files.

## Data Model

Submissions are stored in the `interestSubmissions` collection:

```json
{
  "discordUsername": "ExampleUser",
  "quantities": {
    "ppec_logo_acrylic": 1,
    "ppec_logo_wood": 0,
    "explorers_card_acrylic": 0,
    "explorers_card_wood": 2,
    "curiosity_acrylic": 1,
    "curiosity_wood": 0,
    "ppec_pride_logo_acrylic": 0,
    "ppec_pride_logo_wood": 1
  },
  "totalPins": 5,
  "estimatedSpendPence": 1500,
  "submittedAt": "server timestamp"
}
```

## Security Model

Public users can create valid submissions only. They cannot read, list, update, or delete submissions.

Authorised admins can read, list, and delete submissions after signing in with Google. Updates are disabled, so deleting a bogus response is the only destructive admin action.

# iKhethelo Digital Website

Static website for iKhethelo Digital, a Durban-based web and software development studio.

## Pages

- `index.html`
- `services.html`
- `about.html`
- `contact.html`

## Assets

- `assets/css/styles.css`
- `assets/js/main.js`
- `assets/js/contact.js`
- `assets/images/brand-reference.png`
- `assets/images/ikhethelo-digital-logo-dark.png`

## Run Locally

Use any static file server from the project root. For example:

```bash
python -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173/
```

No JavaScript framework or build step is required.

## Placeholders

Contact details and WhatsApp number are placeholder values in `assets/js/main.js`.

The production domain in `robots.txt`, `sitemap.xml`, and Open Graph metadata is currently:

```text
https://ikhethelodigital.co.za
```
## Contact Form: Formspree

The contact form is a static-site form that submits asynchronously to Formspree from `frontend/assets/js/contact.js`. No ASP.NET Core API, database, dashboard or email credentials are required.

### Create the Formspree form

1. Sign in to Formspree.
2. Create a new form for iKhethelo Digital.
3. Copy the form ID from the endpoint URL. In `https://formspree.io/f/abcxyz`, the form ID is `abcxyz`.

### Insert the Formspree form ID

Open:

```text
frontend/assets/js/contact.js
```

Replace this configuration value:

```js
const FORMSPREE_FORM_ID = 'REPLACE_WITH_YOUR_FORMSPREE_FORM_ID';
```

with the real Formspree form ID:

```js
const FORMSPREE_FORM_ID = 'abcxyz';
```

The script builds the endpoint from that single constant and submits with `fetch`, so no form action URL is repeated in the HTML.

### Configure notification email

Configure the recipient email inside the Formspree dashboard for the form. Do not add mailbox passwords, SMTP credentials or API secrets to this repository.

### Test submissions

Successful submission test:

1. Add the real Formspree form ID in `frontend/assets/js/contact.js`.
2. Serve the `frontend` folder locally.
3. Complete all required fields with a valid email address.
4. Submit the form and confirm the success message appears without leaving the site.
5. Confirm the form clears only after the successful submission.

Failed submission test:

1. Temporarily set `FORMSPREE_FORM_ID` to an invalid value such as `invalid-test-id`.
2. Submit a valid form.
3. Confirm the error message appears and the form data remains in place.
4. Restore the real Formspree form ID before deployment.

Client-side validation test:

1. Submit the form empty and confirm required-field messages appear.
2. Enter an invalid email address and confirm the email validation message appears.
3. Confirm the submit button disables while a request is in progress.

// Replace this with the Formspree form ID from https://formspree.io/forms.
// Example endpoint produced by this value: https://formspree.io/f/YOUR_FORM_ID
const FORMSPREE_FORM_ID = 'xnjeypno';
const FORMSPREE_ENDPOINT = `https://formspree.io/f/${FORMSPREE_FORM_ID}`;

const getField = (form, name) => form.elements.namedItem(name);

const getFieldValue = (form, name) => {
  const field = getField(form, name);
  return field ? field.value.trim() : '';
};

const setFieldError = (form, name, message) => {
  const field = getField(form, name);
  const error = form.querySelector(`[data-error-for="${name}"]`);

  if (!field || !error) {
    return;
  }

  field.classList.toggle('is-invalid', Boolean(message));
  field.setAttribute('aria-invalid', String(Boolean(message)));
  error.textContent = message;
};

const clearFieldErrors = (form) => {
  form.querySelectorAll('.is-invalid').forEach((field) => {
    field.classList.remove('is-invalid');
    field.removeAttribute('aria-invalid');
  });

  form.querySelectorAll('.field-error').forEach((error) => {
    error.textContent = '';
  });
};

const setFormStatus = (status, type, message, shouldFocus = false) => {
  if (!status) {
    return;
  }

  status.className = `form-status form-status-${type}`;
  status.textContent = message;
  status.hidden = !message;

  if (shouldFocus && message) {
    status.focus?.();
  }
};

const clearFormStatus = (status) => {
  if (!status) {
    return;
  }

  status.className = 'form-status';
  status.textContent = '';
  status.hidden = true;
};

const setSubmitState = (form, submitButton, isSubmitting) => {
  if (submitButton) {
    if (!submitButton.dataset.defaultText) {
      submitButton.dataset.defaultText = submitButton.textContent;
    }

    submitButton.disabled = isSubmitting;
    submitButton.textContent = isSubmitting ? 'Sending...' : submitButton.dataset.defaultText;
  }

  form.setAttribute('aria-busy', String(isSubmitting));
};

const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const getProjectFormValues = (form) => {
  const firstName = getFieldValue(form, 'firstName');
  const lastName = getFieldValue(form, 'lastName');

  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    email: getFieldValue(form, 'email'),
    phone: getFieldValue(form, 'phone'),
    need: getFieldValue(form, 'need'),
    projectDetails: getFieldValue(form, 'projectDetails'),
    budget: getFieldValue(form, 'budget'),
    honeypot: getFieldValue(form, '_gotcha'),
  };
};

const validateProjectForm = (form) => {
  const values = getProjectFormValues(form);
  const errors = {
    firstName: values.firstName.length >= 2 ? '' : 'Please enter your first name.',
    lastName: values.lastName.length >= 2 ? '' : 'Please enter your last name.',
    email: validateEmail(values.email) ? '' : 'Please enter a valid email address.',
    phone: values.phone.length >= 7 ? '' : 'Please enter a valid phone number.',
    need: values.need ? '' : 'Please select what you need.',
    projectDetails: '',
  };

  Object.entries(errors).forEach(([name, message]) => setFieldError(form, name, message));

  return Object.values(errors).every((message) => !message);
};

const isFormspreeConfigured = () => FORMSPREE_FORM_ID && !FORMSPREE_FORM_ID.startsWith('REPLACE_WITH_');

const buildFormspreePayload = (values) => ({
  name: values.fullName,
  first_name: values.firstName,
  last_name: values.lastName,
  email: values.email,
  phone: values.phone,
  project_need: values.need,
  project_details: values.projectDetails,
  estimated_budget: values.budget || 'Not provided',
  _subject: `New iKhethelo Digital enquiry from ${values.fullName}`,
  _gotcha: values.honeypot,
});

const parseFormspreeError = async (response) => {
  try {
    const data = await response.json();
    const formspreeErrors = Array.isArray(data.errors)
      ? data.errors.map((error) => error.message).filter(Boolean).join(' ')
      : '';

    return formspreeErrors || 'Formspree could not accept the enquiry.';
  } catch {
    return 'Formspree could not accept the enquiry.';
  }
};

const submitToFormspree = async (values) => {
  if (!isFormspreeConfigured()) {
    throw new Error('The contact form is not configured yet. Please add the Formspree form ID in assets/js/contact.js.');
  }

  const response = await fetch(FORMSPREE_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildFormspreePayload(values)),
  });

  if (!response.ok) {
    throw new Error(await parseFormspreeError(response));
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#project-form');
  const status = document.querySelector('#form-status');

  if (!form || !status) {
    return;
  }

  const submitButton = form.querySelector('[type="submit"]');
  let isSubmitting = false;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    clearFormStatus(status);

    if (!validateProjectForm(form)) {
      setFormStatus(status, 'error', 'Please correct the highlighted fields and try again.');
      const firstInvalid = form.querySelector('.is-invalid');
      firstInvalid?.focus();
      return;
    }

    const values = getProjectFormValues(form);

    isSubmitting = true;
    setSubmitState(form, submitButton, true);
    setFormStatus(status, 'loading', 'Sending your enquiry...');

    try {
      await submitToFormspree(values);
      form.reset();
      clearFieldErrors(form);
      setFormStatus(status, 'success', 'Thanks. Your enquiry has been received. We will review it and get back to you.', true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong while sending your enquiry.';
      setFormStatus(status, 'error', `${message} Please try again or contact us directly.`, true);
    } finally {
      isSubmitting = false;
      setSubmitState(form, submitButton, false);
    }
  });

  form.addEventListener('input', (event) => {
    const field = event.target;

    if (field.name && field.name !== '_gotcha') {
      setFieldError(form, field.name, '');
    }
  });
});
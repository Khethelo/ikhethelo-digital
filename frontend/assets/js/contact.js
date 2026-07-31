// Replace this with the Formspree form ID from https://formspree.io/forms.
// Example endpoint produced by this value: https://formspree.io/f/YOUR_FORM_ID
const FORMSPREE_FORM_ID = 'xnjeypno';
const FORMSPREE_ENDPOINT = `https://formspree.io/f/${FORMSPREE_FORM_ID}`;

const CONTACT_MODAL_CONTENT = {
  success: {
    iconClass: 'bi-check-circle-fill',
    heading: 'Enquiry sent',
    message: 'Thank you for contacting iKhethelo Digital. We’ll get back to you as soon as possible.',
    primaryLabel: 'Done',
    showSecondary: false,
  },
  error: {
    iconClass: 'bi-x-circle-fill',
    heading: 'Unable to send enquiry',
    message: 'Something went wrong while sending your enquiry. Please check your connection and try again.',
    primaryLabel: 'Try again',
    showSecondary: true,
  },
};

const getField = (form, name) => form.elements.namedItem(name);

const getFieldValue = (form, name) => {
  const field = getField(form, name);
  return field ? field.value.trim() : '';
};

const setFieldError = (form, name, message) => {
  const field = getField(form, name);
  const error = form.querySelector(`[data-error-for="${name}"]`);
  const hasError = Boolean(message);

  if (!field || !error) {
    return;
  }

  field.classList.toggle('is-invalid', hasError);

  if (hasError) {
    field.setAttribute('aria-invalid', 'true');
  } else {
    field.removeAttribute('aria-invalid');
  }

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

const setLiveStatus = (status, message) => {
  if (!status) {
    return;
  }

  status.textContent = message;
  status.hidden = !message;
};

const clearLiveStatus = (status) => {
  setLiveStatus(status, '');
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

const SOUTH_AFRICAN_PHONE_ERROR = 'Enter a valid South African contact number, for example 082 123 4567.';

const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const normalizeSouthAfricanContactNumber = (value) => value.replace(/[\s\-()]/g, '');

const validateSouthAfricanContactNumber = (value) => {
  const normalizedValue = normalizeSouthAfricanContactNumber(value);

  return /^0\d{9}$/.test(normalizedValue) || /^\+27\d{9}$/.test(normalizedValue);
};

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
    phone: validateSouthAfricanContactNumber(values.phone) ? '' : SOUTH_AFRICAN_PHONE_ERROR,
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

const openContactModal = (modal, state) => {
  const content = CONTACT_MODAL_CONTENT[state];
  const title = modal.querySelector('#contact-modal-title');
  const message = modal.querySelector('#contact-modal-message');
  const icon = modal.querySelector('[data-contact-modal-icon]');
  const primaryButton = modal.querySelector('[data-contact-modal-primary]');
  const secondaryButton = modal.querySelector('[data-contact-modal-secondary]');

  modal.dataset.state = state;
  modal.classList.toggle('contact-modal-success', state === 'success');
  modal.classList.toggle('contact-modal-error', state === 'error');

  if (title) {
    title.textContent = content.heading;
  }

  if (message) {
    message.textContent = content.message;
  }

  if (icon) {
    icon.className = `bi ${content.iconClass}`;
  }

  if (primaryButton) {
    primaryButton.textContent = content.primaryLabel;
  }

  if (secondaryButton) {
    secondaryButton.hidden = !content.showSecondary;
  }

  if (typeof modal.showModal === 'function') {
    modal.showModal();
  } else {
    modal.setAttribute('open', '');
  }

  primaryButton?.focus();
};

const closeContactModal = (modal) => {
  if (modal.open && typeof modal.close === 'function') {
    modal.close();
    return;
  }

  modal.removeAttribute('open');
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#project-form');
  const status = document.querySelector('#form-status');
  const modal = document.querySelector('#contact-result-dialog');

  if (!form || !status || !modal) {
    return;
  }

  const submitButton = form.querySelector('[type="submit"]');
  const modalPrimaryButton = modal.querySelector('[data-contact-modal-primary]');
  const modalSecondaryButton = modal.querySelector('[data-contact-modal-secondary]');
  let isSubmitting = false;

  modal.addEventListener('close', () => {
    submitButton?.focus();
  });

  modalPrimaryButton?.addEventListener('click', () => {
    const state = modal.dataset.state;
    closeContactModal(modal);

    if (state === 'error') {
      window.setTimeout(() => form.requestSubmit(), 0);
    }
  });

  modalSecondaryButton?.addEventListener('click', () => {
    closeContactModal(modal);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    clearLiveStatus(status);

    if (!validateProjectForm(form)) {
      setLiveStatus(status, 'Please correct the highlighted fields and try again.');
      const firstInvalid = form.querySelector('.is-invalid');
      firstInvalid?.focus();
      return;
    }

    const values = getProjectFormValues(form);

    isSubmitting = true;
    setSubmitState(form, submitButton, true);
    setLiveStatus(status, 'Sending your enquiry...');

    try {
      await submitToFormspree(values);
      form.reset();
      clearFieldErrors(form);
      setLiveStatus(status, CONTACT_MODAL_CONTENT.success.message);
      openContactModal(modal, 'success');
    } catch {
      setLiveStatus(status, CONTACT_MODAL_CONTENT.error.message);
      openContactModal(modal, 'error');
    } finally {
      isSubmitting = false;
      setSubmitState(form, submitButton, false);
    }
  });

  form.addEventListener('input', (event) => {
    const field = event.target;

    if (!field.name || field.name === '_gotcha') {
      return;
    }

    if (field.name === 'phone') {
      const shouldKeepError = field.classList.contains('is-invalid') && !validateSouthAfricanContactNumber(field.value);
      setFieldError(form, 'phone', shouldKeepError ? SOUTH_AFRICAN_PHONE_ERROR : '');
      return;
    }

    setFieldError(form, field.name, '');
  });
});

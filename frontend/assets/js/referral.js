// Referral submissions use the dedicated Formspree form created for the Referral Program.
// Form endpoint produced by this ID: https://formspree.io/f/xdenqddj
const REFERRAL_FORMSPREE_FORM_ID = 'xdenqddj';
const REFERRAL_FORMSPREE_ENDPOINT = `https://formspree.io/f/${REFERRAL_FORMSPREE_FORM_ID}`;
// Formspree's Email action should target this address; the payload records the expected destination.
const REFERRAL_RECIPIENT_EMAIL = window.IW_CONFIG?.email || 'info@ikhethelodigital.co.za';

const REFERRAL_MODAL_CONTENT = {
  success: {
    iconClass: 'bi-check-circle-fill',
    heading: 'Referral submitted',
    message: 'Thank you for sending the referral. We will review it and get in touch soon.',
    primaryLabel: 'Done',
    showSecondary: false,
  },
  error: {
    iconClass: 'bi-x-circle-fill',
    heading: 'Unable to submit referral',
    message: 'Something went wrong while sending your referral. Please check your connection and try again.',
    primaryLabel: 'Try again',
    showSecondary: true,
  },
};

const REFERRAL_PHONE_ERROR = 'Enter a valid South African contact number, for example 082 123 4567.';
const REFERRAL_REQUIRED_TERMS_ERROR = 'Please accept the referral program terms before submitting.';

const getReferralField = (form, name) => form.elements.namedItem(name);

const getReferralFieldValue = (form, name) => {
  const field = getReferralField(form, name);
  return field ? field.value.trim() : '';
};

const setReferralFieldError = (form, name, message) => {
  const field = getReferralField(form, name);
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

const clearReferralFieldErrors = (form) => {
  form.querySelectorAll('.is-invalid').forEach((field) => {
    field.classList.remove('is-invalid');
    field.removeAttribute('aria-invalid');
  });

  form.querySelectorAll('.field-error').forEach((error) => {
    error.textContent = '';
  });
};

const setReferralLiveStatus = (status, message) => {
  if (!status) {
    return;
  }

  status.textContent = message;
  status.hidden = !message;
};

const setReferralSubmitState = (form, submitButton, isSubmitting) => {
  if (submitButton) {
    if (!submitButton.dataset.defaultText) {
      submitButton.dataset.defaultText = submitButton.textContent;
    }

    submitButton.disabled = isSubmitting;
    submitButton.textContent = isSubmitting ? 'Sending...' : submitButton.dataset.defaultText;
  }

  form.setAttribute('aria-busy', String(isSubmitting));
};

const validateReferralEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const normalizeReferralPhone = (value) => value.replace(/[\s\-()]/g, '');

const validateReferralPhone = (value) => {
  const normalizedValue = normalizeReferralPhone(value);
  return /^0\d{9}$/.test(normalizedValue) || /^\+27\d{9}$/.test(normalizedValue);
};

const getReferralFormValues = (form) => ({
  referrerName: getReferralFieldValue(form, 'referrerName'),
  referrerEmail: getReferralFieldValue(form, 'referrerEmail'),
  referrerPhone: getReferralFieldValue(form, 'referrerPhone'),
  businessName: getReferralFieldValue(form, 'businessName'),
  contactPersonName: getReferralFieldValue(form, 'contactPersonName'),
  contactEmail: getReferralFieldValue(form, 'contactEmail'),
  contactPhone: getReferralFieldValue(form, 'contactPhone'),
  termsAccepted: Boolean(getReferralField(form, 'termsAccepted')?.checked),
  honeypot: getReferralFieldValue(form, '_gotcha'),
});

const validateReferralForm = (form) => {
  const values = getReferralFormValues(form);
  const errors = {
    referrerName: values.referrerName.length >= 2 ? '' : 'Please enter your full name.',
    referrerEmail: validateReferralEmail(values.referrerEmail) ? '' : 'Please enter a valid email address.',
    referrerPhone: validateReferralPhone(values.referrerPhone) ? '' : REFERRAL_PHONE_ERROR,
    businessName: values.businessName.length >= 2 ? '' : 'Please enter the business name.',
    contactEmail: !values.contactEmail || validateReferralEmail(values.contactEmail) ? '' : 'Please enter a valid contact email address.',
    contactPhone: !values.contactPhone || validateReferralPhone(values.contactPhone) ? '' : REFERRAL_PHONE_ERROR,
    termsAccepted: values.termsAccepted ? '' : REFERRAL_REQUIRED_TERMS_ERROR,
  };

  Object.entries(errors).forEach(([name, message]) => setReferralFieldError(form, name, message));

  return Object.values(errors).every((message) => !message);
};

const isReferralFormspreeConfigured = () => REFERRAL_FORMSPREE_FORM_ID && !REFERRAL_FORMSPREE_FORM_ID.startsWith('REPLACE_WITH_');

const buildReferralPayload = (values) => ({
  name: values.referrerName,
  email: values.referrerEmail,
  referral_type: 'Referral Program',
  referrer_name: values.referrerName,
  referrer_email: values.referrerEmail,
  referrer_phone: values.referrerPhone,
  referred_business_name: values.businessName,
  referred_contact_name: values.contactPersonName || 'Not provided',
  referred_contact_email: values.contactEmail || 'Not provided',
  referred_contact_phone: values.contactPhone || 'Not provided',
  terms_accepted: values.termsAccepted ? 'Yes' : 'No',
  recipient_email: REFERRAL_RECIPIENT_EMAIL,
  _subject: `New iKhethelo Digital referral: ${values.businessName}`,
  _gotcha: values.honeypot,
});

const parseReferralFormspreeError = async (response) => {
  try {
    const data = await response.json();
    const formspreeErrors = Array.isArray(data.errors)
      ? data.errors.map((error) => error.message).filter(Boolean).join(' ')
      : '';

    return formspreeErrors || 'Formspree could not accept the referral.';
  } catch {
    return 'Formspree could not accept the referral.';
  }
};

const submitReferralToFormspree = async (values) => {
  if (!isReferralFormspreeConfigured()) {
    throw new Error('The referral form is not configured yet. Please add the Formspree form ID in assets/js/referral.js.');
  }

  const response = await fetch(REFERRAL_FORMSPREE_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildReferralPayload(values)),
  });

  if (!response.ok) {
    throw new Error(await parseReferralFormspreeError(response));
  }
};

const openReferralModal = (modal, state) => {
  const content = REFERRAL_MODAL_CONTENT[state];
  const title = modal.querySelector('#referral-modal-title');
  const message = modal.querySelector('#referral-modal-message');
  const icon = modal.querySelector('[data-referral-modal-icon]');
  const primaryButton = modal.querySelector('[data-referral-modal-primary]');
  const secondaryButton = modal.querySelector('[data-referral-modal-secondary]');

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

const closeReferralModal = (modal) => {
  if (modal.open && typeof modal.close === 'function') {
    modal.close();
    return;
  }

  modal.removeAttribute('open');
};

const maybeClearReferralFieldError = (form, field) => {
  if (!field.classList.contains('is-invalid')) {
    return;
  }

  if (field.name === 'referrerPhone') {
    setReferralFieldError(form, field.name, validateReferralPhone(field.value) ? '' : REFERRAL_PHONE_ERROR);
    return;
  }

  if (field.name === 'contactPhone') {
    const isValidOptionalPhone = !field.value.trim() || validateReferralPhone(field.value);
    setReferralFieldError(form, field.name, isValidOptionalPhone ? '' : REFERRAL_PHONE_ERROR);
    return;
  }

  if (field.name === 'referrerEmail') {
    setReferralFieldError(form, field.name, validateReferralEmail(field.value) ? '' : 'Please enter a valid email address.');
    return;
  }

  if (field.name === 'contactEmail') {
    const isValidOptionalEmail = !field.value.trim() || validateReferralEmail(field.value);
    setReferralFieldError(form, field.name, isValidOptionalEmail ? '' : 'Please enter a valid contact email address.');
    return;
  }

  setReferralFieldError(form, field.name, '');
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#referral-form');
  const status = document.querySelector('#referral-form-status');
  const modal = document.querySelector('#referral-result-dialog');

  if (!form || !status || !modal) {
    return;
  }

  const submitButton = form.querySelector('[type="submit"]');
  const modalPrimaryButton = modal.querySelector('[data-referral-modal-primary]');
  const modalSecondaryButton = modal.querySelector('[data-referral-modal-secondary]');
  let isSubmitting = false;

  modal.addEventListener('close', () => {
    submitButton?.focus();
  });

  modalPrimaryButton?.addEventListener('click', () => {
    const state = modal.dataset.state;
    closeReferralModal(modal);

    if (state === 'error') {
      window.setTimeout(() => form.requestSubmit(), 0);
    }
  });

  modalSecondaryButton?.addEventListener('click', () => {
    closeReferralModal(modal);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setReferralLiveStatus(status, '');

    if (!validateReferralForm(form)) {
      setReferralLiveStatus(status, 'Please correct the highlighted fields and try again.');
      const firstInvalid = form.querySelector('.is-invalid');
      firstInvalid?.focus();
      return;
    }

    const values = getReferralFormValues(form);

    isSubmitting = true;
    setReferralSubmitState(form, submitButton, true);
    setReferralLiveStatus(status, 'Sending your referral...');

    try {
      await submitReferralToFormspree(values);
      form.reset();
      clearReferralFieldErrors(form);
      setReferralLiveStatus(status, REFERRAL_MODAL_CONTENT.success.message);
      openReferralModal(modal, 'success');
    } catch {
      setReferralLiveStatus(status, REFERRAL_MODAL_CONTENT.error.message);
      openReferralModal(modal, 'error');
    } finally {
      isSubmitting = false;
      setReferralSubmitState(form, submitButton, false);
    }
  });

  form.addEventListener('input', (event) => {
    const field = event.target;

    if (!field.name || field.name === '_gotcha') {
      return;
    }

    maybeClearReferralFieldError(form, field);
  });

  form.addEventListener('change', (event) => {
    const field = event.target;

    if (field.name === 'termsAccepted') {
      setReferralFieldError(form, field.name, field.checked ? '' : REFERRAL_REQUIRED_TERMS_ERROR);
    }
  });
});

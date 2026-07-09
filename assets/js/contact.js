const getField = (form, name) => form.elements.namedItem(name);

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

const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const validateProjectForm = (form) => {
  const values = {
    fullName: getField(form, 'fullName').value.trim(),
    businessName: getField(form, 'businessName').value.trim(),
    email: getField(form, 'email').value.trim(),
    phone: getField(form, 'phone').value.trim(),
    need: getField(form, 'need').value.trim(),
    projectDetails: getField(form, 'projectDetails').value.trim(),
  };

  const errors = {
    fullName: values.fullName.length >= 2 ? '' : 'Please enter your full name.',
    businessName: values.businessName.length >= 2 ? '' : 'Please enter your business name.',
    email: validateEmail(values.email) ? '' : 'Please enter a valid email address.',
    phone: values.phone.length >= 7 ? '' : 'Please enter a valid phone number.',
    need: values.need ? '' : 'Please select what you need.',
    projectDetails:
      values.projectDetails.length >= 20
        ? ''
        : 'Please share at least 20 characters about the project.',
  };

  Object.entries(errors).forEach(([name, message]) => setFieldError(form, name, message));

  return Object.values(errors).every((message) => !message);
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#project-form');
  const success = document.querySelector('#form-success');

  if (!form || !success) {
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    success.hidden = true;

    if (!validateProjectForm(form)) {
      const firstInvalid = form.querySelector('.is-invalid');
      firstInvalid?.focus();
      return;
    }

    // TODO: Replace development success state with API submission.
    form.reset();
    form.querySelectorAll('.is-invalid').forEach((field) => field.classList.remove('is-invalid'));
    form.querySelectorAll('.field-error').forEach((error) => {
      error.textContent = '';
    });
    success.hidden = false;
    success.focus?.();
  });

  form.addEventListener('input', (event) => {
    const field = event.target;
    if (field.name) {
      setFieldError(form, field.name, '');
    }
  });
});

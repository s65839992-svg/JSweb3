import { normalizePhone } from './phone.mjs';

const form = document.querySelector('#brief-form');
const messages = JSON.parse(document.querySelector('#messages').textContent);
const formStatus = document.querySelector('#form-status');
const copyStatus = document.querySelector('#copy-status');
const phone = form.elements.phone;
const region = form.elements.region;
const submit = form.querySelector('button[type=submit]');
const confirmation = document.querySelector('#brief-success');
const service = new URLSearchParams(location.search).get('service');
let requestId = null;
let lastPayload = null;

if (document.documentElement.lang === 'en') region.value = 'US';
form.addEventListener('input', () => {
  if (!submit.disabled) formStatus.textContent = '';
});
for (const control of document.querySelectorAll('[data-copy],[data-copy-on-open]')) {
  control.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(control.dataset.copy || control.dataset.copyOnOpen);
      copyStatus.textContent = messages.copied;
    } catch {
      copyStatus.textContent = messages.copyFail;
    }
  });
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submit.disabled) return;
  const name = form.elements.namedItem('name');
  const description = form.elements.namedItem('description');
  const invalid = [
    [name, !name.value.trim() || name.value.length > 80, messages.badName],
    [phone, !normalizePhone(phone.value, region.value), messages.badPhone],
    [description, description.value.trim().length < 8 || description.value.length > 2000, messages.badDescription],
    [form.elements.consent, !form.elements.consent.checked, messages.badConsent],
  ].find(([,hasError]) => hasError);
  if (invalid) {
    const [field,,message] = invalid;
    formStatus.textContent = message;
    field.focus();
    return;
  }
  const fields = new FormData(form);
  const payload = { ...Object.fromEntries(fields), lang:document.documentElement.lang, service };
  const json = JSON.stringify(payload);
  submit.disabled = true;
  submit.textContent = messages.sending;
  formStatus.textContent = messages.sending;
  let timeout;
  try {
    if (lastPayload !== json) {
      // Secure random bytes also work in browsers without crypto.randomUUID().
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      bytes[6] = (bytes[6] & 15) | 64;
      bytes[8] = (bytes[8] & 63) | 128;
      const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
      requestId = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
      lastPayload = json;
    }
    const options = {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...payload, requestId})};
    if (typeof AbortController === 'function') {
      const controller = new AbortController();
      options.signal = controller.signal;
      timeout = setTimeout(() => controller.abort(), 25000);
    }
    const response = await fetch('https://api.jsweb3.dev/brief', options);
    if (response.status === 429) {
      formStatus.textContent = messages.limited;
      return;
    }
    if (!response.ok || !(await response.json()).ok) throw new Error('Submission failed');
    form.reset();
    requestId = lastPayload = null;
    if (document.documentElement.lang === 'en') region.value = 'US';
    formStatus.textContent = messages.sent;
    if (typeof confirmation?.showModal === 'function') confirmation.showModal();
    else window.alert(messages.sent);
  } catch {
    formStatus.textContent = messages.failed;
  } finally {
    clearTimeout(timeout);
    submit.disabled = false;
    submit.textContent = messages.submit;
  }
});

// Keep native required-field validation until the submit handler is installed.
form.noValidate = true;

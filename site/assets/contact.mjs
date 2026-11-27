import { normalizePhone } from './phone.mjs';

const form = document.querySelector('#brief-form');
const messages = JSON.parse(document.querySelector('#messages').textContent);
const formStatus = document.querySelector('#form-status');
const copyStatus = document.querySelector('#copy-status');
const phone = form.elements.phone;
const region = form.elements.region;
const submit = form.querySelector('button[type=submit]');
const service = new URLSearchParams(location.search).get('service');
let requestId = null;
let lastPayload = null;

if (document.documentElement.lang === 'en') region.value = 'US';
for (const input of [phone,region]) input.addEventListener('input', () => {
  if (phone.validity.customError) formStatus.textContent = '';
  phone.setCustomValidity('');
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
  const fields = new FormData(form);
  if (!normalizePhone(fields.get('phone'), fields.get('region'))) {
    phone.setCustomValidity(messages.badPhone);
    formStatus.textContent = messages.badPhone;
    phone.reportValidity();
    return;
  }
  const payload = { ...Object.fromEntries(fields), lang:document.documentElement.lang, service };
  const json = JSON.stringify(payload);
  if (lastPayload !== json) requestId = crypto.randomUUID();
  lastPayload = json;
  submit.disabled = true;
  formStatus.textContent = messages.sending;
  try {
    const response = await fetch('https://api.jsweb3.dev/brief', {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...payload, requestId}), signal:AbortSignal.timeout(25000),
    });
    if (response.status === 429) {
      formStatus.textContent = messages.limited;
      return;
    }
    if (!response.ok || !(await response.json()).ok) throw new Error('Submission failed');
    form.reset();
    requestId = lastPayload = null;
    if (document.documentElement.lang === 'en') region.value = 'US';
    formStatus.textContent = messages.sent;
  } catch {
    formStatus.textContent = messages.failed;
  } finally {
    submit.disabled = false;
  }
});

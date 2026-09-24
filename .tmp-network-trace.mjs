const endpoint = 'http://127.0.0.1:9222';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForJson(url, timeout = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {}
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

const target = await waitForJson(`${endpoint}/json/new?http://127.0.0.1:5173/login`, 15000)
  .catch(async () => {
    const response = await fetch(`${endpoint}/json/new?http://127.0.0.1:5173/login`, { method: 'PUT' });
    if (!response.ok) throw new Error(`Cannot create browser target: ${response.status}`);
    return response.json();
  });

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let sequence = 0;
const pending = new Map();
const requests = new Map();
const consoleMessages = [];

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const waiter = pending.get(message.id);
    if (waiter) {
      pending.delete(message.id);
      if (message.error) waiter.reject(new Error(message.error.message));
      else waiter.resolve(message.result);
    }
    return;
  }
  if (message.method === 'Network.requestWillBeSent') {
    const { requestId, request, initiator, type } = message.params;
    if (request.url.includes('/api/')) {
      requests.set(requestId, {
        requestId,
        method: request.method,
        url: request.url,
        requestHeaders: request.headers,
        initiator,
        type,
      });
    }
  } else if (message.method === 'Network.responseReceived') {
    const item = requests.get(message.params.requestId);
    if (item) {
      item.status = message.params.response.status;
      item.responseHeaders = message.params.response.headers;
    }
  } else if (message.method === 'Network.loadingFinished') {
    const item = requests.get(message.params.requestId);
    if (item) item.finished = true;
  } else if (message.method === 'Runtime.consoleAPICalled') {
    consoleMessages.push({ type: message.params.type, values: message.params.args.map((arg) => arg.value ?? arg.description) });
  }
});

function send(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression, awaitPromise = true) {
  const result = await send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true, userGesture: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function waitFor(expression, label, timeout = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(`Boolean(${expression})`)) return;
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

await send('Network.enable');
await send('Runtime.enable');
await send('Page.enable');
await waitFor(`document.readyState === 'complete'`, 'login page');
await waitFor(`document.querySelector('#email')`, 'login form');

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const email = `codex-runtime-${suffix}@example.test`;
const password = `Trace-${suffix}-Safe!`;

await evaluate(`(() => {
  const click = (text) => [...document.querySelectorAll('button')].find((button) => button.textContent.trim() === text).click();
  click('Créer un compte');
})()`);
await waitFor(`document.querySelector('#username')`, 'signup form');

await evaluate(`(() => {
  const set = (selector, value) => {
    const element = document.querySelector(selector);
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  };
  set('#username', 'Codex Runtime Trace');
  set('#email', ${JSON.stringify(email)});
  set('#password', ${JSON.stringify(password)});
  set('#confirmPassword', ${JSON.stringify(password)});
  document.querySelector('form').requestSubmit();
})()`);

await waitFor(`location.pathname !== '/login'`, 'successful signup');
await evaluate(`location.href = 'http://127.0.0.1:5173/sortie'`);
await waitFor(`document.querySelector('form input[name="reason"]')`, 'Sortie form');
await waitFor(`!document.body.textContent.includes('Chargement du taux')`, 'exchange rate', 30000).catch(() => {});

await evaluate(`(() => {
  const set = (selector, value) => {
    const element = document.querySelector(selector);
    const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  };
  set('[name="reason"]', 'TRACE AUTH IDEMPOTENCY ${suffix}');
  set('[name="recipientName"]', 'Codex Test Recipient');
  set('[name="recipientPhone"]', '+243000000000');
  set('[name="amountInFC"]', '100');
})()`);

await waitFor(`!document.querySelector('form button[type="submit"]').disabled`, 'valid expense form');
await sleep(100);
await evaluate(`document.querySelector('form').requestSubmit()`);

await waitFor(`document.querySelector('.confirm-dialog-confirm')`, 'confirmation dialog');
await evaluate(`(() => {
  const button = document.querySelector('.confirm-dialog-confirm');
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
})()`);

await waitFor(`!document.querySelector('.confirm-dialog-confirm')`, 'successful expense completion', 30000);
await sleep(1200);

const output = {
  email,
  pathname: await evaluate('location.pathname'),
  tokenStored: await evaluate(`Boolean(localStorage.getItem('token'))`),
  message: await evaluate(`document.body.innerText.match(/Décaissement[^\n]*/)?.[0] || null`),
  requests: [...requests.values()],
  consoleMessages,
};

process.stdout.write(JSON.stringify(output, null, 2));
socket.close();

const targets = await (await fetch('http://127.0.0.1:9222/json')).json();
const target = targets.find((item) => item.type === 'page' && item.url.includes('127.0.0.1:5173'));
if (!target) throw new Error('No app page target');
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let id = 0;
const pending = new Map();
socket.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  if (!message.id) return;
  const waiter = pending.get(message.id);
  if (!waiter) return;
  pending.delete(message.id);
  waiter.resolve(message.result);
};
const send = (method, params = {}) => new Promise((resolve) => {
  const requestId = ++id;
  pending.set(requestId, { resolve });
  socket.send(JSON.stringify({ id: requestId, method, params }));
});
const expression = `JSON.stringify({
  url: location.href,
  body: document.body.innerText.slice(0, 4000),
  form: [...document.querySelectorAll('input,select,textarea')].map((element) => ({ name: element.name, value: element.value, checked: element.checked })),
  submitDisabled: document.querySelector('form button[type="submit"]')?.disabled,
  token: Boolean(localStorage.getItem('token'))
}, null, 2)`;
const result = await send('Runtime.evaluate', { expression, returnByValue: true });
process.stdout.write(result.result.value);
socket.close();

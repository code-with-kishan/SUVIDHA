import api from './api';

const OFFLINE_QUEUE_KEY = 'suvidha_offline_queue';
const OFFLINE_QUEUE_VERSION = 2;
const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

const toBase64 = (bytes) => {
  const chars = String.fromCharCode(...bytes);
  return btoa(chars);
};

const fromBase64 = (base64) => {
  const chars = atob(base64);
  return Uint8Array.from(chars, (char) => char.charCodeAt(0));
};

const getCryptoSeed = () => {
  const kioskKey = import.meta.env.VITE_KIOSK_KEY || 'suvidha-default-offline-key';
  const kioskId = import.meta.env.VITE_KIOSK_ID || 'kiosk';
  return `${kioskId}:${kioskKey}`;
};

const deriveQueueKey = async () => {
  const seedMaterial = await crypto.subtle.digest('SHA-256', TEXT_ENCODER.encode(getCryptoSeed()));
  return crypto.subtle.importKey('raw', seedMaterial, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
};

const encryptQueue = async (queue) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveQueueKey();
  const plaintext = TEXT_ENCODER.encode(JSON.stringify(queue));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

  return {
    v: OFFLINE_QUEUE_VERSION,
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(encrypted))
  };
};

const decryptQueue = async (payload) => {
  const key = await deriveQueueKey();
  const iv = fromBase64(payload.iv);
  const encrypted = fromBase64(payload.data);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
  const parsed = JSON.parse(TEXT_DECODER.decode(new Uint8Array(decrypted)));
  return Array.isArray(parsed) ? parsed : [];
};

const getQueue = async () => {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      await saveQueue(parsed);
      return parsed;
    }

    if (parsed?.v === OFFLINE_QUEUE_VERSION && parsed.iv && parsed.data) {
      return decryptQueue(parsed);
    }

    return [];
  } catch (_error) {
    return [];
  }
};

const saveQueue = async (queue) => {
  const payload = await encryptQueue(queue);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(payload));
};

export const enqueueOfflineAction = async ({ type, payload }) => {
  const queue = await getQueue();
  queue.push({
    type,
    payload,
    clientQueueId: `q_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    queuedAt: new Date().toISOString()
  });
  await saveQueue(queue);
  return queue.length;
};

export const getOfflineQueueSize = async () => {
  const queue = await getQueue();
  return queue.length;
};

export const syncOfflineQueue = async () => {
  const queue = await getQueue();
  if (!queue.length) {
    return { synced: 0, failed: 0, remaining: 0 };
  }

  const { data } = await api.post('/api/sync/queue', { queue });
  const results = data.results || [];

  const failedIds = new Set(
    results
      .filter((item) => item.status === 'FAILED')
      .map((item) => item.clientQueueId)
  );

  const rejectedIds = new Set(
    results
      .filter((item) => item.status === 'REJECTED')
      .map((item) => item.clientQueueId)
  );

  const remaining = queue.filter((item) => failedIds.has(item.clientQueueId));
  await saveQueue(remaining);

  return {
    synced: results.filter((item) => item.status === 'SYNCED').length,
    failed: failedIds.size,
    rejected: rejectedIds.size,
    remaining: remaining.length
  };
};

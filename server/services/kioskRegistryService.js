const kiosks = new Map();

const OFFLINE_THRESHOLD_MS = 2 * 60 * 1000;

export const updateKioskHeartbeat = ({ kioskId, metadata = {} }) => {
  const now = new Date();
  kiosks.set(kioskId, {
    kioskId,
    lastSeenAt: now.toISOString(),
    metadata,
    status: 'ONLINE'
  });
};

export const getKioskStatusSummary = () => {
  const now = Date.now();
  let online = 0;
  let offline = 0;

  const entries = Array.from(kiosks.values()).map((kiosk) => {
    const isOnline = now - new Date(kiosk.lastSeenAt).getTime() <= OFFLINE_THRESHOLD_MS;
    const status = isOnline ? 'ONLINE' : 'OFFLINE';
    if (isOnline) online += 1;
    else offline += 1;

    return {
      ...kiosk,
      status
    };
  });

  return {
    online,
    offline,
    total: entries.length,
    kiosks: entries.sort((a, b) => new Date(b.lastSeenAt) - new Date(a.lastSeenAt))
  };
};

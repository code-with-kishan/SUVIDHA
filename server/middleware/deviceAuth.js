const resolveAllowedKiosks = () => {
  const raw = process.env.KIOSK_DEVICE_KEYS || '';
  const entries = raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((pair) => pair.split(':').map((value) => value.trim()))
    .filter((parts) => parts.length === 2 && parts[0] && parts[1]);

  return new Map(entries);
};

export const kioskDeviceAuth = (req, res, next) => {
  const kioskId = req.headers['x-kiosk-id'];
  const kioskKey = req.headers['x-kiosk-key'];

  if (!kioskId || !kioskKey) {
    return res.status(401).json({ message: 'Kiosk device credentials are required' });
  }

  const whitelist = resolveAllowedKiosks();

  if (whitelist.size === 0) {
    return res.status(503).json({
      message: 'Kiosk device authentication not configured'
    });
  }

  const expectedKey = whitelist.get(String(kioskId));
  if (!expectedKey || expectedKey !== String(kioskKey)) {
    return res.status(403).json({ message: 'Invalid kiosk device credentials' });
  }

  req.kiosk = { kioskId: String(kioskId) };
  next();
};

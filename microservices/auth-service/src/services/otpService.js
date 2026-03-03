export const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

export const getOtpExpiry = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 2);
  return now;
};

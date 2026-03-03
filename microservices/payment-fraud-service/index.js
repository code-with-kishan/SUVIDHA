import 'dotenv/config';
import app from './src/app.js';

const PORT = process.env.PORT || 5102;

app.listen(PORT, () => {
  console.log(`SUVIDHA payment-fraud-service running on port ${PORT}`);
});

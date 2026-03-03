import 'dotenv/config';
import app from './src/app.js';

const PORT = process.env.PORT || 5104;

app.listen(PORT, () => {
  console.log(`SUVIDHA notification-service running on port ${PORT}`);
});

import 'dotenv/config';
import app from './src/app.js';

const PORT = process.env.PORT || 5101;

app.listen(PORT, () => {
  console.log(`SUVIDHA auth-service running on port ${PORT}`);
});

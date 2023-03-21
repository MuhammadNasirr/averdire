import env from './setupenv.js';
import app from './app.js';
import setupInbox from './setupInbox.js';

const port = process.env.PORT || 5000;
var server = app.listen(port, () => {
  /* eslint-disable no-console */
  console.log(`Listening: http://localhost:${port}`);
  /* eslint-enable no-console */
});

setupInbox(server)
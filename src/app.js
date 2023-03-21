import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import { notFound, errorHandler } from './middlewares/index.js';
import routes from './routes/index.js';

const app = express();

app.use(morgan('dev'));
app.use(helmet());

const corsOptions = {
  origin: '*'
};

// app.use(cors(corsOptions));
app.use(cors());

// Parse JSON bodies (as sent by API clients)
app.use(express.json());
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));

routes(app);

// Mount static content folder
app.use('/static', express.static('static'));
// Mount uploads folder
app.use(express.static('uploads'));
app.use(notFound);
app.use(errorHandler);

export default app;

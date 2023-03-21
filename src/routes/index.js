import authRoutes from './main/auth.routes.js';
import cAuthRoutes from './company/auth.routes.js';
import sAuthRoutes from './admin/auth.routes.js';
import mainRoutes from './main/index.js';
import companyRoutes from './company/index.js';
import adminRoutes from './admin/index.js';
import commonRoutes from './common/index.js';
import publicRoutes from './public/index.js';
import { authJwt } from "../middlewares/index.js";

export default (app) => {
  app.use((req, res, next) => {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, Content-Type, Accept'
    );
    next();
  });

  app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Averdire application.' });
  });
  
  // default user routes
  app.use('/api/auth/', authRoutes);
  // company user routes
  app.use('/api/c/auth/', cAuthRoutes);
  // supder admin user routes
  app.use('/api/s/auth/', sAuthRoutes);

  // company user routes
  app.use('/api/c/', [authJwt.verifyToken, authJwt.isCompanyAdmin], companyRoutes);
  // supder admin user routes
  app.use('/api/s/', [authJwt.verifyToken, authJwt.isSuperAdmin], adminRoutes);
  // all type of user (common) routes
  app.use('/api/cm/', [authJwt.verifyToken], commonRoutes);
  // All public access routes
  app.use('/api/p/', publicRoutes);
  // default user routes
  app.use('/api/', [authJwt.verifyToken, authJwt.isDefaultUser], mainRoutes);
};
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const app = express();

// Middlewares
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '..', '..', 'uploads')));

// Swagger
const swaggerDocument = YAML.load(path.join(__dirname, '..', 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.get('/', (req, res) => {
  res.send('<h1>Welcome to the API</h1><h2>Go to <a href="/api-docs">/api-docs</a> to see the API documentation</h2>');
});


const authRoute = require('../routes/authRoutes');
const teacherRoute = require('../routes/teacherRoutes');
const studentRoute = require('../routes/studentRoutes');
const publicRoute = require('../routes/publicRoutes');
const adminRoute = require('../routes/adminRoute');

app.use('/api/auth', authRoute);
app.use('/api/teacher', teacherRoute);
app.use('/api/student', studentRoute);
app.use('/api/public', publicRoute);
app.use('/api/admin', adminRoute);

module.exports = app;

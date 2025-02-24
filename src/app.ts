import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { PORT } from './config/envs'
import ChatRouter from './routes'
import { errorHandler } from './middleware/errorHandler'
import { logger } from './utils/logger'
import sequelize from "./config/databse";

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info("✅ Conexión a PostgreSQL establecida con éxito.");
  } catch (error) {
    logger.error("❌ Error al conectar a PostgreSQL:", error);
  }
};

testConnection();

app.use('/api', ChatRouter)

app.use(errorHandler)

app.listen(PORT, () => {
	logger.info('Server is running on port 3000')
})

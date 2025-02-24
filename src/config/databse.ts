import { Sequelize } from "sequelize";

// Configuración de conexión a PostgreSQL en Docker
const sequelize = new Sequelize("postgres", "postgres", "mysecretpassword", {
  host: "localhost", // Si usas Docker en Linux o WSL, usa "127.0.0.1"
  port: 5432, // Puerto mapeado en docker-compose
  dialect: "postgres",
  logging: false, // Desactiva logs de SQL
});

export default sequelize;
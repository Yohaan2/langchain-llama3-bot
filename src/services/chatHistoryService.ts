import Conversation from '../models/Conversation'

// 📌 Obtener la fecha en formato YYYYMMDD
const getSessionId = () => new Date().toISOString().split("T")[0].replace(/-/g, "");

// 📌 Guardar un mensaje en la conversación
export const saveMessage = async (userId: string, role: "usuario" | "asistente", message: string) => {
  await Conversation.create({
    userId,
    sessionId: getSessionId(),
    role,
    message,
  });
};

// 📌 Recuperar historial del día de un usuario
export const getTodayHistory = async (userId: string) => {
  return await Conversation.findAll({
    where: { userId, sessionId: getSessionId() },
    order: [["createdAt", "ASC"]], // Orden cronológico
  });
};
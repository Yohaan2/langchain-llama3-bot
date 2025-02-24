import { Router } from 'express'
import { chromaChat } from '../controller/chat'
import { logger } from '../utils/logger'

const router = Router()

router.post('/v1/ai-chat', chromaChat)

export default router

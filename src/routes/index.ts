import { Router } from 'express'
import { chromaChat, updateChromaData } from '../controller/chat'
import { logger } from '../utils/logger'
import { uploadMulter } from '../utils/mutler'

const router = Router()

router.post('/v1/ai-chat', chromaChat)
router.post('/v1/ai-chat/update-data', uploadMulter.single('file'), updateChromaData)

export default router

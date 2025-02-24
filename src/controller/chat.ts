import { Request, Response } from 'express'
import { textLoader } from '../services/textLoader'

export const chromaChat = async (req: Request, res: Response) => {
	try {
		const { question } = req.body
		console.log(question)

		const answer = await textLoader(question, 'src/files/Base-legal.pdf')

		res.status(200).json({
			answer,
		})
	} catch (error) {
		res.statusCode = 500
		throw new Error((error as Error).message)
	}
}

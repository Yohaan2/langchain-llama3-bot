import { NextFunction, Request, Response } from 'express'

export const errorHandler = (
	err: Error,
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const statusCode = res.statusCode !== 200 ? res.statusCode : 500
	res.status(statusCode)

	const responseBody = {
		message: err.message,
	}
	console.error('Error: ', responseBody)
	res.json(responseBody)
}

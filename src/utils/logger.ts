import { createLogger, format, transport, transports } from 'winston'

export const logger = createLogger({
	format: format.combine(
		format.simple(),
		format.timestamp(),
		format.printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
	),
	transports: [
		new transports.File({
			maxsize: 1024 * 1024 * 10,
			maxFiles: 5,
			filename: `${__dirname}/../logs/api.log`,
		}),
		new transports.Console({
			level: 'debug',
		}),
	],
})

import 'dotenv/config'
import { textLoader } from './textLoader'

!(async function () {
	await textLoader('Que precio tienen el pan artesanal?', './food_store.pdf')
})()

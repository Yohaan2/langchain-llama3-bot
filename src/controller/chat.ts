import { Request, Response } from 'express'
import { getLoader, splitDocuments, textLoader } from '../services/textLoader'
import { getTodayHistory, saveMessage } from '../services/chatHistoryService'
import { geminiProvider, getEmbeddings } from '../providers/geminiProvider'
import { Chroma } from '@langchain/community/vectorstores/chroma'
import { CHROMA_COLLECTION_NAME, URL_CHROMA } from '../config/envs'
import {  initializeChroma } from '../services/chromaService'

export const chromaChat = async (req: Request, res: Response) => {
	try {
		const { question, userId } = req.body

		const answer = await textLoader(question,'src/files/Base-legal.pdf')


		res.status(200).json({
			answer,
		})
	} catch (error) {
		console.log(error)
		res.statusCode = 500
		res.json({ error: (error as Error).message })
	}
}

export const updateChromaData = async (req: Request, res: Response) => {
	try {
		const file = req.file
		console.log(file)
    if (!file) {
      return res.status(404).json({ message: 'Archivo no subido' })
    }

    const { embeddings } = getEmbeddings()
		const vectorStoreInstance = await Chroma.fromExistingCollection(embeddings,{
      collectionName: CHROMA_COLLECTION_NAME,
      url: URL_CHROMA,
    })

    const collection = vectorStoreInstance.collection;
    if (!collection) {
      return res.status(404).json({ message: 'No se encontró la colección' })
    }
    
    // 4. Eliminar todos los documentos existentes
    // Primero obtenemos todos los IDs
    const result = await collection.get();
    console.log('result', result);
    const ids = result.ids;
    
    // Si hay documentos, los eliminamos
    if (ids && ids.length > 0) {
      await collection.delete({
        ids: ids
      });
      console.log(`Se eliminaron ${ids.length} documentos de la colección`);
    } else {
      console.log("No hay documentos para eliminar");
    }
    const docs = await getLoader(file.path)
    const splitDocs = await splitDocuments(docs)
    console.log(splitDocs)
    await vectorStoreInstance.addDocuments(splitDocs)

		res.status(200).json({ message: "Datos actualizados con éxito" })
	} catch (error) {
		console.log(error)
		res.statusCode = 500
		res.json({ error: (error as Error).message })
	}
}
import { TextLoader } from 'langchain/document_loaders/fs/text'
import { JSONLoader } from 'langchain/document_loaders/fs/json'
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { Chroma } from '@langchain/community/vectorstores/chroma'
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { PromptTemplate } from '@langchain/core/prompts'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { Document } from 'langchain/document'
import { OpenAIEmbeddings } from '@langchain/openai'

import { CHROMA_COLLECTION_NAME, URL_CHROMA } from '../config/envs'
import { openAiProvider } from '../providers/openAiProvider'
import { geminiProvider } from '../providers/geminiProvider'
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'

export const textLoader = async (question: string, path: string) => {
	const { llm, embeddings } = geminiProvider()

	const vectorStoreChroma = await getVectorStore(path, embeddings)
	const retrievedDocs = await vectorStoreChroma.similaritySearch(question, 8 )

	const personalizedPrompt = new PromptTemplate({
		template: `Eres un asistente virtual especializado en brindar información legal basada en normativas municipales. Tu función es ayudar a los ciudadanos a entender las reglas establecidas en la normativa metropolitana y proporcionar respuestas claras y concisas basadas en el contexto disponible.  

		### **Instrucciones:**  
		1. **Analiza cuidadosamente** la información del contexto legal proporcionado.  
		2. **Responde únicamente con la información dentro del contexto.** No inventes ni asumas información que no esté explícita en el documento.  
		3. **Si la pregunta está parcialmente en el contexto, proporciona la parte relevante** y especifica lo que no está detallado.  
		4. **Si la información no está en el contexto, responde de manera amigable:** "Lo siento, no tengo información específica sobre ese tema en la normativa disponible. Te recomiendo consultar con las autoridades municipales."  
		5. **Sé claro y directo** en tu respuesta. Usa ejemplos si es necesario para facilitar la comprensión.  
		6. **Si la pregunta se refiere a un artículo específico, menciona la materia, número de artículo, la infracción y la multa asociada.**  

		---

		### **Ejemplo de respuesta esperada:**  
		**Pregunta:** *¿Cuál es la multa por depositar escombros en el espacio público?*  
		**Respuesta:** Según el **Artículo 3393**, ocupar el espacio público con materiales de construcción y escombros es una **contravención de segunda clase** y se sanciona con una multa de **0.5 RBUM** de acuerdo con la **Ordenanza Metropolitana Nro.072-2024**.  

		**Pregunta:** *¿Puedo cerrar una vía sin permiso?*  
		**Respuesta:** No. Según el **Artículo 4177**, el cierre de vías sin autorización está prohibido, excepto en casos de emergencia o actividades de interés público autorizadas. Además, el **Artículo 4198** establece que esta infracción es **grave** y se sanciona con una multa de **5 RBUM**, duplicándose en caso de reincidencia.  

		**Pregunta:** *¿Cuál es la sanción por pintar postes en la vía pública?*  
		**Respuesta:** Según el **Artículo 3942**, está prohibido colocar afiches o elementos publicitarios en los postes. El **Artículo 4002** indica que quienes incumplan esta norma cometen una **infracción grave** y recibirán una **multa de 2 RBUM**.  

		---

		**Contexto legal disponible:**  
		{context}  

		**Pregunta específica del usuario:** {question}  

		**Proceso de respuesta:**  
		1. Identifica si la pregunta tiene información relevante en el contexto.  
		2. Extrae el artículo, literal y sanción correspondiente.  
		3. Formula una respuesta clara y concisa con los detalles del caso.  

		Si la información no está en el contexto, responde con cortesía indicando que no hay datos disponibles y sugiere acudir a las autoridades municipales.`,
		inputVariables: ['question', 'context'],
	})

	const chain = await createStuffDocumentsChain({
		llm,
		prompt: personalizedPrompt,
		outputParser: new StringOutputParser(),
	})

	const result = await chain.invoke({ question, context: retrievedDocs, retrievedDocs })
	return result
}

const getLoader = async (filePath: string) => {
	const fileType = filePath.split('.').pop()
	const loader = loaders[fileType as keyof typeof loaders]

	return await loader(filePath).load()
}

const loaders = {
	txt: (filePath: string) => new TextLoader(filePath),
	json: (filePath: string) => new JSONLoader(filePath),
	pdf: (filePath: string) => new PDFLoader(filePath),
}

let vectorStoreInstance: Chroma | null = null

const getVectorStore = async (path: string, embeddings: GoogleGenerativeAIEmbeddings) => {
	if (vectorStoreInstance) return vectorStoreInstance;

	vectorStoreInstance = new Chroma(embeddings, {
		collectionName: CHROMA_COLLECTION_NAME,
		url: URL_CHROMA,
		collectionMetadata: {
			'hnsw:space': 'cosine',
		},
	})

	const docs = await getLoader(path)
	const splitDocs = await splitDocuments(docs)
	await vectorStoreInstance.addDocuments(splitDocs)
	console.log('Documents added to Chroma')

	return vectorStoreInstance
}

const splitDocuments = async (docs: Document<Record<string, any>>[]) => {
	const textSplitter = new RecursiveCharacterTextSplitter({
		chunkSize: 1000,
		chunkOverlap: 100,
		separators: ['\n\n', '\n', ' '],
	})
	const splitDocs = await textSplitter.splitDocuments(docs);

    // Procesar cada fragmento buscando artículos
    // const structuredDocs = docs.map(doc => {
    //   const text = doc.pageContent;
    //   // Buscar la materia
		// 	const materiaMatch = text.match(/Materia:\s*([^\n]+)/i);
		// 	const materia = materiaMatch ? materiaMatch[1].trim() : "";
			
		// 	// Buscar el número de artículo
		// 	const articleMatch = text.match(/Numero de articulo:?\s*(\d+)/i);
		// 	const articleNumber = articleMatch ? articleMatch[1] : "";
			
		// 	// Solo crear documento si se encontró al menos un artículo
		// 	if (articleNumber) {
		// 		return new Document({
		// 			metadata: {
		// 				article_number: articleNumber,
		// 				materia: materia,
		// 			},
		// 			pageContent: text,
		// 		});
		// 	}

    //     return null;
    // }).filter(doc => doc !== null);
		// console.log(splitDocs)

	return splitDocs
}

import { TextLoader } from 'langchain/document_loaders/fs/text'
import { JSONLoader } from 'langchain/document_loaders/fs/json'
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { Chroma } from '@langchain/community/vectorstores/chroma'
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { PromptTemplate } from '@langchain/core/prompts'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { Document } from 'langchain/document'

import { CHROMA_COLLECTION_NAME, URL_CHROMA } from '../config/envs'
import { geminiProvider } from '../providers/geminiProvider'
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import { performSimilaritySearch } from './chromaService'

export const textLoader = async (question: string, path: string) => {
	const { llm } = geminiProvider()

	const retrievedDocs = await performSimilaritySearch(question, path)

	const personalizedPrompt = new PromptTemplate({
    template: `Eres un asistente virtual especializado en normativa municipal.
		### **Instrucciones:**  
		1. **Analiza cuidadosamente** la información del contexto legal proporcionado.  
		2. **Responde únicamente con la información dentro del contexto.** No inventes ni asumas información que no esté explícita en el documento.  
		3. **Si la pregunta está parcialmente en el contexto, proporciona la parte relevante** y especifica lo que no está detallado.  
		4. **Si la información no está en el contexto o no esta en el historial de la conversacion, responde de manera amigable:** "Lo siento, no tengo información específica sobre ese tema en la normativa disponible. Te recomiendo consultar con las autoridades municipales."  
		5. **Sé claro y directo** en tu respuesta. Usa ejemplos si es necesario para facilitar la comprensión.  
		6. **Si la pregunta se refiere a un artículo específico, menciona la materia, número de artículo, la infracción y la multa asociada.** 

    ### **Contexto relevante:**  
    {context}

    ### **Pregunta del usuario:**  
    {question}

    ### **Proceso de respuesta:
	  1. Primero, identifica si la información solicitada está en el contexto
	  2. Luego, extrae la información relevante
	  3. Finalmente, formula una respuesta clara y directa
		4. Responde de manera amable y respetuosa si es que no sabes la respuesta a la pregunta

    **Respuesta:**`,
    inputVariables: ["context", "question"],
  });

	const chain = await createStuffDocumentsChain({
		llm,
		prompt: personalizedPrompt,
		outputParser: new StringOutputParser(),
	})

	const result = await chain.invoke({ question, context: retrievedDocs })
	return result
}

export const getLoader = async (filePath: string) => {
	const fileType = filePath.split('.').pop()
	const loader = loaders[fileType as keyof typeof loaders]

	return await loader(filePath).load()
}

const loaders = {
	txt: (filePath: string) => new TextLoader(filePath),
	json: (filePath: string) => new JSONLoader(filePath),
	pdf: (filePath: string) => new PDFLoader(filePath),
}

export const splitDocuments = async (docs: Document<Record<string, any>>[]) => {
	const textSplitter = new RecursiveCharacterTextSplitter({
		chunkSize: 1000,
		chunkOverlap: 100,
		separators: ['\n\n', '\n', ' '],
	})
	const splitDocs = await textSplitter.splitDocuments(docs);

	return splitDocs
}

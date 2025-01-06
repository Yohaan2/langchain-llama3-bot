import { TextLoader } from 'langchain/document_loaders/fs/text'
import { JSONLoader } from 'langchain/document_loaders/fs/json'
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { Ollama } from '@langchain/community/llms/ollama'
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama'
import { Chroma } from '@langchain/community/vectorstores/chroma'
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { PromptTemplate } from '@langchain/core/prompts'

const loaders = {
	txt: (filePath: string) => new TextLoader(filePath),
	json: (filePath: string) => new JSONLoader(filePath),
	pdf: (filePath: string) => new PDFLoader(filePath),
}

const getLoader = async (filePath: string) => {
	const fileType = filePath.split('.').pop()
	const loader = loaders[fileType as keyof typeof loaders]

	return await loader(filePath).load()
}

const ollamaBaseUrl = 'http://localhost:11434'
const ollamaModel = 'llama3'

export const textLoader = async (question: string, path: string) => {
	const llm = new Ollama({
		baseUrl: ollamaBaseUrl,
		model: ollamaModel,
	})

	const embeddings = new OllamaEmbeddings({
		baseUrl: ollamaBaseUrl,
		model: ollamaModel,
	})

	const vectorStoreChroma = new Chroma(embeddings, {
		collectionName: 'a-test-collection',
		url: 'http://localhost:8000',
		collectionMetadata: {
			'hnsw:space': 'cosine',
		},
	})

	const docs = await getLoader(path)
	await vectorStoreChroma.addDocuments(docs)
	const retrievedDocs = await vectorStoreChroma.similaritySearch(question)
	//console.log(docs.map((doc) => doc.pageContent))

	const personalizedPrompt =
		PromptTemplate.fromTemplate(`Eres un asistente para tareas de respuesta a preguntas. Usa los siguientes fragmentos de contexto recuperados para responder la pregunta. Si no sabes la respuesta, simplemente di que no la sabes
  Pregunta: {question}
  Contexto: {context}
  Respuesta:`)
	// to convert the model output to standardized string
	const chain = await createStuffDocumentsChain({
		llm,
		prompt: personalizedPrompt,
		outputParser: new StringOutputParser(),
	})

	// pass the question and the relevant docs to the LLM
	const result = await chain.invoke({ question, context: retrievedDocs })
	console.log(result)
}

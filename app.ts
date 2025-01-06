import 'dotenv/config'
import { Ollama } from '@langchain/community/llms/ollama'
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents'
import { pull } from 'langchain/hub'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { readFileSync } from 'node:fs'
import { Chroma } from '@langchain/community/vectorstores/chroma'

const ollamaBaseUrl = 'http://localhost:11434'
const ollamaModel = 'llama3'

const llm = new Ollama({
	baseUrl: ollamaBaseUrl,
	model: ollamaModel,
})

const embeddings = new OllamaEmbeddings({
	baseUrl: ollamaBaseUrl,
	model: ollamaModel,
})

const vectorStore = new MemoryVectorStore(embeddings)

const vectorStoreChroma = new Chroma(embeddings, {
	collectionName: 'a-test-collection',
	url: 'http://localhost:8000',
	collectionMetadata: {
		'hnsw:space': 'cosine',
	},
})

!(async function () {
	// read the file and then split it into chunks & then create documents of it
	const file = readFileSync('./food_store.txt', 'utf-8')
	const splitter = new RecursiveCharacterTextSplitter({
		chunkSize: 1000,
		separators: ['.', '?', '!', '\n\n'],
	})
	const docs = await splitter.createDocuments([file])
	console.log(docs)

	// add documents to the vector store (that's where embeddings are created)
	await vectorStore.addDocuments(docs)
	await vectorStoreChroma.addDocuments(docs)

	// get the retriever object from the vector store

	const question = 'Me puedes decir cual es la suma de unas manzanas y un platano?'
	const retrievedDocs = vectorStore.similaritySearch(question)

	// pull the rag prompt from langsmith
	const prompt = (await pull('rlm/rag-prompt')) as any

	// initiate the rag chain with our LLM, prompt and outputparser
	// to convert the model output to standardized string
	const ragChain = await createStuffDocumentsChain({
		llm,
		prompt,
		outputParser: new StringOutputParser(),
	})

	// pass the question and the relevant docs to the LLM
	const result = await ragChain.invoke({ question, context: retrievedDocs })
	console.log(result) // Optimus will cost around $20-$30K, which is less than a car.
})()

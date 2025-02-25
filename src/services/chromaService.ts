import { Chroma } from '@langchain/community/vectorstores/chroma'
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import { Document } from 'langchain/document'
import { CHROMA_COLLECTION_NAME, URL_CHROMA } from '../config/envs'
import { getLoader, splitDocuments } from './textLoader'
import { geminiProvider, getEmbeddings } from '../providers/geminiProvider'

let vectorStoreInstance: Chroma | null = null

/**
 * Inicializa o recupera la instancia de ChromaDB
 * Si la colección ya existe y tiene documentos, la usa
 * Si no existe o está vacía, carga el PDF por defecto
 */
export const initializeChroma = async (
  embeddings: GoogleGenerativeAIEmbeddings,
  defaultPdfPath: string
): Promise<Chroma> => {
  // Si ya tenemos una instancia, la retornamos
  if (vectorStoreInstance) {
    return vectorStoreInstance
  }

  try {
    // Intentar recuperar la colección existente
    const existingStore = await Chroma.fromExistingCollection(embeddings, {
      collectionName: CHROMA_COLLECTION_NAME,
      url: URL_CHROMA,
      collectionMetadata: {
        'hnsw:space': 'cosine',
      },
    })

    // Verificar si la colección tiene documentos
    const collection = await existingStore.collection
    const result = await collection.get()
    
    // Si hay documentos, usar la colección existente
    if (result.ids && result.ids.length > 0) {
      console.log(`Usando colección existente con ${result.ids.length} documentos`)
      vectorStoreInstance = existingStore
      return vectorStoreInstance
    }
    
    // Si no hay documentos, cargar el PDF por defecto
    console.log('Colección vacía o no existente, cargando PDF por defecto')
    const docs = await getLoader(defaultPdfPath)
    const splitDocs = await splitDocuments(docs)
    await existingStore.addDocuments(splitDocs)
    console.log(`Documentos del PDF por defecto añadidos a Chroma (${splitDocs.length} fragmentos)`)
    
    vectorStoreInstance = existingStore
    return vectorStoreInstance
  } catch (error) {
    // Si hay un error (como que la colección no existe), crear una nueva
    console.log('Error al recuperar colección, creando nueva instancia:', error)
    
    const newVectorStore = new Chroma(embeddings, {
      collectionName: CHROMA_COLLECTION_NAME,
      url: URL_CHROMA,
      collectionMetadata: {
        'hnsw:space': 'cosine',
      },
    })
    
    // Cargar el PDF por defecto
    const docs = await getLoader(defaultPdfPath)
    const splitDocs = await splitDocuments(docs)
    await newVectorStore.addDocuments(splitDocs)
    console.log(`Documentos del PDF por defecto añadidos a Chroma (${splitDocs.length} fragmentos)`)
    
    vectorStoreInstance = newVectorStore
    return vectorStoreInstance
  }
}

export const performSimilaritySearch = async (
  question: string, 
  defaultPdfPath: string
): Promise<Document[]> => {
  const { embeddings } = getEmbeddings()
  
  // Asegurar que tenemos una instancia de ChromaDB
  if (!vectorStoreInstance) {
    await initializeChroma(embeddings, defaultPdfPath)
  }
  
  // Realizar la búsqueda
  const retrievedDocs = await vectorStoreInstance!.similaritySearch(question, 8)
  return retrievedDocs
}

// const chain = new ConversationChain({
//   llm,
//   memory: memory,
// });

// // Función para interactuar con la memoria
// export const chatWithMemory = async (inputText: string) => {
//   const response = await chain.call({ input: inputText });
  
//   // Guardar en ChromaDB
//   await vectorStoreInstance!.addDocuments([
//     { pageContent: inputText, metadata: { role: "user" } },
//     { pageContent: response.response, metadata: { role: "assistant" } },
//   ]);

//   console.log("Respuesta del bot:", response.response);
// }
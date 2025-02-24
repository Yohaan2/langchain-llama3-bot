import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai'
import { OPENAI_API_KEY } from '../config/envs'

export const openAiProvider = () => {
	const llm = new ChatOpenAI({
		openAIApiKey: OPENAI_API_KEY,
		maxTokens: 200,
		temperature: 0.3,
		topP: 0.7,
	})
	const embeddings = new OpenAIEmbeddings({
		openAIApiKey: OPENAI_API_KEY,
	})

	return { llm, embeddings }
}

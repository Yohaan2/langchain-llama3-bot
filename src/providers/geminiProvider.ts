import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai'
import { GEMINI_API_KEY } from '../config/envs'

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";


export const geminiProvider = () => {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004", // 768 dimensions
    taskType: TaskType.RETRIEVAL_DOCUMENT,
    title: "Document title",
    apiKey: GEMINI_API_KEY
  });
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    maxOutputTokens: 2048,
    apiKey: GEMINI_API_KEY,
  });
  
  return { llm, embeddings }
}

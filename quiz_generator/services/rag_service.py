import os
import chromadb
from chromadb.utils import embedding_functions
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Initialize ChromaDB client persistent
CHROMA_DB_PATH = os.path.join(os.getcwd(), "chroma_db")

class RAGService:
    def __init__(self):
        self.embedding_fn = OpenAIEmbeddings(
            api_key=os.getenv("OPENAI_API_KEY")
        )
        # We can use LangChain's Chroma wrapper or native Chroma
        # Using native for simpler control over collections, or LangChain wrapper for ease.
        # Let's use LangChain wrapper for compatibility with retrieving
        self.vector_store = Chroma(
            collection_name="quiz_materials",
            embedding_function=self.embedding_fn,
            persist_directory=CHROMA_DB_PATH
        )
        self.text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

    def ingest_material(self, topic: str, content: str):
        """
        Ingest text content for a specific topic into the vector store.
        """
        # Split text
        chunks = self.text_splitter.create_documents([content], metadatas=[{"topic": topic}])
        
        # Add to vector store
        self.vector_store.add_documents(chunks)
        print(f"Ingested {len(chunks)} chunks for topic: {topic}")

    def get_context(self, topic: str, k: int = 3) -> str:
        """
        Retrieve relevant context for a topic. 
        Since we want to generate questions ABOUT a topic, we verify if we have materials.
        If we have materials, we retrieve chunks.
        Actually, for question generation, we might just want to grab random chunks or specific ones.
        
        If we want to generate a question, we might query with "facts about {topic}".
        """
        # Retrieve documents filtered by topic
        # LangChain Chroma filter syntax might vary, let's try direct filter
        # self.vector_store.as_retriever(search_kwargs={'filter': {'topic': topic}})
        
        results = self.vector_store.similarity_search(
            query=f"important concepts about {topic}",
            k=k,
            filter={"topic": topic}
        )
        
        context = "\n\n".join([doc.page_content for doc in results])
        return context

# Singleton instance
rag_service = RAGService()

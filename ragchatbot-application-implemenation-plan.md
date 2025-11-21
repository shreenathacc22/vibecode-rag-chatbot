## Plan: Extend to RAG-Based Chatbot

Transform the current simple chatbot into a Retrieval-Augmented Generation (RAG) chatbot, inspired by the HuggingFace Python implementation, while maintaining the Node.js/Express/Socket.io architecture. Update the technical specification to reflect these changes.

### Steps
1. Review the HuggingFace RAG-Llama Python code for core RAG logic, data flow, and API structure.
2. Identify RAG components: document retrieval, embedding, context construction, and LLM response generation.
3. Design Node.js equivalents for RAG pipeline (retriever, embedder, LLM API integration).
4. Update backend (`server.js`) to support RAG workflow: user query → retrieve relevant docs → augment prompt → generate response.
5. Modify frontend (`index.html`) if needed to support new features (e.g., source display, context info).
6. Revise `customer-service-chatbot-technical-spec.md` to describe the new RAG architecture, workflow, and requirements.

### Further Considerations
1. Choose retrieval backend: local files, vector DB, or external API?
2. Select embedding and LLM providers compatible with Node.js (e.g., HuggingFace Inference API, OpenAI, Gemini).
3. Ensure demo remains simple and local, or document any new dependencies.
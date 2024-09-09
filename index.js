const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdfParse = require('pdf-parse');
const fs = require('fs').promises;
const { Pinecone } = require("@pinecone-database/pinecone");
const { v4: uuidv4 } = require('uuid');


const pineconeApiKey = "3b491431-b5e5-4ed6-9588-ed7a70677ec7";
const pinecone = new Pinecone({ apiKey: pineconeApiKey });

const genAI = new GoogleGenerativeAI('AIzaSyCp4IeoH9GupO474BzoNx77B7WZptTaU9s');
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

const folderPath = './source';

async function extractText(filePath) {
    const dataBuffer = await fs.readFile(filePath);
    console.log(dataBuffer);
    const { text } = await pdfParse(dataBuffer);
    console.log('extracted text from file')
    console.log(text);
    return text;
}


async function generateEmbeddingsAndStore(text, fileName) {
    const embeddingResponse = await model.embedContent(text);
    const embedding = embeddingResponse.embedding; 
    console.log(`embedding for the ${fileName}`);
    console.log(embedding.values)
    const index = pinecone.index("new-gemini-index"); 

    const newEmbeddings = embedding.values.map((embedding) => ({
        id: uuidv4(),
        values: embedding,
      }));

    try {
        const response = await index.upsert(newEmbeddings);
        console.log('Embeddings upserted successfully:', response);
    } catch (error) {
        console.error('Error upserting embeddings:', error);
    }

    console.log('upserted successfully');
}


async function processFiles() {
    const files = await fs.readdir(folderPath);

    for (const file of files) {
        const filePath = `${folderPath}/${file}`;
        console.log(filePath);
        const text = await extractText(filePath);
        console.log(text);
        await generateEmbeddingsAndStore(text, file);
    }
}


processFiles().catch(err => console.error(err));

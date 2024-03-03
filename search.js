import { readFile } from 'node:fs/promises';
import readline from 'node:readline';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';

const products = JSON.parse(await readFile('./db.json', 'utf8'));

function createStore(products) {
  const embeddings = new OpenAIEmbeddings();

  return MemoryVectorStore.fromDocuments(
    products.map(product => {
      return new Document({
        pageContent: `Title: ${product.title} Description: ${product.description} Price: ${product.price}`,
        metadata: { id: product.id },
      });
    }),
    embeddings
  );
}

const store = await createStore(products);

async function searchProducts(query, count) {
  const results = await store.similaritySearch(query, count);

  return results.map(result =>
    products.find(product => product.id === result.metadata.id)
  );
}

async function searchLoop() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = query =>
    new Promise(resolve => rl.question(query, resolve));

  while (true) {
    const query = await askQuestion('Enter query (or type "exit" to quit): ');

    if (query === 'exit') break;

    const products = await searchProducts(query, 3);

    if (products.length === 0) {
      console.log('No products found for your query.');
    } else {
      products.forEach((product, index) =>
        console.log(
          `${index + 1}. ${product.title}: ${product.description}: ${
            product.price
          }`
        )
      );
    }
  }

  rl.close();
}

await searchLoop();

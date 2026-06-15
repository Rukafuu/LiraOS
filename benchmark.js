
const mockProcessFile = async (file) => {
  // Simulate file processing delay (e.g., reading, resizing, etc.)
  await new Promise(resolve => setTimeout(resolve, 100));
  return { success: true, name: file.name };
};

const sequentialProcess = async (files) => {
  const results = [];
  for (const file of files) {
    const result = await mockProcessFile(file);
    results.push(result);
  }
  return results;
};

const parallelProcess = async (files) => {
  return await Promise.all(files.map(file => mockProcessFile(file)));
};

const runBenchmark = async () => {
  const dummyFiles = Array.from({ length: 10 }, (_, i) => ({ name: `file${i}.png` }));

  console.log(`🚀 Starting benchmark with ${dummyFiles.length} files...`);

  // Sequential
  const startSeq = Date.now();
  await sequentialProcess(dummyFiles);
  const endSeq = Date.now();
  const seqTime = endSeq - startSeq;
  console.log(`⏱️ Sequential processing: ${seqTime}ms`);

  // Parallel
  const startPar = Date.now();
  await parallelProcess(dummyFiles);
  const endPar = Date.now();
  const parTime = endPar - startPar;
  console.log(`⏱️ Parallel processing: ${parTime}ms`);

  const improvement = ((seqTime - parTime) / seqTime * 100).toFixed(2);
  console.log(`✅ Improvement: ${improvement}% faster`);
};

runBenchmark();

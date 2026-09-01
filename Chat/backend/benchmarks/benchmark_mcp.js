
// Mocking MCPService for benchmarking
class MockMCPService {
    constructor() {
        this.servers = new Map();
        this.tools = [];
    }

    _refreshToolListOriginal() {
        const allTools = [];
        for (const server of this.servers.values()) {
            allTools.push(...server.tools.map(t => ({
                ...t,
                _server: server.name // internal tracking
            })));
        }
        this.tools = allTools;
    }

    _refreshToolListOptimized() {
        this.tools = Array.from(this.servers.values()).flatMap(server =>
            server.tools.map(t => ({
                ...t,
                _server: server.name
            }))
        );
    }

    _refreshToolListFaster() {
        const allTools = [];
        for (const server of this.servers.values()) {
            const serverName = server.name;
            const tools = server.tools;
            for (let i = 0; i < tools.length; i++) {
                const t = tools[i];
                allTools.push({
                    ...t,
                    _server: serverName
                });
            }
        }
        this.tools = allTools;
    }
}

const service = new MockMCPService();

// Populate with dummy data
const NUM_SERVERS = 100;
const TOOLS_PER_SERVER = 50;

for (let i = 0; i < NUM_SERVERS; i++) {
    const serverName = `server_${i}`;
    const tools = [];
    for (let j = 0; j < TOOLS_PER_SERVER; j++) {
        tools.push({
            name: `tool_${i}_${j}`,
            description: `Description for tool ${j} on server ${i}`,
            inputSchema: { type: 'object', properties: {} }
        });
    }
    service.servers.set(serverName, { name: serverName, tools });
}

console.log(`Benchmarking with ${NUM_SERVERS} servers and ${TOOLS_PER_SERVER} tools per server (Total: ${NUM_SERVERS * TOOLS_PER_SERVER} tools)`);

const ITERATIONS = 2000;
const WARMUP = 500;

// Warmup
for (let i = 0; i < WARMUP; i++) {
    service._refreshToolListOriginal();
    service._refreshToolListOptimized();
    service._refreshToolListFaster();
}

function runBench(name, fn) {
    let total = 0;
    for (let i = 0; i < ITERATIONS; i++) {
        let start = performance.now();
        fn();
        total += (performance.now() - start);
    }
    console.log(`${name}: ${total.toFixed(4)}ms (average: ${(total / ITERATIONS).toFixed(4)}ms per call)`);
    return total;
}

const originalTime = runBench('Original', () => service._refreshToolListOriginal());
const optimizedTime = runBench('Optimized (flatMap)', () => service._refreshToolListOptimized());
const fasterTime = runBench('Faster (nested loops)', () => service._refreshToolListFaster());

console.log(`Improvement (flatMap): ${((originalTime - optimizedTime) / originalTime * 100).toFixed(2)}%`);
console.log(`Improvement (nested loops): ${((originalTime - fasterTime) / originalTime * 100).toFixed(2)}%`);

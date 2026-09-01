
import { mcpService } from './services/mcpService.js';
import assert from 'assert';

async function verify() {
    console.log('Verifying MCPService._refreshToolList correctness...');

    const server1 = {
        name: 'server1',
        tools: [
            { name: 'tool1', description: 'desc1' },
            { name: 'tool2', description: 'desc2' }
        ]
    };

    const server2 = {
        name: 'server2',
        tools: [
            { name: 'tool3', description: 'desc3' }
        ]
    };

    mcpService.servers.set('server1', server1);
    mcpService.servers.set('server2', server2);

    // Trigger refresh
    mcpService._refreshToolList();

    console.log(`Total tools found: ${mcpService.tools.length}`);

    assert.strictEqual(mcpService.tools.length, 3, 'Should have 3 tools');

    const tool1 = mcpService.tools.find(t => t.name === 'tool1');
    assert.ok(tool1, 'tool1 should exist');
    assert.strictEqual(tool1._server, 'server1', 'tool1 should belong to server1');

    const tool3 = mcpService.tools.find(t => t.name === 'tool3');
    assert.ok(tool3, 'tool3 should exist');
    assert.strictEqual(tool3._server, 'server2', 'tool3 should belong to server2');

    console.log('✅ Correctness verified!');
}

verify().catch(err => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
});

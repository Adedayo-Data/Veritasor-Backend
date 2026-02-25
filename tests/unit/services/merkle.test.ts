import assert from 'assert';
import MerkleTree from '../../../src/services/merkle';

function hex(s: string) {
  return s;
}

(function run() {
  // sample leaves
  const leaves = ['a', 'b', 'c', 'd', 'e'];

  // Deterministic root: two constructions should match
  const t1 = new MerkleTree(leaves);
  const t2 = new MerkleTree(leaves);
  assert.strictEqual(t1.getRoot(), t2.getRoot(), 'Roots should be deterministic and equal');

  // Valid proof for a leaf
  const index = 2; // 'c'
  const proof = t1.getProof(index);
  const root = t1.getRoot();
  const ok = MerkleTree.verifyProof(leaves[index], proof, root, index);
  assert.ok(ok, 'Valid proof should verify');

  // Invalid proof should fail
  const badProof = [...proof];
  if (badProof.length > 0) {
    // corrupt the first sibling
    badProof[0] = hex(badProof[0].replace(/^[0-9a-f]/, (c) => (c === '0' ? '1' : '0')));
  }
  const bad = MerkleTree.verifyProof(leaves[index], badProof, root, index);
  assert.strictEqual(bad, false, 'Tampered proof should not verify');

  // report
  // If running with a test runner these logs are optional
  // Keep concise output for manual runs
  // eslint-disable-next-line no-console
  console.log('Merkle tests passed');
})();

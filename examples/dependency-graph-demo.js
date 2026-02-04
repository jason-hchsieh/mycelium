/**
 * Dependency Graph Demo
 * Demonstrates all 8 functions of the dependency-graph module
 */

import {
  createDependencyGraph,
  getTopologicalSort,
  hasCyclicDependency,
  getAllDependencies,
  getDependents,
  getReadyTasks,
  validateGraph,
  visualizeGraph,
} from '../lib/scheduler/dependency-graph.js';

console.log('=== Dependency Graph Module Demo ===\n');

// Example tasks with dependencies
const tasks = [
  { id: 'design', blockedBy: [], blocks: ['implement-backend', 'implement-frontend'] },
  { id: 'implement-backend', blockedBy: ['design'], blocks: ['integration-test'] },
  { id: 'implement-frontend', blockedBy: ['design'], blocks: ['integration-test'] },
  { id: 'integration-test', blockedBy: ['implement-backend', 'implement-frontend'], blocks: ['deploy'] },
  { id: 'deploy', blockedBy: ['integration-test'], blocks: [] },
];

console.log('1. Creating dependency graph...');
const graph = createDependencyGraph(tasks);
console.log(`   Created graph with ${graph.nodes.size} tasks\n`);

console.log('2. Visualizing graph:');
console.log(visualizeGraph(graph));
console.log();

console.log('3. Validating graph structure...');
const validation = validateGraph(graph);
console.log(`   Valid: ${validation.valid}`);
if (!validation.valid) {
  console.log(`   Errors: ${validation.errors.join(', ')}`);
}
console.log();

console.log('4. Checking for cycles...');
const cycleCheck = hasCyclicDependency(graph);
console.log(`   Has cycle: ${cycleCheck.hasCycle}`);
if (cycleCheck.hasCycle) {
  console.log(`   Cycle: ${cycleCheck.cycle.join(' -> ')}`);
}
console.log();

console.log('5. Getting topological sort...');
const sortedTasks = getTopologicalSort(graph);
console.log(`   Execution order: ${sortedTasks.join(' -> ')}\n`);

console.log('6. Getting all dependencies of "deploy":');
const deployDeps = getAllDependencies(graph, 'deploy');
console.log(`   Dependencies: ${deployDeps.join(', ')}\n`);

console.log('7. Getting all dependents of "design":');
const designDependents = getDependents(graph, 'design');
console.log(`   Dependents: ${designDependents.join(', ')}\n`);

console.log('8. Simulating task execution:');
const completed = new Set();
let step = 1;

while (completed.size < tasks.length) {
  const ready = getReadyTasks(graph, completed);

  if (ready.length === 0) {
    console.log('   No more tasks ready!');
    break;
  }

  console.log(`   Step ${step}: Ready tasks: ${ready.join(', ')}`);

  // Simulate completing the first ready task
  const taskToComplete = ready[0];
  completed.add(taskToComplete);
  console.log(`   Completed: ${taskToComplete}`);

  step++;
}

console.log(`\n   All ${completed.size} tasks completed!\n`);

// Demonstrate cycle detection with invalid graph
console.log('9. Testing cycle detection with invalid graph:');
const cyclicTasks = [
  { id: 'taskA', blockedBy: ['taskB'], blocks: ['taskB'] },
  { id: 'taskB', blockedBy: ['taskA'], blocks: ['taskA'] },
];

const cyclicGraph = createDependencyGraph(cyclicTasks);
const cyclicCheck = hasCyclicDependency(cyclicGraph);
console.log(`   Has cycle: ${cyclicCheck.hasCycle}`);
if (cyclicCheck.hasCycle) {
  console.log(`   Cycle path: ${cyclicCheck.cycle.join(' -> ')}`);
}

const cyclicValidation = validateGraph(cyclicGraph);
console.log(`   Valid: ${cyclicValidation.valid}`);
if (!cyclicValidation.valid) {
  console.log(`   Errors: ${cyclicValidation.errors.join(', ')}`);
}

console.log('\n=== Demo Complete ===');

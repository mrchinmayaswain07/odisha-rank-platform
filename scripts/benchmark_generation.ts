import {
  generateTrainerQuestion,
  CalculationTrainerCategory,
  CalculationTrainerDifficulty,
} from "../packages/shared/src/calc-trainer";

const categories: CalculationTrainerCategory[] = [
  "addition",
  "subtraction",
  "multiplication",
  "division",
  "percentages",
  "fractions",
  "ratios_proportions",
  "squares",
  "square_roots",
  "cubes_roots",
  "bodmas",
  "estimation_approximation",
  "missing_number",
  "reverse_calculation",
  "mixed_exam_arithmetic",
];

const difficulties: CalculationTrainerDifficulty[] = [
  "beginner",
  "intermediate",
  "advanced",
  "exam_challenge",
];

console.log("==================================================");
console.log("  CALCULATION SPEED TRAINER PERFORMANCE BENCHMARK ");
console.log("==================================================");

// 1. Raw Generation Throughput (10,000 Questions)
const SAMPLES = 10000;
const startRaw = performance.now();

for (let i = 0; i < SAMPLES; i++) {
  const cat = categories[i % categories.length];
  const diff = difficulties[i % difficulties.length];
  generateTrainerQuestion(cat, diff, i + 1);
}

const endRaw = performance.now();
const elapsedMs = endRaw - startRaw;
const avgMicros = ((elapsedMs / SAMPLES) * 1000).toFixed(2);
const qps = Math.round((SAMPLES / elapsedMs) * 1000);

console.log(`\n1. RAW GENERATION THROUGHPUT:`);
console.log(`- Total Questions Generated: ${SAMPLES.toLocaleString()}`);
console.log(`- Total Time Elapsed: ${elapsedMs.toFixed(2)} ms`);
console.log(`- Average Generation Latency: ${avgMicros} µs per question`);
console.log(`- Generation Throughput: ${qps.toLocaleString()} questions/sec`);

// 2. Generation with Deduplication Exclusions (50 active exclusions)
const DEDUP_SAMPLES = 5000;
const startDedup = performance.now();
const seen = new Set<string>();

for (let i = 0; i < DEDUP_SAMPLES; i++) {
  const cat = categories[i % categories.length];
  const diff = difficulties[i % difficulties.length];
  const q = generateTrainerQuestion(cat, diff, i + 1, { excludePrompts: seen });
  seen.add(q.prompt);
  if (seen.size > 50) {
    const first = seen.values().next().value;
    if (first) seen.delete(first);
  }
}

const endDedup = performance.now();
const elapsedDedupMs = endDedup - startDedup;
const avgDedupMicros = ((elapsedDedupMs / DEDUP_SAMPLES) * 1000).toFixed(2);
const dedupQps = Math.round((DEDUP_SAMPLES / elapsedDedupMs) * 1000);

console.log(`\n2. GENERATION WITH ACTIVE DEDUPLICATION (50 exclusions):`);
console.log(`- Total Questions Generated: ${DEDUP_SAMPLES.toLocaleString()}`);
console.log(`- Total Time Elapsed: ${elapsedDedupMs.toFixed(2)} ms`);
console.log(`- Average Latency under Deduplication: ${avgDedupMicros} µs per question`);
console.log(`- Throughput under Deduplication: ${dedupQps.toLocaleString()} questions/sec`);

// Assert latency < 1.0 ms (1000 µs)
if (Number(avgMicros) > 1000 || Number(avgDedupMicros) > 1000) {
  console.error("FAIL: Generation latency exceeded 1ms target!");
  process.exit(1);
} else {
  console.log(`\nPERFORMANCE TARGET (< 1ms per question): PASSED (Only ${avgMicros} µs per question!)`);
}

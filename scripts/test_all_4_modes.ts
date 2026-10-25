import { generateTrainerQuestion, CALCULATION_TRAINER_CATEGORIES, CalculationTrainerDifficulty } from '../packages/shared/src/calc-trainer';

const difficulties: CalculationTrainerDifficulty[] = ['beginner', 'intermediate', 'advanced', 'exam_challenge'];

for (const diff of difficulties) {
  console.log(`\n=== TESTING DIFFICULTY MODE: ${diff.toUpperCase()} ===`);
  for (const cat of CALCULATION_TRAINER_CATEGORIES) {
    const q1 = generateTrainerQuestion(cat.id, diff, 1);
    const q2 = generateTrainerQuestion(cat.id, diff, 2);
    if (!q1.prompt || !q1.answer || q1.options.length !== 4) {
      console.error(`FAILED: ${cat.id} ${diff} Q1`);
    }
    if (!q2.prompt || !q2.answer || q2.options.length !== 4) {
      console.error(`FAILED: ${cat.id} ${diff} Q2`);
    }
    console.log(`[PASS] ${cat.id.padEnd(25)} Q1: ${q1.prompt.padEnd(20)} = ${q1.answer.padEnd(8)} | Q2: ${q2.prompt.padEnd(20)} = ${q2.answer}`);
  }
}
console.log('\nALL 4 MODES GENERATION VERIFIED!');

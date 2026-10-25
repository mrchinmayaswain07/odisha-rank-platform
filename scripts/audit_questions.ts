import { generateTrainerQuestion, CalculationTrainerCategory, CalculationTrainerDifficulty } from "../packages/shared/src/calc-trainer";

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

const bugCounts: Record<string, number> = {};
const categoryBugs: Record<string, any[]> = {};

for (const cat of categories) {
  categoryBugs[cat] = [];
  for (const diff of difficulties) {
    for (let i = 0; i < 300; i++) {
      const q = generateTrainerQuestion(cat, diff, i + 1);
      
      const unique = new Set(q.options);
      if (unique.size !== 4) {
        const issue = `Duplicate options: [${q.options.join(", ")}] for answer '${q.answer}'`;
        bugCounts[issue] = (bugCounts[issue] || 0) + 1;
        categoryBugs[cat].push({ diff, prompt: q.prompt, issue, options: q.options, answer: q.answer });
      }

      if (!unique.has(q.answer)) {
        const issue = `Answer '${q.answer}' missing from options: [${q.options.join(", ")}]`;
        bugCounts[issue] = (bugCounts[issue] || 0) + 1;
        categoryBugs[cat].push({ diff, prompt: q.prompt, issue, options: q.options, answer: q.answer });
      }

      for (const opt of q.options) {
        if (opt.includes("NaN") || opt.includes("undefined") || opt.includes("Infinity")) {
          const issue = `Malformed opt: ${opt}`;
          bugCounts[issue] = (bugCounts[issue] || 0) + 1;
          categoryBugs[cat].push({ diff, prompt: q.prompt, issue, options: q.options, answer: q.answer });
        }
        if (opt.includes(".") && (cat === "ratios_proportions" || cat === "fractions")) {
          const issue = `Decimal in fraction/ratio opt: ${opt}`;
          bugCounts[issue] = (bugCounts[issue] || 0) + 1;
          categoryBugs[cat].push({ diff, prompt: q.prompt, issue, options: q.options, answer: q.answer });
        }
      }
    }
  }
}

for (const cat of categories) {
  if (categoryBugs[cat].length > 0) {
    console.log(`\n=== Category [${cat}]: ${categoryBugs[cat].length} issues ===`);
    console.log(JSON.stringify(categoryBugs[cat].slice(0, 3), null, 2));
  } else {
    console.log(`Category [${cat}]: 0 issues PASS`);
  }
}

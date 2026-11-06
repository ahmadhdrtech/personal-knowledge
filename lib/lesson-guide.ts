// How Claude (through MCP) runs a "Teach me" lesson in Neuron. Sent by neuron_lesson_start.

export const TEACH_STEPS = [
  "1. PROBE (3-5 questions, one at a time). Ask about the ideas the goal depends on, starting from what the map already shows as solid. Mix: one 'explain in your own words', one prediction ('what happens if…'), one multiple choice. Ask how sure they are (guess / fair / sure). Classify each answer: knows, partly, gap, or misconception. Don't teach yet.",
  "2. PLAN. Build 3-8 steps from the gaps to the goal, in dependency order (prerequisites first). Use existing concept ids where they fit, so results update the learner's mastery; a step can also be a new idea (concept: null). Skip what they clearly know. Call neuron_lesson_plan with start_summary (2-3 sentences: what they already understand, what is missing, any misconception), the probe results and the steps. Show the plan briefly and start.",
  "3. TEACH one step at a time:",
  "   a. PREDICT: ask one short question that makes them guess before you explain.",
  "   b. EXPLAIN in small pieces, from the learner's level and interests. Use the clearest representation for the idea: a ```mermaid flowchart for processes, causes and decisions; LaTeX ($…$ inline, $$…$$ block) for any formula, with every symbol explained in words; a table for comparisons; a ```svg figure for shapes, graphs or geometry; one worked example with real numbers. Fix any misconception from the probe explicitly: say what they thought, why it's tempting, and why it's wrong.",
  "   c. CHECK with one question (multiple choice with 4 options, or open). Ask how sure they are. Grade honestly; if wrong, give the smallest hint first and let them try again before explaining.",
  "   d. SAVE with neuron_lesson_step: the predict question and their prediction, the explanation exactly as you showed it (Markdown with the diagrams and math), the check, and the result. Saving the result also updates mastery and the review schedule for that concept, so don't call neuron_record_result for the same answer.",
  "4. Keep the pace: one step per message pair, no walls of text. Every 2-3 steps, ask them to explain the chain so far in one or two sentences.",
  "5. FINISH with neuron_lesson_finish: a short summary of what they now understand, what is still shaky, and 1-3 next steps (review, practice, or a blog post). Offer to save new ideas to the map with neuron_add_source and any definitions they gave with neuron_set_definition.",
];

export const FORMAT_GUIDE = {
  markdown: "Headings (##), short paragraphs, lists, tables, **bold** for the key idea. No HTML.",
  math: "Inline $E = mc^2$ or \\(…\\); block $$A = P\\left(1+\\frac{r}{n}\\right)^{nt}$$ on its own line. KaTeX syntax. After a formula, explain each symbol in words.",
  flowchart: "```mermaid\nflowchart LR\n  A[Input] --> B{Decision?}\n  B -- yes --> C[Result]\n  B -- no --> D[Other result]\n```\nAlso available: sequenceDiagram, stateDiagram-v2, mindmap, timeline, pie, xychart-beta. Keep labels short; quote labels that contain punctuation: A[\"f(x) = 2x\"].",
  figure: "```svg\n<svg viewBox=\"0 0 320 160\" xmlns=\"http://www.w3.org/2000/svg\">…</svg>\n```\nA simple hand-made figure (axes, curves, labeled shapes). It is shown as an image; scripts and external files don't load. Use currentColor-free explicit colors that read on light and dark (e.g. #2f6fde, #e0a020, #888).",
  images: "![alt text](https://…) only for real, freely licensed images you are confident exist (e.g. upload.wikimedia.org). Prefer mermaid or svg you draw yourself.",
  length: "One step's explanation: 120-350 words plus at most two visuals.",
};

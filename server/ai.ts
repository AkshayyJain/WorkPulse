import { GoogleGenAI } from '@google/genai';
import { config } from './config.js';
import { AISummaryData, WorkUpdate, WeeklyReportAnswers } from './db.js';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!config.geminiApiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: config.geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface GenerateSummaryInput {
  employeeName: string;
  reportingPeriod: string;
  workUpdates: WorkUpdate[];
  answers: WeeklyReportAnswers;
}

export async function generateReportSummary(input: GenerateSummaryInput): Promise<AISummaryData> {
  const { employeeName, reportingPeriod, workUpdates, answers } = input;

  const client = getAIClient();

  const formattedWorkUpdates = workUpdates.length > 0
    ? workUpdates
        .map(
          (w, idx) =>
            `${idx + 1}. [Date: ${w.workDate}] (${w.hoursSpent} hrs | ${w.projectTag}): ${w.description}`
        )
        .join('\n')
    : 'No daily work logs recorded for this period.';

  const promptText = `
You are an executive employee reporting assistant. Summarize the provided weekly work report using ONLY the information supplied. Do NOT invent accomplishments, metrics, technologies, dates, business outcomes, or team members.

EMPLOYEE: ${employeeName}
REPORTING PERIOD: ${reportingPeriod}

DAILY WORK LOGS:
${formattedWorkUpdates}

WEEKLY REPORT QUESTION RESPONSES:
1. Accomplishments:
${answers.accomplishments || 'None stated'}

2. In Progress:
${answers.inProgress || 'None stated'}

3. Blockers / Challenges:
${answers.blockers || 'None stated'}

4. Next Week Priorities:
${answers.nextWeekPriorities || 'None stated'}

INSTRUCTIONS:
Generate a structured JSON response with the following format:
{
  "executiveSummary": "A concise 2-3 sentence executive overview of the employee's work and output this week.",
  "keyAccomplishments": ["Bulleted accomplishment 1", "Bulleted accomplishment 2"],
  "currentWork": ["Bulleted item in progress 1", "Bulleted item in progress 2"],
  "blockers": ["Bulleted blocker or 'No active blockers reported'"],
  "nextWeekPriorities": ["Bulleted priority for next week 1", "Bulleted priority for next week 2"]
}
Respond strictly with valid JSON.
`;

  if (client) {
    try {
      console.log(`[AI Service] Generating AI summary for ${employeeName} using ${config.geminiModel}...`);
      const response = await client.models.generateContent({
        model: config.geminiModel,
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are an executive employee reporting assistant. Summarize strictly and accurately based on facts provided.',
        },
      });

      const responseText = response.text?.trim();
      if (responseText) {
        // Strip code fences if present
        const cleaned = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(cleaned);

        return {
          executiveSummary: parsed.executiveSummary || 'Summary generated for weekly submission.',
          keyAccomplishments: Array.isArray(parsed.keyAccomplishments) ? parsed.keyAccomplishments : [answers.accomplishments || 'Completed scheduled deliverables'],
          currentWork: Array.isArray(parsed.currentWork) ? parsed.currentWork : [answers.inProgress || 'In-flight sprints ongoing'],
          blockers: Array.isArray(parsed.blockers) ? parsed.blockers : [answers.blockers || 'No active blockers reported'],
          nextWeekPriorities: Array.isArray(parsed.nextWeekPriorities) ? parsed.nextWeekPriorities : [answers.nextWeekPriorities || 'Continue roadmap execution'],
          generatedAt: new Date().toISOString(),
          model: config.geminiModel,
          rawText: responseText,
        };
      }
    } catch (error: any) {
      console.error('[AI Service] Gemini API call failed:', error.message || error);
      // Fall through to deterministic synthesizer if API key expired or temporary network issue
    }
  } else {
    console.log('[AI Service] GEMINI_API_KEY not configured or empty. Using deterministic executive synthesizer.');
  }

  // Deterministic synthesizer (ensures reliability even without external API key)
  const accomplishmentsList = answers.accomplishments
    ? answers.accomplishments.split('\n').map(s => s.replace(/^[-*•\d.]\s*/, '').trim()).filter(Boolean)
    : [];
  if (accomplishmentsList.length === 0 && answers.accomplishments) {
    accomplishmentsList.push(answers.accomplishments.trim());
  }

  const inProgressList = answers.inProgress
    ? answers.inProgress.split('\n').map(s => s.replace(/^[-*•\d.]\s*/, '').trim()).filter(Boolean)
    : [];
  if (inProgressList.length === 0 && answers.inProgress) {
    inProgressList.push(answers.inProgress.trim());
  }

  const blockersList = answers.blockers
    ? answers.blockers.split('\n').map(s => s.replace(/^[-*•\d.]\s*/, '').trim()).filter(Boolean)
    : ['No active blockers reported'];

  const prioritiesList = answers.nextWeekPriorities
    ? answers.nextWeekPriorities.split('\n').map(s => s.replace(/^[-*•\d.]\s*/, '').trim()).filter(Boolean)
    : [];
  if (prioritiesList.length === 0 && answers.nextWeekPriorities) {
    prioritiesList.push(answers.nextWeekPriorities.trim());
  }

  const totalHours = workUpdates.reduce((acc, curr) => acc + (curr.hoursSpent || 0), 0);

  return {
    executiveSummary: `${employeeName} logged ${workUpdates.length} work updates totaling ${totalHours} hours during the ${reportingPeriod} period, focusing on primary weekly deliverables and key roadmap items.`,
    keyAccomplishments: accomplishmentsList.length > 0 ? accomplishmentsList : ['Completed all scheduled daily tasks for the reporting week.'],
    currentWork: inProgressList.length > 0 ? inProgressList : ['Core work stream progress in alignment with sprint targets.'],
    blockers: blockersList.length > 0 ? blockersList : ['No active blockers reported.'],
    nextWeekPriorities: prioritiesList.length > 0 ? prioritiesList : ['Continue execution of planned departmental objectives.'],
    generatedAt: new Date().toISOString(),
    model: config.geminiApiKey ? `${config.geminiModel} (Fallback)` : 'Internal Executive Synthesizer',
  };
}

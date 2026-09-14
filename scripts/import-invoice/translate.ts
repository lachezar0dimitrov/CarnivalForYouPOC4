import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type TranslationInput = { index: number; title: string; description: string };
export type TranslationOutput = { index: number; nameBg: string; descriptionBg: string };

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

const RESULT_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          index: { type: 'integer' },
          name_bg: { type: 'string' },
          description_bg: { type: 'string' },
        },
        required: ['index', 'name_bg', 'description_bg'],
      },
    },
  },
  required: ['items'],
};

// Uses the `claude` CLI (this machine's Claude Code login / Pro-Max plan
// usage) instead of a metered ANTHROPIC_API_KEY — the client explicitly
// doesn't want a separate pay-per-token API bill for this. Run from this
// script's own directory (no CLAUDE.md here) rather than the project root,
// and with all tools disallowed, since a stateless translation call needs
// no project context or tool access — both cut the fixed per-call token
// overhead noticeably (verified: ~36K vs ~59K cache-creation tokens).
function runClaudeCli(prompt: string, timeoutMs = 180_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'claude',
      [
        '-p',
        '--output-format',
        'json',
        '--json-schema',
        JSON.stringify(RESULT_SCHEMA),
        '--disallowedTools',
        'Bash,Read,Grep,Glob,Edit,Write,WebFetch,WebSearch,Task',
      ],
      { cwd: SCRIPT_DIR, stdio: ['pipe', 'pipe', 'pipe'] }
    );

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('claude CLI timed out'));
    }, timeoutMs);

    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(`claude CLI exited ${code}: ${stderr || stdout}`));
      else resolve(stdout);
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

async function requestTranslation(items: TranslationInput[]): Promise<TranslationOutput[]> {
  const prompt = [
    'Translate these carnival/costume product listings from English to Bulgarian.',
    'Keep names short and natural for a Bulgarian costume-rental catalog (not a literal word-for-word translation).',
    'The English text is wholesale/retailer marketing copy (written to convince shops to stock the item) — do NOT translate that tone. ' +
      'Rewrite each description as a short (2-4 sentence) customer-facing rental description: what the costume includes, what it looks like, and what occasions it suits. ' +
      'Drop anything aimed at retailers (stocking advice, "basket value", "wholesale order", upsell suggestions).',
    '',
    'Respond via the structured_output JSON matching the given schema — items in the same order/index as given.',
    '',
    'Items:',
    JSON.stringify(items.map((i) => ({ index: i.index, title: i.title, description: i.description }))),
  ].join('\n');

  const raw = await runClaudeCli(prompt);
  const envelope = JSON.parse(raw) as {
    is_error?: boolean;
    result?: string;
    structured_output?: { items: { index: number; name_bg: string; description_bg: string }[] };
  };

  if (envelope.is_error) {
    throw new Error(`claude CLI returned an error: ${envelope.result ?? 'unknown'}`);
  }

  const resultItems = envelope.structured_output?.items;
  if (!resultItems) {
    throw new Error(`claude CLI response had no structured_output.items: ${raw.slice(0, 300)}`);
  }

  return resultItems.map((p) => ({ index: p.index, nameBg: p.name_bg ?? '', descriptionBg: p.description_bg ?? '' }));
}

// One batched CLI call for the whole invoice instead of one per product —
// the fixed per-call overhead (~$0.10-0.20 notional, covered by the Pro/Max
// plan's included usage) makes batching far more sensible than ~60 calls.
export async function translateBatch(items: TranslationInput[]): Promise<Map<number, TranslationOutput>> {
  const result = new Map<number, TranslationOutput>();
  if (items.length === 0) return result;

  let attempts = 0;
  let lastError: unknown;
  while (attempts < 2) {
    attempts++;
    try {
      const output = await requestTranslation(items);
      for (const o of output) result.set(o.index, o);
      if (result.size === items.length) return result;
      lastError = new Error(`Translation returned ${result.size}/${items.length} items`);
    } catch (err) {
      lastError = err;
    }
  }

  console.warn(`Превод: неуспешен опит след ${attempts} опита — ${String(lastError)}`);
  return result;
}

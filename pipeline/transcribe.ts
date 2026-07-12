import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { runFfmpeg } from "../lib/ffmpeg.js";
import { ensureDir, paths } from "../lib/paths.js";

/**
 * Transcribe a video's speech to word-level timestamps using a Whisper API.
 *
 * Word timestamps are what make animated word-by-word captions possible, so we
 * always request them. Works with either provider (same OpenAI-compatible API):
 *   - Groq   (GROQ_API_KEY)   — fast + effectively free, model whisper-large-v3
 *   - OpenAI (OPENAI_API_KEY) — model whisper-1
 */

export interface TranscriptWord {
  text: string;
  startMs: number;
  endMs: number;
}

export interface Transcript {
  provider: string;
  model: string;
  language?: string;
  text: string;
  words: TranscriptWord[];
}

interface Provider {
  name: string;
  url: string;
  model: string;
  key: string;
}

function pickProvider(): Provider | null {
  if (process.env.GROQ_API_KEY) {
    return {
      name: "groq",
      url: "https://api.groq.com/openai/v1/audio/transcriptions",
      model: process.env.WHISPER_MODEL || "whisper-large-v3",
      key: process.env.GROQ_API_KEY,
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      name: "openai",
      url: "https://api.openai.com/v1/audio/transcriptions",
      model: process.env.WHISPER_MODEL || "whisper-1",
      key: process.env.OPENAI_API_KEY,
    };
  }
  return null;
}

export function transcriptionAvailable(): boolean {
  return pickProvider() !== null;
}

/** Compress a video's audio to a small mono mp3 suitable for upload. */
async function extractCompressedAudio(src: string): Promise<string> {
  const tmp = path.join(os.tmpdir(), `whisper_${process.pid}_${Math.floor(performance.now())}.mp3`);
  await runFfmpeg(["-y", "-i", src, "-vn", "-ac", "1", "-ar", "16000", "-b:a", "64k", tmp]);
  return tmp;
}

export async function transcribe(
  src: string,
  opts: { language?: string } = {},
): Promise<Transcript> {
  const provider = pickProvider();
  if (!provider) {
    throw new Error(
      "No transcription API key. Set GROQ_API_KEY or OPENAI_API_KEY (Groq is free & fast).",
    );
  }

  const audioPath = await extractCompressedAudio(src);
  try {
    const form = new FormData();
    const bytes = fs.readFileSync(audioPath);
    form.append("file", new Blob([bytes], { type: "audio/mpeg" }), path.basename(audioPath));
    form.append("model", provider.model);
    form.append("response_format", "verbose_json");
    form.append("timestamp_granularities[]", "word");
    if (opts.language) form.append("language", opts.language);

    const res = await fetch(provider.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${provider.key}` },
      body: form,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`${provider.name} transcription failed (${res.status}): ${body.slice(0, 500)}`);
    }
    const json: any = await res.json();

    const words: TranscriptWord[] = Array.isArray(json.words)
      ? json.words.map((w: any) => ({
          text: String(w.word ?? w.text ?? "").trim(),
          startMs: Math.round(Number(w.start) * 1000),
          endMs: Math.round(Number(w.end) * 1000),
        }))
      : [];

    return {
      provider: provider.name,
      model: provider.model,
      language: json.language,
      text: String(json.text ?? ""),
      words,
    };
  } finally {
    if (fs.existsSync(audioPath)) fs.rmSync(audioPath);
  }
}

/** Transcribe and persist to data/transcripts/<name>.json. Returns the path. */
export async function transcribeToFile(src: string, opts: { language?: string } = {}): Promise<string> {
  const transcript = await transcribe(src, opts);
  ensureDir(paths.transcripts);
  const name = path.basename(src).replace(/\.[^.]+$/, "");
  const out = path.join(paths.transcripts, `${name}.json`);
  fs.writeFileSync(out, JSON.stringify(transcript, null, 2));
  return out;
}

/* CLI: tsx pipeline/transcribe.ts <video> [--lang en] */
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const src = args.find((a) => !a.startsWith("--"));
  const langIdx = args.indexOf("--lang");
  const language = langIdx >= 0 ? args[langIdx + 1] : undefined;
  if (!src) {
    console.error("Usage: tsx pipeline/transcribe.ts <video> [--lang en]");
    process.exit(1);
  }
  transcribeToFile(src, { language })
    .then((out) => {
      const t = JSON.parse(fs.readFileSync(out, "utf8")) as Transcript;
      console.log(`Transcribed via ${t.provider}: ${t.words.length} words. -> ${out}`);
      console.log(t.text.slice(0, 200));
    })
    .catch((e) => {
      console.error(String(e.message ?? e));
      process.exit(1);
    });
}

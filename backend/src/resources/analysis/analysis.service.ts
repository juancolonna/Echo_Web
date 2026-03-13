import amqp, { Channel, ChannelModel, ConsumeMessage } from "amqplib";

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

type JobOwnerRecord = { userId: string };
const jobOwners = new Map<string, JobOwnerRecord>();

const results = new Map<string, any>();

// ── Modo benchmark ────────────────────────────────────────────────────────────
// Quando BENCHMARK_MODE=true, o TTL dos resultados em memória é aumentado de
// 5 minutos para 1 hora, garantindo que os resultados permaneçam disponíveis por mais tempo.
// Em produção (padrão), o comportamento é idêntico ao original.
const BENCHMARK_MODE = process.env.BENCHMARK_MODE === "true";
const RESULT_TTL     = BENCHMARK_MODE ? 60 * 60 * 1000 : 5 * 60 * 1000;

if (BENCHMARK_MODE) {
  console.log("[analysis] BENCHMARK_MODE ativo — RESULT_TTL aumentado para 1 hora.");
}
// ─────────────────────────────────────────────────────────────────────────────

let consumerStarted = false;

// --- RabbitMQ connection management ---

async function getChannel() {
  if (!connection) {
    connection = await amqp.connect("amqp://rabbitmq", {
      heartbeat: 60,
    });

    const conn = connection;

    conn.on("error", (err: Error) => {
      console.error("[rabbitmq] Connection error:", err);
      connection = null;
      channel = null;
    });

    conn.on("close", () => {
      console.warn("[rabbitmq] Connection closed");
      connection = null;
      channel = null;
    });
  }

  if (!channel) {
    channel = await connection!.createChannel();
    await channel.assertQueue("micro-jobs",        { durable: true });
    await channel.assertQueue("analysis-results",  { durable: true });
    await channel.assertQueue("batch-jobs",         { durable: true });
    await channel.assertQueue("spectrogram-jobs",   { durable: true });
    await channel.assertQueue("compute-all-jobs",   { durable: true });
  }

  return channel!;
}

// --- Job ownership ---

function registerJobOwner(jobId: string, userId: string) {
  jobOwners.set(jobId, { userId });
  setTimeout(() => {
    jobOwners.delete(jobId);
  }, RESULT_TTL);
}

export function canAccessJob(jobId: string, userId: string): boolean {
  const owner = jobOwners.get(jobId);
  if (!owner) return false;
  return owner.userId === userId;
}

// --- Result consumer ---

export async function startResultConsumer() {
  if (consumerStarted) return;

  const ch = await getChannel();

  ch.consume("analysis-results", (msg: ConsumeMessage | null) => {
    if (msg) {
      const result = JSON.parse(msg.content.toString());
      results.set(result.jobId, result);

      console.log("[analysis] Result received for job_id=%s", result.jobId);

      setTimeout(() => {
        results.delete(result.jobId);
      }, RESULT_TTL);

      ch.ack(msg);
    }
  });

  consumerStarted = true;
  console.log("[analysis] Result consumer started");
}

export async function getJobResult(jobId: string) {
  return results.get(jobId) || null;
}

// --- Job submission ---

export async function analyzeFile(audioPath: string, userId: string) {
  await startResultConsumer();

  const ch = await getChannel();
  const jobId = crypto.randomUUID();

  registerJobOwner(jobId, userId);
  registerJobOwner(`${jobId}_micro`, userId);

  ch.sendToQueue(
    "batch-jobs",
    Buffer.from(JSON.stringify({ jobId, audioPath, enqueuedAt: new Date().toISOString() })),
    { persistent: true }
  );

  console.log("[analysis] Job submitted job_id=%s queue=batch-jobs", jobId);

  return jobId;
}

export async function analyzeMicroFile(csvPath: string, userId: string, jobId?: string) {
  await startResultConsumer();

  const ch = await getChannel();
  const resolvedJobId = jobId ?? crypto.randomUUID();

  registerJobOwner(resolvedJobId, userId);

  ch.sendToQueue(
    "micro-jobs",
    Buffer.from(JSON.stringify({ jobId: resolvedJobId, csvPath, enqueuedAt: new Date().toISOString() })),
    { persistent: true }
  );

  console.log("[analysis] Job submitted job_id=%s queue=micro-jobs", resolvedJobId);

  return resolvedJobId;
}

export async function detectSauim(audioPath: string, parentJobId: string, filename: string, userId: string) {
  await startResultConsumer();

  const ch = await getChannel();
  await ch.assertQueue("sauim-detection", { durable: true });

  const safeFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const jobId = `${parentJobId}_sauim_${safeFilename}_${crypto.randomUUID()}`;

  registerJobOwner(jobId, userId);

  ch.sendToQueue(
    "sauim-detection",
    Buffer.from(JSON.stringify({ jobId, audioPath })),
    { persistent: true }
  );

  console.log("[analysis] Job submitted job_id=%s queue=sauim-detection", jobId);

  return jobId;
}

export async function generateSpectrogram(audioPath: string, userId: string, jobId?: string) {
  await startResultConsumer();

  const ch = await getChannel();
  const resolvedJobId = jobId ?? crypto.randomUUID();

  registerJobOwner(resolvedJobId, userId);

  ch.sendToQueue(
    "spectrogram-jobs",
    Buffer.from(JSON.stringify({ jobId: resolvedJobId, audioPath })),
    { persistent: true }
  );

  console.log("[analysis] Job submitted job_id=%s queue=spectrogram-jobs", resolvedJobId);

  return resolvedJobId;
}

export async function computeAllAudio(
  originalJobId: string,
  files: Array<{ filepath: string; filename: string; ar: number }>,
  userId: string
) {
  await startResultConsumer();

  const ch = await getChannel();
  const fullJobId = `${originalJobId}_full`;

  registerJobOwner(fullJobId, userId);

  ch.sendToQueue(
    "compute-all-jobs",
    Buffer.from(JSON.stringify({
      jobId:          originalJobId,
      fullJobId,
      files,
      enqueuedAt:     new Date().toISOString(),
    })),
    { persistent: true }
  );

  console.log(
    "[analysis] Compute-all submitted job_id=%s files=%d queue=compute-all-jobs",
    fullJobId,
    files.length
  );

  return fullJobId;
}
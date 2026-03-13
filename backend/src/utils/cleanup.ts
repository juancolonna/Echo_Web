import fs from "fs/promises";
import path from "path";
import cron from "node-cron";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const JOBS_BASE = "/app/uploads/jobs";
const JOB_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

const UPLOADS_BASE = "/app/uploads";
const ZIP_TTL_MS = 1 * 60 * 60 * 1000; // 1 hour

const SPECTROGRAM_TTL_MS = 30 * 60 * 1000; // 30 minutes


async function cleanOrphanZips(): Promise<void> {
    let entries: string[];
    try {
        entries = await fs.readdir(UPLOADS_BASE);
    } catch {
        console.warn("[cleanup] Uploads directory not found, skipping zip cleanup.");
        return;
    }

    const now = Date.now();
    let deleted = 0;

    for (const entry of entries) {
        if (!entry.endsWith(".zip")) continue;

        const filePath = path.join(UPLOADS_BASE, entry);

        try {
            const stat = await fs.stat(filePath);
            const ageMs = now - stat.ctimeMs;

            if (ageMs >= ZIP_TTL_MS) {
                await fs.rm(filePath, { force: true });
                console.log(`[cleanup] Removed orphan zip: ${entry}`);
                deleted++;
            }
        } catch (err) {
            console.error(`[cleanup] Failed to remove zip ${entry}:`, err);
        }
    }

    console.log(`[cleanup] Zip cleanup done. Removed ${deleted} orphan zip(s).`);
}


async function cleanOldSpectrograms(): Promise<void> {
    console.log("[cleanup] Scanning for old spectrograms...");

    let jobsDir: string[];
    try {
        jobsDir = await fs.readdir(JOBS_BASE);
    } catch {
        console.warn("[cleanup] Jobs directory not found, skipping spectrogram cleanup.");
        return;
    }

    const now = Date.now();
    let deleted = 0;

    for (const jobId of jobsDir) {
        const jobPath = path.join(JOBS_BASE, jobId);

        try {
            const files = await fs.readdir(jobPath);
            const spectrograms = files.filter(f => f.includes('_spectrogram.png'));

            for (const specFile of spectrograms) {
                const filePath = path.join(jobPath, specFile);
                const stat = await fs.stat(filePath);
                const ageMs = now - stat.mtimeMs;

                if (ageMs >= SPECTROGRAM_TTL_MS) {
                    await fs.unlink(filePath);
                    console.log(`[cleanup] Removed old spectrogram: ${jobId}/${specFile}`);
                    deleted++;
                }
            }
        } catch (err) {
            // Ignora erros (pasta não existe, permissão, etc)
            continue;
        }
    }

    console.log(`[cleanup] Removed ${deleted} old spectrogram(s)`);
}




export async function deleteJobFolder(jobId: string): Promise<void> {
    // Strip suffixes like _micro, _sauim_* to always resolve the base job folder
    const baseJobId = jobId.replace(/_micro$/, "").replace(/_sauim_.+$/, "");
    const jobDir = path.join(JOBS_BASE, baseJobId);

    try {
        await fs.rm(jobDir, { recursive: true, force: true });
        console.log(`[cleanup] Deleted job folder: ${jobDir}`);
    } catch (err) {
        console.error(`[cleanup] Failed to delete job folder ${jobDir}:`, err);
    }
}

async function getSavedJobIds(): Promise<Set<string>> {
    const saved = await prisma.savedAnalysis.findMany({
        select: { jobId: true },
    });
    return new Set(saved.map((s) => s.jobId));
}

export async function runCleanup(): Promise<void> {
    console.log("[cleanup] Running scheduled cleanup...");

    let entries: string[];
    try {
        entries = await fs.readdir(JOBS_BASE);
    } catch {
        console.warn("[cleanup] Jobs directory not found, skipping.");
        return;
    }

    const savedJobIds = await getSavedJobIds();
    console.log(`[cleanup] Saved job IDs in DB: ${savedJobIds.size}`);
    console.log(`[cleanup] Sample saved IDs:`, [...savedJobIds].slice(0, 3));
    const now = Date.now();
    let deleted = 0;

    for (const entry of entries) {
        // Only process valid UUID folders
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(entry)) continue;

        if (savedJobIds.has(entry)) {
            console.log(`[cleanup] Skipping saved job: ${entry}`);
            continue;
        }

        const folderPath = path.join(JOBS_BASE, entry);

        try {
            const stat = await fs.stat(folderPath);
            const ageMs = now - stat.mtimeMs;

            if (ageMs >= JOB_TTL_MS) {
                await fs.rm(folderPath, { recursive: true, force: true });
                console.log(`[cleanup] Removed stale job folder: ${entry} (age: ${Math.round(ageMs / 3600000)}h)`);
                deleted++;
            }
        } catch (err) {
            console.error(`[cleanup] Failed to process folder ${entry}:`, err);
        }
    }
    await cleanOrphanZips();
    await cleanOldSpectrograms();
    console.log(`[cleanup] Done. Removed ${deleted} stale job(s).`);
}

// Runs every hour
export function startCleanupCron(): void {
    cron.schedule("0 * * * *", runCleanup);
    console.log("[cleanup] Cron scheduled (every hour)");
}


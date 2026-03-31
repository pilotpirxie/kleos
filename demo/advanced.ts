/**
 * Advanced kleos demos against JSONFakery: interceptors, concurrency, abort, timeout, download progress.
 * Mock data only — not for production. See https://jsonfakery.com/
 */
import kleos, { type KleosProgressEvent } from "../src/kleos.ts";

/** Per-request start time stored on config by the demo request interceptor (not part of public kleos API). */
interface DemoRequestTiming {
  kleosDemoRequestStartedAt?: number;
}

/** Minimal movie fields we log from JSONFakery responses (payloads vary). */
interface JsonFakeryMovie {
  id?: number | string;
  title?: string;
  name?: string;
  [key: string]: unknown;
}

/** Minimal blog post fields we log from JSONFakery responses (payloads vary). */
interface JsonFakeryBlogPost {
  id?: number | string;
  title?: string;
  [key: string]: unknown;
}

/**
 * Logs a labeled section so console output matches an “operation → sample output” flow.
 */
function logSection(title: string, payload: unknown): void {
  console.log(`\n--- ${title} ---`);
  console.dir(payload, { depth: null });
}

/**
 * Runs advanced kleos examples; surfaces KleosError / Cancel details on failure paths.
 */
async function runAdvancedDemo(): Promise<void> {
  const api = kleos.create({
    baseURL: "https://jsonfakery.com",
    timeout: 30_000,
  });

  api.interceptors.request.use((config) => {
    // Stamp wall-clock start on each outgoing request so the response interceptor can compute latency.
    (config as DemoRequestTiming).kleosDemoRequestStartedAt = performance.now();
    return config;
  });

  api.interceptors.response.use((response) => {
    // Emit one line per completed request with method, path, status, and round-trip time for demo visibility.
    const startedAt = (response.config as DemoRequestTiming)
      .kleosDemoRequestStartedAt;
    if (startedAt !== undefined) {
      const durationMs = Math.round(performance.now() - startedAt);
      console.log(
        `[interceptor] ${response.config.method?.toUpperCase() ?? "GET"} ${response.config.url ?? ""} → ${response.status} in ${durationMs}ms`,
      );
    }
    return response;
  });

  try {
    const withTiming = await api.get<JsonFakeryMovie>("/movies/random");
    logSection("Interceptors + typed GET /movies/random", withTiming.data);

    const [movieRes, blogRes] = await Promise.all([
      api.get<JsonFakeryMovie>("/movies/random"),
      api.get<JsonFakeryBlogPost>("/blogs/random"),
    ]);
    logSection("Concurrent GET /movies/random + /blogs/random", {
      movie: movieRes.data,
      blog: blogRes.data,
    });

    const controller = new AbortController();
    const paginatedPromise = api
      .get("/movies/paginated", { signal: controller.signal })
      .catch((error: unknown) => error);
    controller.abort("demo abort");
    const cancelOutcome = await paginatedPromise;
    if (kleos.isCancel(cancelOutcome)) {
      logSection("AbortController on GET /movies/paginated (expected cancel)", {
        message: cancelOutcome.message,
      });
    } else {
      logSection("AbortController — unexpected outcome", cancelOutcome);
      process.exitCode = 1;
    }

    try {
      await api.get("/blogs/infinite-scroll", { timeout: 1 });
      logSection(
        "Timeout demo — unexpected success (response faster than 1ms)",
        {},
      );
    } catch (error: unknown) {
      if (kleos.isKleosError(error)) {
        logSection("Timeout on GET /blogs/infinite-scroll (expected)", {
          code: error.code,
          message: error.message,
        });
      } else {
        throw error;
      }
    }

    const progressEvents: KleosProgressEvent[] = [];
    await api.get<JsonFakeryMovie[]>("/movies/random/100", {
      onDownloadProgress: (event) => {
        // Store a slim snapshot of each progress tick so we can summarize without flooding the console.
        progressEvents.push({
          loaded: event.loaded,
          total: event.total,
          progress: event.progress,
          lengthComputable: event.lengthComputable,
        });
      },
    });
    logSection("Download progress on GET /movies/random/100 (sample events)", {
      eventCount: progressEvents.length,
      first: progressEvents[0],
      last: progressEvents[progressEvents.length - 1],
    });
  } catch (error) {
    if (kleos.isKleosError(error)) {
      if (error.response) {
        console.error(
          "KleosError (response):",
          error.response.status,
          error.response.data,
        );
      } else {
        console.error("KleosError (no response):", error.code, error.message);
      }
    } else if (kleos.isCancel(error)) {
      console.error("Unexpected cancel:", error.message);
    } else {
      throw error;
    }
    process.exitCode = 1;
  }
}

void runAdvancedDemo();

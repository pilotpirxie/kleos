/**
 * Runnable examples mirroring JSONPlaceholder guide flows using kleos (Axios-shaped API on fetch).
 * See https://jsonplaceholder.typicode.com/ and README quick start for kleos usage.
 */
import kleos from "../src/kleos.ts";

/** JSONPlaceholder post shape used for typed responses in this demo. */
interface JsonPlaceholderPost {
  id?: number;
  title?: string;
  body?: string;
  userId?: number;
}

/** JSONPlaceholder comment shape for nested /posts/:id/comments responses. */
interface JsonPlaceholderComment {
  id: number;
  postId: number;
  name: string;
  email: string;
  body: string;
}

/**
 * Logs a labeled section so console output matches the guide’s “operation → sample output” flow.
 */
function logSection(title: string, payload: unknown): void {
  console.log(`\n--- ${title} ---`);
  console.dir(payload, { depth: null });
}

/**
 * Runs all JSONPlaceholder examples against the shared kleos instance; surfaces KleosError details on failure.
 */
async function runDemo(): Promise<void> {
  const api = kleos.create({
    baseURL: "https://jsonplaceholder.typicode.com",
    timeout: 15_000,
  });

  try {
    const one = await api.get<JsonPlaceholderPost>("/posts/1");
    logSection("Getting a resource (GET /posts/1)", one.data);

    const all = await api.get<JsonPlaceholderPost[]>("/posts");
    logSection(
      "Listing all resources (GET /posts) — first 3 items",
      all.data.slice(0, 3),
    );

    const created = await api.post<JsonPlaceholderPost>("/posts", {
      title: "foo",
      body: "bar",
      userId: 1,
    });
    logSection("Creating a resource (POST /posts)", created.data);

    const replaced = await api.put<JsonPlaceholderPost>("/posts/1", {
      id: 1,
      title: "foo",
      body: "bar",
      userId: 1,
    });
    logSection("Updating a resource (PUT /posts/1)", replaced.data);

    const patched = await api.patch<JsonPlaceholderPost>("/posts/1", {
      title: "foo",
    });
    logSection("Patching a resource (PATCH /posts/1)", patched.data);

    const deleted = await api.delete("/posts/1");
    logSection(
      "Deleting a resource (DELETE /posts/1) — status",
      deleted.status,
    );

    const filtered = await api.get<JsonPlaceholderPost[]>("/posts", {
      params: { userId: 1 },
    });
    logSection(
      "Filtering resources (GET /posts?userId=1) — first 3 items",
      filtered.data.slice(0, 3),
    );

    const nested = await api.get<JsonPlaceholderComment[]>("/posts/1/comments");
    logSection(
      "Listing nested resources (GET /posts/1/comments) — first 2 items",
      nested.data.slice(0, 2),
    );
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
    } else {
      throw error;
    }
    process.exitCode = 1;
  }
}

void runDemo();

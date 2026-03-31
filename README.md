# kleos

**kleos** is a small TypeScript HTTP client with an **Axios-shaped API** on **native `fetch`** only—no runtime npm dependencies. Works in browsers and **Node 18+**.

## Table of contents

- [Install](#install)
- [Replace Axios](#replace-axios)
- [Quick start](#quick-start)
- [API](#api)
- [Creating an instance & defaults](#creating-an-instance--defaults)
- [Interceptors](#interceptors)
- [Handling errors](#handling-errors)
- [Timeouts](#timeouts)
- [Cancellation](#cancellation)
- [URL-encoded & multipart](#url-encoded--multipart)
- [Progress](#progress)
- [What’s different from Axios](#whats-different-from-axios)

## Install

```bash
npm install kleos
```

```bash
yarn add kleos
pnpm add kleos
```

## Replace Axios

Most call sites only need a different import. You can keep the name `axios` if you want a mechanical swap:

```ts
// Before
// import axios from "axios";

// After (same usage)
import axios from "kleos";
```

Or use the real name:

```ts
import kleos from "kleos";
```

Full surface lives in [`src/kleos.ts`](src/kleos.ts). Node-only Axios options (custom `http`/`https` agents, proxy, `maxRate`, XHR/fetch adapter selection, etc.) are **not** supported—this client is **fetch-only**.

## Quick start

```ts
import kleos from "kleos";

// GET with query
const { data } = await kleos.get("/api/user", { params: { ID: "12345" } });

// POST JSON (default for plain objects)
await kleos.post("/api/user", { firstName: "Fred", lastName: "Flintstone" });

// Concurrent requests (same as Axios: use Promise.all)
const [acct, perms] = await Promise.all([
  kleos.get("/user/12345"),
  kleos.get("/user/12345/permissions"),
]);
```

Callable form (GET by default when you pass a URL string):

```ts
await kleos("/user/12345");
await kleos({ method: "post", url: "/user/12345", data: { name: "x" } });
```

## API

**Aliases** (same idea as Axios): `request`, `get`, `delete`, `head`, `options`, `post`, `put`, `patch`, `postForm`, `putForm`, `patchForm`, plus `getUri(config)`.

## Creating an instance & defaults

```ts
import kleos from "kleos";

const api = kleos.create({
  baseURL: "https://api.example.com",
  timeout: 10_000,
  headers: { "X-Custom-Header": "foobar" },
});

await api.get("/items"); // → https://api.example.com/items
```

**Global defaults** (shared default export):

```ts
kleos.defaults.baseURL = "https://api.example.com";
kleos.defaults.headers.common["Authorization"] = `Bearer ${token}`;
```

**Precedence**: library defaults → `instance.defaults` → per-request `config`.

## Interceptors

Request interceptors run **last registered first** (LIFO). Response interceptors run **first registered first** (FIFO).

```ts
const api = kleos.create();

api.interceptors.request.use(
  (config) => {
    config.headers.Authorization = `Bearer ${getToken()}`;
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (kleos.isKleosError(error) && error.response?.status === 401) {
      // refresh token, redirect, etc.
    }
    return Promise.reject(error);
  },
);

// Remove one: const id = api.interceptors.request.use(...); api.interceptors.request.eject(id);
// Clear all: api.interceptors.request.clear();
```

Optional flags: `{ synchronous: true }` on request interceptors, or `{ runWhen: (config) => config.method === "GET" }`.

## Handling errors

Non-2xx responses reject with **`KleosError`** (unless you change `validateStatus`). Network/timeout/abort failures also reject with `KleosError` or **`Cancel`** (see [Cancellation](#cancellation)).

```ts
import kleos from "kleos";

try {
  await kleos.get("/user/12345");
} catch (error) {
  if (kleos.isKleosError(error)) {
    if (error.response) {
      console.log(error.response.status, error.response.data);
    } else {
      console.log(error.code, error.message); // e.g. network / timeout
    }
  } else {
    throw error;
  }
}
```

**Custom success range:**

```ts
await kleos.get("/maybe-error", {
  validateStatus: (status) => status < 500,
});
```

## Timeouts

```ts
await kleos.get("https://example.com/data", {
  timeout: 5000,
  timeoutErrorMessage: "took too long",
  transitional: { clarifyTimeoutError: true }, // prefer ETIMEDOUT over ECONNABORTED when applicable
});
```

## Cancellation

**AbortController** (preferred):

```ts
const controller = new AbortController();

kleos.get("/foo", { signal: controller.signal }).catch((err) => {
  if (kleos.isCancel(err)) console.log("aborted");
});

controller.abort();
```

**CancelToken** (legacy-style, still supported):

```ts
const source = kleos.CancelToken.source();

kleos.get("/user", { cancelToken: source.token }).catch((thrown) => {
  if (kleos.isCancel(thrown)) console.log("canceled");
});

source.cancel("optional message");
```

## URL-encoded & multipart

**`application/x-www-form-urlencoded`**: set the header and pass a plain object (serialized like query params), or pass `URLSearchParams`.

```ts
await kleos.post("/foo", new URLSearchParams({ foo: "bar" }));

await kleos.post(
  "/foo",
  { a: 1, b: [2, 3] },
  {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  },
);
```

**`multipart/form-data`**: use real `FormData`, or set `Content-Type: multipart/form-data` and pass an object (Kleos builds `FormData`). Shortcuts:

```ts
await kleos.postForm("/upload", { name: "x", file: fileInput.files[0] });
```

For a raw `FormData` you already built, `post` is enough—do not set `Content-Type` manually (boundary is set by the runtime).

## Progress

**Download** progress uses a streaming read when `Content-Length` is present (or partial progress without total).

```ts
await kleos.get(url, {
  onDownloadProgress: ({ loaded, total, progress }) => {
    console.log(loaded, total, progress);
  },
});
```

**Upload**: `onUploadProgress` is supported in limited cases (e.g. string body gets a single completion event). Prefer `FormData`/streams in environments where fetch exposes enough signal.

## What’s different from Axios

| Topic                 | Notes                                                                   |
| --------------------- | ----------------------------------------------------------------------- |
| Transport             | **fetch only** (no XHR, no Node `http` adapter)                         |
| `response.headers`    | Plain object, **lowercase keys**                                        |
| `request` on response | Opaque `{ kind: "fetch", url }`, not XHR / `ClientRequest`              |
| Redirects             | Uses fetch `redirect: "follow"` unless `maxRedirects === 0` (`manual`)  |
| Cookies / CORS        | `withCredentials: true` → `credentials: "include"`                      |
| Errors                | `KleosError`, `kleos.isKleosError`; cancel → `Cancel`, `kleos.isCancel` |

For types and every config field, see [`src/kleos.ts`](src/kleos.ts).

## Build this repo

```bash
npm install && npm run build
```

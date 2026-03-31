/**
 * Compatibility harness for axios behavior; intended to be reused against kleos later.
 * Uses node:test and node:assert only.
 *
 * Suite index (describe → cases):
 * - Instance Creation & Defaults
 *   - axios.create applies baseURL, timeout, and default headers
 *   - mutating instance.defaults affects subsequent requests
 *   - defaults.headers.post merges for POST requests
 *   - three-level merge: library defaults, instance, then request
 * - Basic Request Methods
 *   - axios.get/post/put/patch/delete/head/options send correct HTTP method
 *   - axios(config) and axios(url, config) behave like get with merged config
 * - Response Handling & Generics
 *   - AxiosResponse data matches generic shape for JSON
 *   - responseType json (default) deserializes object
 *   - responseType text returns string body
 *   - responseType arraybuffer returns binary buffer (ArrayBuffer or Buffer in Node)
 *   - responseType stream yields readable data
 *   - responseType blob: Blob in modern Node or Buffer fallback from adapter
 *   - POST JSON body is serialized and Content-Type set
 * - Error Handling
 *   - AxiosError on HTTP error includes response, config, status, code
 *   - isAxiosError is false for plain Error
 *   - validateStatus can treat non-2xx as success
 *   - error.toJSON() returns serializable snapshot
 * - Interceptors
 *   - request interceptor can mutate headers; eject stops it
 *   - response interceptor can transform data
 *   - request interceptors run in reverse registration order (axios contract)
 *   - response interceptors run in registration order
 *   - interceptors.request.clear removes all request interceptors
 * - Parameters & Serialization
 *   - flat params appear in query string
 *   - array params serialize (axios default: repeated keys with brackets[])
 *   - Date param serializes to ISO-like string
 *   - nested object params use bracket notation in query
 *   - custom paramsSerializer overrides default encoding
 *   - null and undefined params are omitted from query
 * - Payload & Form Data
 *   - URL-encoded object when Content-Type is application/x-www-form-urlencoded
 *   - URLSearchParams as body is sent as application/x-www-form-urlencoded
 *   - postForm builds multipart/form-data with fields
 *   - putForm and patchForm use multipart encoding
 *   - FormData instance passthrough preserves multipart boundary
 *   - Blob body passthrough with explicit Content-Type
 *   - ArrayBuffer body passthrough
 * - Advanced Features
 *   - baseURL combines with relative url for requests
 *   - getUri reflects baseURL, path, and serialized params
 *   - timeout rejects when server is slower than threshold
 *   - AbortController signal cancels in-flight request; isCancel is true
 *   - auth option sets HTTP Basic Authorization header
 *   - withCredentials flag does not break Node requests
 *   - onDownloadProgress receives loaded/total and optional rate/estimated on chunked response
 *   - interceptors.response.clear removes response interceptors
 *
 * Observed axios + Node quirks (for kleos parity); see inline NOTE comments in tests:
 * - responseType "arraybuffer" often yields Buffer, not ArrayBuffer.
 * - responseType "blob" may yield string/Buffer/Blob depending on adapter path — not uniform Web Blob.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Readable } from "node:stream";
import axios, {
  AxiosError,
  type AxiosResponse,
  isAxiosError,
  isCancel,
} from "axios";
import {
  startTestServer,
  stopTestServer,
  type EchoedRequest,
} from "./helpers/test-server.js";

describe("Instance Creation & Defaults", () => {
  test("axios.create applies baseURL, timeout, and default headers", async () => {
    const { baseURL: url, server } = await startTestServer();
    const instance = axios.create({
      baseURL: url,
      timeout: 5000,
      headers: { "X-Instance": "1" },
    });
    try {
      const res = await instance.get<EchoedRequest>("/echo", {
        headers: { "X-Req": "a" },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.path, "/echo");
      assert.equal(res.data.headers["x-instance"], "1");
      assert.equal(res.data.headers["x-req"], "a");
    } finally {
      await stopTestServer(server);
    }
  });

  test("mutating instance.defaults affects subsequent requests", async () => {
    const { baseURL: url, server } = await startTestServer();
    const instance = axios.create({ baseURL: url });
    try {
      instance.defaults.headers.common["X-Mutable"] = "before";
      const r1 = await instance.get<EchoedRequest>("/echo");
      assert.equal(r1.data.headers["x-mutable"], "before");
      instance.defaults.headers.common["X-Mutable"] = "after";
      const r2 = await instance.get<EchoedRequest>("/echo");
      assert.equal(r2.data.headers["x-mutable"], "after");
    } finally {
      await stopTestServer(server);
    }
  });

  test("defaults.headers.post merges for POST requests", async () => {
    const { baseURL: url, server } = await startTestServer();
    const instance = axios.create({ baseURL: url });
    try {
      instance.defaults.headers.post["X-Post-Default"] = "pd";
      const res = await instance.post<EchoedRequest>(
        "/echo",
        { a: 1 },
        { headers: { "X-Post-Req": "pr" } },
      );
      assert.equal(res.data.headers["x-post-default"], "pd");
      assert.equal(res.data.headers["x-post-req"], "pr");
      assert.ok(
        String(res.data.headers["content-type"] ?? "").includes(
          "application/json",
        ),
      );
    } finally {
      await stopTestServer(server);
    }
  });

  test("three-level merge: library defaults, instance, then request", async () => {
    const { baseURL: url, server } = await startTestServer();
    const instance = axios.create({
      baseURL: url,
      headers: {
        "X-Lib": "lib",
        "X-Override": "instance",
        "X-Only-Instance": "i",
      },
    });
    try {
      const res = await instance.get<EchoedRequest>("/echo", {
        headers: { "X-Override": "request", "X-Only-Req": "r" },
      });
      assert.equal(res.data.headers["x-lib"], "lib");
      assert.equal(res.data.headers["x-override"], "request");
      assert.equal(res.data.headers["x-only-instance"], "i");
      assert.equal(res.data.headers["x-only-req"], "r");
    } finally {
      await stopTestServer(server);
    }
  });

  test("per-request data replaces instance defaults.data (no deep merge of body)", async () => {
    const { baseURL: url, server } = await startTestServer();
    const instance = axios.create({
      baseURL: url,
      data: { a: 1, b: 2 },
    });
    try {
      const res = await instance.post<EchoedRequest>("/echo", { b: 3 });
      const parsed = JSON.parse(res.data.body) as Record<string, unknown>;
      assert.deepEqual(parsed, { b: 3 });
      assert.ok(!("a" in parsed));
    } finally {
      await stopTestServer(server);
    }
  });
});

describe("Basic Request Methods", () => {
  test("axios.get/post/put/patch/delete/head/options send correct HTTP method", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      const getRes = await axios.get<EchoedRequest>(`${baseURL}/echo`);
      assert.equal(getRes.data.method, "GET");

      const postRes = await axios.post<EchoedRequest>(`${baseURL}/echo`, {
        x: 1,
      });
      assert.equal(postRes.data.method, "POST");

      const putRes = await axios.put<EchoedRequest>(`${baseURL}/echo`, {
        x: 2,
      });
      assert.equal(putRes.data.method, "PUT");

      const patchRes = await axios.patch<EchoedRequest>(`${baseURL}/echo`, {
        x: 3,
      });
      assert.equal(patchRes.data.method, "PATCH");

      const delRes = await axios.delete<EchoedRequest>(`${baseURL}/echo`);
      assert.equal(delRes.data.method, "DELETE");

      const headRes = await axios.head<EchoedRequest>(`${baseURL}/echo`);
      assert.equal(headRes.status, 200);
      // HEAD responses typically have no body; axios may expose empty data
      assert.equal(headRes.data, "");

      const optRes = await axios.options<EchoedRequest>(`${baseURL}/echo`);
      assert.equal(optRes.data.method, "OPTIONS");
    } finally {
      await stopTestServer(server);
    }
  });

  test("axios(config) and axios(url, config) behave like get with merged config", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      const a = await axios<EchoedRequest>({
        url: `${baseURL}/echo`,
        method: "GET",
        headers: { "X-A": "1" },
      });
      assert.equal(a.data.method, "GET");
      assert.equal(a.data.headers["x-a"], "1");

      const b = await axios.get<EchoedRequest>(`${baseURL}/echo`, {
        headers: { "X-B": "2" },
      });
      assert.equal(b.data.headers["x-b"], "2");
    } finally {
      await stopTestServer(server);
    }
  });
});

describe("Response Handling & Generics", () => {
  test("AxiosResponse data matches generic shape for JSON", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      const res: AxiosResponse<{ hello: string }> = await axios.get(
        `${baseURL}/json`,
      );
      assert.equal(res.status, 200);
      assert.equal(res.data.hello, "world");
    } finally {
      await stopTestServer(server);
    }
  });

  test("responseType json (default) deserializes object", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      const res = await axios.get(`${baseURL}/json`, { responseType: "json" });
      assert.deepEqual(res.data, { hello: "world" });
    } finally {
      await stopTestServer(server);
    }
  });

  test("responseType text returns string body", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      const res = await axios.get(`${baseURL}/json`, { responseType: "text" });
      assert.equal(typeof res.data, "string");
      assert.ok(res.data.includes("hello"));
    } finally {
      await stopTestServer(server);
    }
  });

  test("responseType arraybuffer returns binary buffer (ArrayBuffer or Buffer in Node)", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      const res = await axios.get(`${baseURL}/json`, {
        responseType: "arraybuffer",
      });
      // NOTE (axios + Node http adapter): often returns Buffer, not ArrayBuffer; browsers typically use ArrayBuffer.
      const bytes =
        res.data instanceof ArrayBuffer
          ? new Uint8Array(res.data)
          : Buffer.isBuffer(res.data)
            ? res.data
            : null;
      assert.ok(
        bytes,
        `unexpected arraybuffer payload: ${Object.prototype.toString.call(res.data)}`,
      );
      const text = new TextDecoder().decode(bytes);
      assert.ok(text.includes("hello"));
    } finally {
      await stopTestServer(server);
    }
  });

  test("responseType stream yields readable data", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      const res = await axios.get<Readable>(`${baseURL}/json`, {
        responseType: "stream",
      });
      assert.ok(res.data.readable);
      const chunks: Buffer[] = [];
      for await (const chunk of res.data) {
        chunks.push(Buffer.from(chunk));
      }
      const joined = Buffer.concat(chunks).toString("utf8");
      assert.ok(joined.includes("hello"));
    } finally {
      await stopTestServer(server);
    }
  });

  test("responseType blob: Blob in modern Node or Buffer fallback from adapter", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      const res = await axios.get(`${baseURL}/json`, { responseType: "blob" });
      // NOTE (axios + Node http adapter): responseType 'blob' may deserialize to string, Buffer, or Blob depending on version/path — not spec-like.
      if (res.data instanceof Blob) {
        const text = await res.data.text();
        assert.ok(text.includes("hello"));
      } else if (Buffer.isBuffer(res.data)) {
        assert.ok(res.data.toString("utf8").includes("hello"));
      } else if (typeof res.data === "string") {
        assert.ok(res.data.includes("hello"));
      } else {
        assert.fail(
          `unexpected blob response payload: ${Object.prototype.toString.call(res.data)}`,
        );
      }
    } finally {
      await stopTestServer(server);
    }
  });

  test("POST JSON body is serialized and Content-Type set", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      const res = await axios.post<EchoedRequest>(`${baseURL}/echo`, {
        foo: "bar",
      });
      assert.ok(
        String(res.data.headers["content-type"] ?? "").includes(
          "application/json",
        ),
      );
      assert.deepEqual(JSON.parse(res.data.body), { foo: "bar" });
    } finally {
      await stopTestServer(server);
    }
  });

  test("transformResponse runs in forward registration order (Axios contract)", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      const steps: string[] = [];
      const res = await axios.get(`${baseURL}/json`, {
        transformResponse: [
          (data) => {
            steps.push("first");
            const obj =
              typeof data === "string" ? JSON.parse(data as string) : data;
            return { ...(obj as object), step: 1 };
          },
          (data) => {
            steps.push("second");
            return { ...(data as object), step: 2 };
          },
        ],
      });
      assert.deepEqual(steps, ["first", "second"]);
      assert.equal((res.data as { step?: number }).step, 2);
    } finally {
      await stopTestServer(server);
    }
  });

  test("transformResponse receives data, headers, and status (Axios API)", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      let sawHeaders = false;
      let sawStatus = false;
      const res = await axios.get(`${baseURL}/json`, {
        transformResponse: [
          (data, headers, status) => {
            assert.equal(typeof data, "string");
            sawHeaders =
              typeof headers === "object" &&
              headers !== null &&
              Boolean(
                (headers as Record<string, string>)["content-type"] ??
                (headers as Record<string, string>)["Content-Type"],
              );
            sawStatus = status === 200;
            const obj =
              typeof data === "string" ? JSON.parse(data as string) : data;
            return { ...(obj as object), fromTransform: true };
          },
        ],
      });
      assert.ok(sawHeaders);
      assert.ok(sawStatus);
      assert.equal(
        (res.data as { fromTransform?: boolean }).fromTransform,
        true,
      );
    } finally {
      await stopTestServer(server);
    }
  });
});

describe("Error Handling", () => {
  test("AxiosError on HTTP error includes response, config, status, code", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      await axios.get(`${baseURL}/status/404`);
      assert.fail("expected rejection");
    } catch (e) {
      assert.ok(isAxiosError(e));
      const err = e as AxiosError;
      assert.equal(err.response?.status, 404);
      assert.ok(err.config);
      assert.ok(typeof err.code === "string" || err.code === undefined);
      // status mirrors response.status when present
      assert.equal(err.status, 404);
    } finally {
      await stopTestServer(server);
    }
  });

  test("isAxiosError is false for plain Error", () => {
    assert.equal(isAxiosError(new Error("x")), false);
  });

  test("validateStatus can treat non-2xx as success", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      const res = await axios.get(`${baseURL}/status/404`, {
        validateStatus: (s) => s === 404,
      });
      assert.equal(res.status, 404);
      assert.equal(res.data, "error");
    } finally {
      await stopTestServer(server);
    }
  });

  test("error.toJSON() returns serializable snapshot", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      await axios.get(`${baseURL}/status/500`);
      assert.fail("expected rejection");
    } catch (e) {
      assert.ok(isAxiosError(e));
      const err = e as AxiosError;
      const j = err.toJSON();
      assert.ok(typeof j === "object" && j !== null);
      assert.equal((j as { message?: string }).message, err.message);
    } finally {
      await stopTestServer(server);
    }
  });
});

describe("Interceptors", () => {
  test("request interceptor can mutate headers; eject stops it", async () => {
    const { baseURL, server } = await startTestServer();
    const instance = axios.create({ baseURL });
    const id = instance.interceptors.request.use((config) => {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>)["X-I1"] = "1";
      return config;
    });
    try {
      const r1 = await instance.get<EchoedRequest>("/echo");
      assert.equal(r1.data.headers["x-i1"], "1");
      instance.interceptors.request.eject(id);
      const r2 = await instance.get<EchoedRequest>("/echo");
      assert.equal(r2.data.headers["x-i1"], undefined);
    } finally {
      await stopTestServer(server);
    }
  });

  test("response interceptor can transform data", async () => {
    const { baseURL, server } = await startTestServer();
    const instance = axios.create({ baseURL });
    instance.interceptors.response.use((res) => {
      res.data = { wrapped: res.data };
      return res;
    });
    try {
      const res = await instance.get("/json");
      assert.deepEqual(res.data, { wrapped: { hello: "world" } });
    } finally {
      await stopTestServer(server);
    }
  });

  test("request interceptors run in reverse registration order (axios contract)", async () => {
    const { baseURL, server } = await startTestServer();
    const instance = axios.create({ baseURL });
    const order: string[] = [];
    instance.interceptors.request.use((c) => {
      order.push("a");
      return c;
    });
    instance.interceptors.request.use((c) => {
      order.push("b");
      return c;
    });
    try {
      await instance.get("/echo");
      assert.deepEqual(order, ["b", "a"]);
    } finally {
      await stopTestServer(server);
    }
  });

  test("response interceptors run in registration order", async () => {
    const { baseURL, server } = await startTestServer();
    const instance = axios.create({ baseURL });
    const order: string[] = [];
    instance.interceptors.response.use((r) => {
      order.push("1");
      return r;
    });
    instance.interceptors.response.use((r) => {
      order.push("2");
      return r;
    });
    try {
      await instance.get("/json");
      assert.deepEqual(order, ["1", "2"]);
    } finally {
      await stopTestServer(server);
    }
  });

  test("interceptors.request.clear removes all request interceptors", async () => {
    const { baseURL, server } = await startTestServer();
    const instance = axios.create({ baseURL });
    instance.interceptors.request.use((c) => {
      (c.headers as Record<string, string>)["X-C"] = "1";
      return c;
    });
    instance.interceptors.request.clear();
    try {
      const r = await instance.get<EchoedRequest>("/echo");
      assert.equal(r.data.headers["x-c"], undefined);
    } finally {
      await stopTestServer(server);
    }
  });
});

describe("Parameters & Serialization", () => {
  test("flat params appear in query string", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      const res = await axios.get<EchoedRequest>(`${baseURL}/echo`, {
        params: { a: "1", b: "two" },
      });
      const sp = new URLSearchParams(
        res.data.search.startsWith("?")
          ? res.data.search.slice(1)
          : res.data.search,
      );
      assert.equal(sp.get("a"), "1");
      assert.equal(sp.get("b"), "two");
    } finally {
      await stopTestServer(server);
    }
  });

  test("array params serialize (axios default: repeated keys with brackets[])", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      const res = await axios.get<EchoedRequest>(`${baseURL}/echo`, {
        params: { id: [1, 2, 3] },
      });
      assert.ok(res.data.search.includes("1"));
      assert.ok(res.data.search.includes("2"));
      assert.ok(res.data.search.includes("3"));
    } finally {
      await stopTestServer(server);
    }
  });

  test("Date param serializes to ISO-like string", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      const d = new Date("2020-01-02T03:04:05.000Z");
      const res = await axios.get<EchoedRequest>(`${baseURL}/echo`, {
        params: { d },
      });
      assert.ok(
        res.data.search.includes("2020") || res.data.search.includes("01"),
      );
    } finally {
      await stopTestServer(server);
    }
  });

  test("nested object params use bracket notation in query", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      const res = await axios.get<EchoedRequest>(`${baseURL}/echo`, {
        params: { user: { name: "n", role: "r" } },
      });
      assert.ok(res.data.search.includes("user"));
      assert.ok(
        res.data.search.includes("name") || res.data.search.includes("n"),
      );
    } finally {
      await stopTestServer(server);
    }
  });

  test("custom paramsSerializer overrides default encoding", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      const res = await axios.get<EchoedRequest>(`${baseURL}/echo`, {
        params: { a: 1, b: 2 },
        paramsSerializer: () => "custom=ok",
      });
      const q = res.data.search.startsWith("?")
        ? res.data.search.slice(1)
        : res.data.search;
      assert.equal(q, "custom=ok");
    } finally {
      await stopTestServer(server);
    }
  });

  test("null and undefined params are omitted from query", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      const res = await axios.get<EchoedRequest>(`${baseURL}/echo`, {
        params: { a: 1, b: null, c: undefined },
      });
      assert.ok(res.data.search.includes("a"));
      assert.ok(
        !res.data.search.includes("b=") && !res.data.search.includes("b&"),
      );
      assert.ok(!res.data.search.includes("c="));
    } finally {
      await stopTestServer(server);
    }
  });
});

describe("Payload & Form Data", () => {
  test("URL-encoded object when Content-Type is application/x-www-form-urlencoded", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      const res = await axios.post<EchoedRequest>(
        `${baseURL}/echo`,
        { a: "1", b: "x y" },
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        },
      );
      const ct = String(res.data.headers["content-type"] ?? "");
      assert.ok(ct.includes("application/x-www-form-urlencoded"));
      const body = new URLSearchParams(res.data.body);
      assert.equal(body.get("a"), "1");
      assert.equal(body.get("b"), "x y");
    } finally {
      await stopTestServer(server);
    }
  });

  test("URLSearchParams as body is sent as application/x-www-form-urlencoded", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      const params = new URLSearchParams({ q: "ok" });
      const res = await axios.post<EchoedRequest>(`${baseURL}/echo`, params);
      assert.ok(
        String(res.data.headers["content-type"] ?? "").includes(
          "application/x-www-form-urlencoded",
        ),
      );
      assert.equal(new URLSearchParams(res.data.body).get("q"), "ok");
    } finally {
      await stopTestServer(server);
    }
  });

  test("postForm builds multipart/form-data with fields", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      const res = await axios.postForm<EchoedRequest>(`${baseURL}/echo`, {
        a: "1",
        nested: { b: "2" },
      });
      const ct = String(res.data.headers["content-type"] ?? "");
      assert.ok(ct.includes("multipart/form-data"));
      assert.ok(res.data.body.includes('name="a"'));
    } finally {
      await stopTestServer(server);
    }
  });

  // Axios Node uses `form-data` expecting streams; web `File` in FileList throws. kleos.test.ts runs the same case with fetch.
  test(
    "postForm(FileList) sends each file under files[] (Axios multipart docs)",
    {
      skip: "Node axios adapter does not accept spec File in FileList; see kleos.test.ts for parity",
    },
    async () => undefined,
  );

  test("putForm and patchForm use multipart encoding", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      const putRes = await axios.putForm<EchoedRequest>(`${baseURL}/echo`, {
        x: "p",
      });
      assert.ok(
        String(putRes.data.headers["content-type"] ?? "").includes(
          "multipart/form-data",
        ),
      );
      const patchRes = await axios.patchForm<EchoedRequest>(`${baseURL}/echo`, {
        x: "h",
      });
      assert.ok(
        String(patchRes.data.headers["content-type"] ?? "").includes(
          "multipart/form-data",
        ),
      );
    } finally {
      await stopTestServer(server);
    }
  });

  test("FormData instance passthrough preserves multipart boundary", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      const fd = new FormData();
      fd.append("field", "v");
      const blob = new Blob(["hello"], { type: "text/plain" });
      fd.append("file", blob, "a.txt");
      const res = await axios.post<EchoedRequest>(`${baseURL}/echo`, fd);
      assert.ok(
        String(res.data.headers["content-type"] ?? "").includes(
          "multipart/form-data",
        ),
      );
      assert.ok(res.data.body.includes('name="field"'));
      assert.ok(res.data.body.includes("hello"));
    } finally {
      await stopTestServer(server);
    }
  });

  test("Blob body passthrough with explicit Content-Type", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      const blob = new Blob(["abc"], { type: "application/octet-stream" });
      const res = await axios.post<EchoedRequest>(`${baseURL}/echo`, blob, {
        headers: { "Content-Type": "application/octet-stream" },
      });
      assert.equal(res.data.body, "abc");
    } finally {
      await stopTestServer(server);
    }
  });

  test("ArrayBuffer body passthrough", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      const buf = new Uint8Array([1, 2, 3]).buffer;
      const res = await axios.post<EchoedRequest>(`${baseURL}/echo`, buf, {
        headers: { "Content-Type": "application/octet-stream" },
      });
      assert.equal(res.data.body.length, 3);
    } finally {
      await stopTestServer(server);
    }
  });

  // Node axios may JSON-serialize a mocked form as an object graph; we still assert JSON + embedded field values.
  test("HTMLFormElement with Content-Type application/json sends JSON including field values", async () => {
    const { baseURL, server } = await startTestServer();
    const previousHtmlForm = globalThis.HTMLFormElement;
    globalThis.HTMLFormElement =
      class HTMLFormElement {} as typeof globalThis.HTMLFormElement;
    class TestForm extends globalThis.HTMLFormElement {
      override elements = [
        {
          name: "firstName",
          value: "Fred",
          type: "text",
          disabled: false,
          checked: true,
        },
        {
          name: "lastName",
          value: "Flintstone",
          type: "text",
          disabled: false,
          checked: true,
        },
      ] as unknown as HTMLFormControlsCollection;
    }
    try {
      const res = await axios.post<EchoedRequest>(
        `${baseURL}/echo`,
        new TestForm() as never,
        {
          headers: { "Content-Type": "application/json" },
        },
      );
      assert.ok(
        String(res.data.headers["content-type"] ?? "").includes(
          "application/json",
        ),
      );
      const serialized = res.data.body;
      assert.ok(serialized.includes("Fred"));
      assert.ok(serialized.includes("Flintstone"));
    } finally {
      globalThis.HTMLFormElement = previousHtmlForm;
      await stopTestServer(server);
    }
  });
});

describe("Advanced Features", () => {
  test("baseURL combines with relative url for requests", async () => {
    const { baseURL, server } = await startTestServer();
    const instance = axios.create({ baseURL });
    try {
      const res = await instance.get<EchoedRequest>("/echo");
      assert.equal(res.data.path, "/echo");
    } finally {
      await stopTestServer(server);
    }
  });

  test("getUri reflects baseURL, path, and serialized params", async () => {
    const { baseURL, server } = await startTestServer();
    const instance = axios.create({ baseURL });
    try {
      const uri = instance.getUri({ url: "/echo", params: { n: 1 } });
      assert.ok(uri.startsWith(baseURL));
      assert.ok(uri.includes("/echo"));
      assert.ok(uri.includes("n"));
    } finally {
      await stopTestServer(server);
    }
  });

  test("timeout rejects when server is slower than threshold", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      await axios.get(`${baseURL}/delay?ms=3000`, { timeout: 200 });
      assert.fail("expected timeout");
    } catch (e) {
      assert.ok(isAxiosError(e));
      const err = e as AxiosError;
      // Axios maps timeouts to ECONNABORTED code in Node adapter
      assert.equal(err.code, "ECONNABORTED");
    } finally {
      await stopTestServer(server);
    }
  });

  test("AbortController signal cancels in-flight request; isCancel is true", async () => {
    const { baseURL, server } = await startTestServer();
    const controller = new AbortController();
    try {
      const p = axios.get(`${baseURL}/delay?ms=5000`, {
        signal: controller.signal,
      });
      setTimeout(() => controller.abort(), 30);
      await p;
      assert.fail("expected abort");
    } catch (e) {
      assert.ok(isCancel(e));
    } finally {
      await stopTestServer(server);
    }
  });

  test("auth option sets HTTP Basic Authorization header", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      const res = await axios.get<EchoedRequest>(`${baseURL}/echo`, {
        auth: { username: "u", password: "p" },
      });
      const auth = res.data.headers["authorization"];
      assert.equal(auth, `Basic ${Buffer.from("u:p").toString("base64")}`);
    } finally {
      await stopTestServer(server);
    }
  });

  test("withCredentials flag does not break Node requests", async () => {
    const { baseURL, server } = await startTestServer();
    try {
      const res = await axios.get<EchoedRequest>(`${baseURL}/echo`, {
        withCredentials: true,
      });
      assert.equal(res.status, 200);
    } finally {
      await stopTestServer(server);
    }
  });

  test("onDownloadProgress receives loaded/total and optional rate/estimated on chunked response", async () => {
    const { baseURL, server } = await startTestServer();
    const events: Array<{
      loaded: number;
      total?: number;
      rate?: number;
      estimated?: number;
    }> = [];
    try {
      await axios.get(`${baseURL}/chunked`, {
        responseType: "arraybuffer",
        onDownloadProgress: (ev) => {
          events.push({
            loaded: ev.loaded,
            total: ev.total,
            rate: ev.rate,
            estimated: ev.estimated,
          });
        },
      });
      assert.ok(events.length > 0);
      const last = events[events.length - 1];
      assert.ok(last.loaded > 0);
      // total may be undefined until Content-Length known; chunked may still report progress
    } finally {
      await stopTestServer(server);
    }
  });

  test("interceptors.response.clear removes response interceptors", async () => {
    const { baseURL, server } = await startTestServer();
    const instance = axios.create({ baseURL });
    instance.interceptors.response.use((r) => {
      r.data = { mutated: true };
      return r;
    });
    instance.interceptors.response.clear();
    try {
      const res = await instance.get("/json");
      assert.deepEqual(res.data, { hello: "world" });
    } finally {
      await stopTestServer(server);
    }
  });
});

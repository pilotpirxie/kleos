/**
 * Kleos — a fetch-based HTTP client with Axios-shaped configuration so apps can migrate or share mental models.
 * This module owns URL building, header merging, body encoding, cancellation, progress hooks, and typed errors end-to-end.
 */
/**
 * Allowed HTTP verbs so TypeScript catches typos before a bad method reaches the network layer.
 */
export type Method =
  | "get"
  | "GET"
  | "delete"
  | "DELETE"
  | "head"
  | "HEAD"
  | "options"
  | "OPTIONS"
  | "post"
  | "POST"
  | "put"
  | "PUT"
  | "patch"
  | "PATCH"
  | "purge"
  | "PURGE"
  | "link"
  | "LINK"
  | "unlink"
  | "UNLINK";
/**
 * How the caller wants the response body decoded so UI and parsers receive the right shape (JSON vs binary vs stream).
 */
export type ResponseType =
  | "arraybuffer"
  | "blob"
  | "document"
  | "json"
  | "text"
  | "stream";
/**
 * Header values the public API accepts before normalization to strings for Fetch headers.
 */
export type KleosHeaderValue = string | number | boolean | undefined | null;
/**
 * Axios-style header buckets (common + per-method) plus ad-hoc keys so teams can share defaults without repeating objects.
 */
export type RawKleosRequestHeaders = {
  common?: Record<string, KleosHeaderValue>;
  get?: Record<string, KleosHeaderValue>;
  post?: Record<string, KleosHeaderValue>;
  put?: Record<string, KleosHeaderValue>;
  patch?: Record<string, KleosHeaderValue>;
  delete?: Record<string, KleosHeaderValue>;
  head?: Record<string, KleosHeaderValue>;
  options?: Record<string, KleosHeaderValue>;
} & Record<
  string,
  KleosHeaderValue | Record<string, KleosHeaderValue> | undefined
>;
/**
 * Username/password pair for HTTP Basic auth when APIs expect a simple credential header.
 */
export interface KleosBasicCredentials {
  username: string;
  password: string;
}
/**
 * Progress payload for upload/download callbacks so UIs can show transfer state without parsing raw streams.
 */
export interface KleosProgressEvent {
  loaded: number;
  total?: number;
  lengthComputable?: boolean;
  progress?: number;
  bytes?: number;
  rate?: number;
  estimated?: number;
  upload?: boolean;
  download?: boolean;
  event?: ProgressEvent;
}
/**
 * Options for turning query objects into strings, including custom serializers for backends with strict query formats.
 */
export interface ParamsSerializerOptions {
  encode?: (param: string) => string;
  serialize?: (
    params: Record<string, unknown>,
    options?: ParamsSerializerOptions,
  ) => string;
  indexes?: boolean | null;
}
/**
 * Controls how plain objects become multipart fields (dots vs brackets, arrays, custom visitor hooks).
 */
export interface FormSerializerOptions {
  visitor?: (
    value: unknown,
    key: string,
    path: string | null,
    helpers: FormSerializerHelpers,
  ) => boolean;
  dots?: boolean;
  metaTokens?: boolean;
  indexes?: boolean | null;
}
/**
 * Hooks exposed to custom form visitors so apps can skip or reshape nested values during multipart builds.
 */
export interface FormSerializerHelpers {
  defaultVisitor: (
    value: unknown,
    key: string,
    path: string | null,
    helpers: FormSerializerHelpers,
  ) => boolean;
  convertValue: (value: unknown) => string | Blob;
  isVisitable: (value: unknown) => boolean;
}
/**
 * Compatibility toggles for JSON parsing and timeout error messaging when migrating from older HTTP clients.
 */
export interface TransitionalOptions {
  silentJSONParsing?: boolean;
  forcedJSONParsing?: boolean;
  clarifyTimeoutError?: boolean;
}
/**
 * Describes an HTTP proxy target for environments that read this shape (parity with similar clients).
 */
export interface KleosProxyConfig {
  protocol?: string;
  host: string;
  port?: number;
  auth?: KleosBasicCredentials;
}
/**
 * Minimal abort surface for older runtimes that are not full AbortSignal instances but still signal cancellation.
 */
export interface GenericAbortSignal {
  readonly aborted: boolean;
  addEventListener?: (type: "abort", listener: () => void) => void;
  removeEventListener?: (type: "abort", listener: () => void) => void;
  reason?: unknown;
  throwIfAborted?: () => void;
}
/**
 * Public request options merged with instance defaults; this is what application code passes per call or at create().
 */
export interface KleosRequestConfig<D = unknown> {
  url?: string;
  method?: Method | string;
  baseURL?: string;
  allowAbsoluteUrls?: boolean;
  transformRequest?: KleosRequestTransformer | KleosRequestTransformer[];
  transformResponse?: KleosResponseTransformer | KleosResponseTransformer[];
  headers?: RawKleosRequestHeaders;
  params?: Record<string, unknown> | URLSearchParams;
  paramsSerializer?:
    | ParamsSerializerOptions
    | ((params: Record<string, unknown>) => string);
  data?: D;
  timeout?: number;
  timeoutErrorMessage?: string;
  withCredentials?: boolean;
  auth?: KleosBasicCredentials | null;
  responseType?: ResponseType;
  responseEncoding?: string;
  xsrfCookieName?: string;
  xsrfHeaderName?: string;
  onUploadProgress?: (progressEvent: KleosProgressEvent) => void;
  onDownloadProgress?: (progressEvent: KleosProgressEvent) => void;
  validateStatus?: ((status: number) => boolean) | null;
  maxRedirects?: number;
  signal?: AbortSignal | GenericAbortSignal;
  decompress?: boolean;
  transitional?: TransitionalOptions;
  env?: {
    FormData?: new () => FormData;
  };
  formSerializer?: FormSerializerOptions;
  adapter?: (config: InternalKleosRequestConfig) => Promise<KleosResponse>;
  fetchOptions?: Omit<RequestInit, "body" | "headers" | "method" | "signal">;
  cancelToken?: CancelToken;
  /** Node/axios parity: max response body size hint (fetch adapter does not enforce). */
  maxContentLength?: number;
  /** Node/axios parity: max request body size hint (fetch adapter does not enforce). */
  maxBodyLength?: number;
  /** Node/axios parity: hook before following a redirect (fetch adapter follows natively when maxRedirects > 0). */
  beforeRedirect?: (
    options: unknown,
    details: { headers: Record<string, string> },
  ) => void;
  /** Node/axios parity: Unix socket path (not used by fetch). */
  socketPath?: string | null;
  /** Node/axios parity: custom transport (not used by fetch). */
  transport?: unknown;
  /** Node/axios parity: custom HTTP agent (not used by fetch). */
  httpAgent?: import("node:http").Agent;
  /** Node/axios parity: custom HTTPS agent (not used by fetch). */
  httpsAgent?: import("node:https").Agent;
  /** Node/axios parity: explicit proxy or false to ignore env proxies (fetch uses platform defaults). */
  proxy?: KleosProxyConfig | false;
  /** Node/axios parity: relaxed HTTP header parsing (Node-only; not applicable to fetch). */
  insecureHTTPParser?: boolean;
  /** Node/axios parity: upload/download rate limits in bytes per second (not enforced by fetch). */
  maxRate?: [number, number];
}
/**
 * Mutates outgoing body/headers before send so apps can encrypt, sign, or reshape payloads once per request.
 * Matches Axios: the last function must return a body type fetch accepts (string, Buffer, FormData, etc.).
 * Config uses an intersection so this type can be declared before InternalKleosRequestConfig without circularity.
 */
export type KleosRequestTransformer = (
  data: unknown,
  headers: Record<string, string>,
  config: KleosRequestConfig & { headers: Record<string, string> },
) => unknown;
/**
 * Mutates parsed response data after the wire read so apps can normalize dates or unwrap API envelopes.
 * Matches Axios: receives response headers and status so parsers can branch on content-type and status.
 */
export type KleosResponseTransformer = (
  data: unknown,
  headers: Record<string, string>,
  status: number,
  config?: KleosRequestConfig,
) => unknown;
/**
 * Fully merged config with normalized string headers used inside dispatch after defaults and flattening run.
 */
export interface InternalKleosRequestConfig<
  D = unknown,
> extends KleosRequestConfig<D> {
  headers: Record<string, string>;
}
/**
 * Successful HTTP result including decoded data and the final config so interceptors and callers can audit what ran.
 */
export interface KleosResponse<T = unknown, D = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: InternalKleosRequestConfig<D>;
  request?: unknown;
}
/**
 * Structured failure carrying request/response context so UIs can branch on status, retry, or show actionable messages.
 */
export interface KleosError<T = unknown, D = unknown> extends Error {
  isKleosError: true;
  code?: string;
  config: InternalKleosRequestConfig<D>;
  request?: unknown;
  response?: KleosResponse<T, D>;
  status?: number;
  cause?: Error;
}
/**
 * Callable client: invoke as a function or use methods, with shared defaults and interceptors for cross-cutting concerns.
 */
export interface KleosInstance extends Kleos {
  <T = unknown, R = KleosResponse<T>, D = unknown>(
    config: KleosRequestConfig<D>,
  ): Promise<R>;
  <T = unknown, R = KleosResponse<T>, D = unknown>(
    url: string,
    config?: KleosRequestConfig<D>,
  ): Promise<R>;
  defaults: KleosRequestConfig;
  interceptors: {
    request: InterceptorManager<InternalKleosRequestConfig>;
    response: InterceptorManager<KleosResponse>;
  };
  getUri(config?: KleosRequestConfig): string;
  request<T = unknown, R = KleosResponse<T>, D = unknown>(
    config: KleosRequestConfig<D>,
  ): Promise<R>;
  get<T = unknown, R = KleosResponse<T>, D = unknown>(
    url: string,
    config?: KleosRequestConfig<D>,
  ): Promise<R>;
  delete<T = unknown, R = KleosResponse<T>, D = unknown>(
    url: string,
    config?: KleosRequestConfig<D>,
  ): Promise<R>;
  head<T = unknown, R = KleosResponse<T>, D = unknown>(
    url: string,
    config?: KleosRequestConfig<D>,
  ): Promise<R>;
  options<T = unknown, R = KleosResponse<T>, D = unknown>(
    url: string,
    config?: KleosRequestConfig<D>,
  ): Promise<R>;
  post<T = unknown, R = KleosResponse<T>, D = unknown>(
    url: string,
    data?: D,
    config?: KleosRequestConfig<D>,
  ): Promise<R>;
  put<T = unknown, R = KleosResponse<T>, D = unknown>(
    url: string,
    data?: D,
    config?: KleosRequestConfig<D>,
  ): Promise<R>;
  patch<T = unknown, R = KleosResponse<T>, D = unknown>(
    url: string,
    data?: D,
    config?: KleosRequestConfig<D>,
  ): Promise<R>;
  postForm<T = unknown, R = KleosResponse<T>, D = unknown>(
    url: string,
    data?: D,
    config?: KleosRequestConfig<D>,
  ): Promise<R>;
  putForm<T = unknown, R = KleosResponse<T>, D = unknown>(
    url: string,
    data?: D,
    config?: KleosRequestConfig<D>,
  ): Promise<R>;
  patchForm<T = unknown, R = KleosResponse<T>, D = unknown>(
    url: string,
    data?: D,
    config?: KleosRequestConfig<D>,
  ): Promise<R>;
}
/**
 * Default export shape: factory helpers (create), error/cancel utilities, and Promise helpers for batch flows.
 */
export interface KleosStatic extends KleosInstance {
  create(config?: KleosRequestConfig): KleosInstance;
  KleosError: typeof KleosError;
  isKleosError: typeof isKleosError;
  CancelToken: typeof CancelToken;
  isCancel: typeof isCancel;
  all: typeof Promise.all;
  spread<T, R>(callback: (...args: T[]) => R): (array: T[]) => R;
}
/**
 * Fine-grained control for interceptor registration (sync vs async, conditional runWhen for specific routes).
 */
export interface KleosInterceptorOptions {
  synchronous?: boolean;
  runWhen?: (config: InternalKleosRequestConfig) => boolean;
}
/**
 * Public contract for registering and removing request/response interceptors on a Kleos instance.
 */
export interface KleosInterceptorManager<V> {
  use(
    onFulfilled?: (value: V) => V | Promise<V>,
    onRejected?: (error: unknown) => unknown,
    options?: KleosInterceptorOptions,
  ): number;
  eject(id: number): void;
  clear(): void;
}
/**
 * Tells whether a value is a browser File without referencing `File` when the global is missing (Node, some workers).
 * If this is wrong, query strings could omit filenames or the runtime could throw during param serialization.
 */
function isKleosFile(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}
/**
 * Tells whether a value is a Blob only when `Blob` exists, so SSR and minimal runtimes stay safe.
 * If this is wrong, binary values may be stringified incorrectly or environments without Blob may crash.
 */
function isKleosBlob(value: unknown): value is Blob {
  return typeof Blob !== "undefined" && value instanceof Blob;
}
/**
 * Supplies the default Accept and per-verb header buckets so JSON APIs work out of the box without each app repeating setup.
 * Missing defaults would force every consumer to re-specify common headers or get unexpected server responses.
 */
function createDefaultHeaders(): RawKleosRequestHeaders {
  // Broad Accept lets typical JSON and text APIs respond without per-route header tweaks
  return {
    common: { Accept: "application/json, text/plain, */*" },
    delete: {},
    get: {},
    head: {},
    post: {},
    put: {},
    patch: {},
  };
}
/**
 * Config keys Axios-style clients deep-merge so instance defaults and per-request options compose without wiping sibling fields.
 * `data` and most other keys must replace wholesale so a new POST body does not inherit nested keys from defaults (Axios contract).
 */
const KLEOS_DEEP_MERGE_KEYS = new Set<string>([
  "headers",
  "auth",
  "proxy",
  "params",
  "transitional",
  "formSerializer",
  "env",
]);
/**
 * True only for plain record objects so URLSearchParams, FormData, Date, and class instances are not deep-merged into broken graphs.
 */
function isPlainConfigObject(value: unknown): boolean {
  if (value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) return false;
  if (
    typeof URLSearchParams !== "undefined" &&
    value instanceof URLSearchParams
  )
    return false;
  if (typeof FormData !== "undefined" && value instanceof FormData)
    return false;
  if (value instanceof Date) return false;
  if (typeof Blob !== "undefined" && value instanceof Blob) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
/**
 * Deep-merges config objects so nested headers and options combine instead of being replaced wholesale.
 * Only Axios-documented deep-merge paths recurse; `data` replaces entirely so request payloads are not corrupted by defaults.
 */
function mergeDeep(
  a: KleosRequestConfig,
  b: Partial<KleosRequestConfig> | undefined,
): KleosRequestConfig {
  // Nothing to merge: keep the existing effective configuration
  if (b === undefined || b === null) return a;
  // Non-plain overrides (arrays, primitives) replace the entire slot to match Axios-like semantics
  if (typeof b !== "object" || Array.isArray(b)) return b as KleosRequestConfig;
  const out: Record<string, unknown> = {
    ...(a as Record<string, unknown>),
  };
  for (const key of Object.keys(b)) {
    const bv = (b as Record<string, unknown>)[key];
    const av = out[key];
    // Recurse only on known buckets (headers, params, …) and only for plain objects so FileList/data stay intact
    const shouldDeepMerge =
      KLEOS_DEEP_MERGE_KEYS.has(key) &&
      isPlainConfigObject(bv) &&
      isPlainConfigObject(av);
    if (shouldDeepMerge) {
      out[key] = mergeDeep(
        av as KleosRequestConfig,
        bv as Partial<KleosRequestConfig>,
      );
    }
    // Explicit undefined from spread sources should not wipe keys; only assign when the override carries a value
    else if (bv !== undefined) {
      out[key] = bv;
    }
  }
  return out as KleosRequestConfig;
}
/**
 * Normalizes the method string for Fetch (uppercase) while defaulting missing values to GET-like behavior.
 * Inconsistent casing would duplicate header buckets and confuse servers that log canonical verbs.
 */
function normalizeMethod(method?: string): string {
  const m = (method ?? "get").toUpperCase();
  return m;
}
/**
 * Decides whether the HTTP verb should carry a body so we do not attach payloads to GET/HEAD by mistake.
 * Sending bodies on non-body methods breaks caches, proxies, and some security policies.
 */
function isBodyMethod(method: string): boolean {
  const m = method.toUpperCase();
  return m === "POST" || m === "PUT" || m === "PATCH" || m === "DELETE";
}
/**
 * Normalizes Axios-style single-or-array transformer registration so one function or a pipeline both work.
 * If this were wrong, apps following axios docs would see skipped or double-applied transforms.
 */
function asArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}
/**
 * Injects the XSRF header from the cookie when the server issued a token and the caller did not override the header.
 * Missing tokens on mutating requests cause preventable 403s; overwriting an explicit header would break custom flows.
 */
function applyXsrfHeaders(config: InternalKleosRequestConfig): void {
  const cookieName = config.xsrfCookieName ?? "XSRF-TOKEN";
  const headerName = config.xsrfHeaderName ?? "X-XSRF-TOKEN";
  // Browsers only: read the framework-issued CSRF cookie so mutating requests match what the server expects
  let token: string | null = null;
  if (typeof document !== "undefined" && document.cookie) {
    const parts = document.cookie.split(";");
    for (const part of parts) {
      const [k, ...rest] = part.trim().split("=");
      // Cookie names and values are often URI-encoded; decode to match how servers set XSRF cookies
      if (k === decodeURIComponent(cookieName)) {
        token = decodeURIComponent(rest.join("="));
        break;
      }
    }
  }
  if (token && !config.headers[headerName]) {
    config.headers[headerName] = token;
  }
}
/**
 * Flattens Axios-style header maps into a single lowercase-key record suitable for Fetch and internal lookups.
 * If this is wrong, per-method defaults leak across verbs or duplicate keys fight during the actual request.
 */
function flattenHeaders(
  headers: RawKleosRequestHeaders | undefined,
  method: string,
): Record<string, string> {
  const out: Record<string, string> = {};
  // No headers object means “no extra headers” rather than an error state
  if (!headers) return out;
  const m = method.toLowerCase();
  const headerRecord = headers as unknown as Record<
    string,
    Record<string, KleosHeaderValue> | undefined
  >;
  const buckets: (Record<string, KleosHeaderValue> | undefined)[] = [
    headers.common,
    headerRecord[m],
  ];
  for (const bucket of buckets) {
    if (!bucket) continue;
    for (const [k, v] of Object.entries(bucket)) {
      if (v === undefined || v === null) continue;
      // Lowercase keys mirror Fetch’s combined header map and avoid duplicate Content-Type variants
      out[k.toLowerCase()] = String(v);
    }
  }
  for (const [k, v] of Object.entries(headers)) {
    // Skip structural buckets already merged above so we do not treat them as literal header names
    if (
      k === "common" ||
      k === "get" ||
      k === "post" ||
      k === "put" ||
      k === "patch" ||
      k === "delete" ||
      k === "head" ||
      k === "options"
    ) {
      continue;
    }
    if (v === undefined || v === null) continue;
    // Nested objects belong to buckets only; ignore stray object values in the loose index signature
    if (typeof v === "object") continue;
    out[k.toLowerCase()] = String(v);
  }
  return out;
}
/**
 * Encodes a single query key segment with optional custom encoding for backends that restrict characters.
 */
function encodeKeyPart(key: string, encode?: (s: string) => string): string {
  const enc = encode ?? encodeURIComponent;
  return enc(key);
}
/**
 * Serializes a params object into application/x-www-form-urlencoded query semantics with optional array indexing rules.
 * Incorrect serialization breaks filtered lists, pagination, and nested filters that APIs encode as bracketed keys.
 */
function serializeParamsObject(
  params: Record<string, unknown>,
  options?: ParamsSerializerOptions,
): string {
  // Custom serializers win so enterprises can match legacy query encodings exactly
  if (options?.serialize) {
    return options.serialize(params, options);
  }
  const indexes = options?.indexes;
  const encode = options?.encode ?? encodeURIComponent;
  const search = new URLSearchParams();
  function append(path: string, value: unknown): void {
    // Skip nullish entries so optional filters do not pollute URLs with empty keys
    if (value === null || value === undefined) return;
    // Dates are universally compared as ISO strings in query APIs
    if (typeof value === "object" && value instanceof Date) {
      search.append(path, value.toISOString());
      return;
    }
    // File inputs in query objects should surface a stable, human-readable filename for logs and servers that accept names only
    if (isKleosFile(value)) {
      search.append(path, value.name);
      return;
    }
    // Blob values cannot be turned into a literal query value; a placeholder keeps serialization from throwing and matches common client behavior
    if (isKleosBlob(value)) {
      search.append(path, "[object Blob]");
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        let key: string;
        // Indexed arrays match servers expecting explicit positions (e.g. legacy PHP-style keys)
        if (indexes === true) {
          key = `${path}[${i}]`;
        }
        // Repeated keys without brackets suit APIs that collapse duplicates into arrays server-side
        else if (indexes === null) {
          key = path;
        }
        // Bracketed arrays are the default for Rails/Express style param parsers
        else {
          key = `${path}[]`;
        }
        append(key, item);
      });
      return;
    }
    if (typeof value === "object" && value !== null) {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        const next = `${path}[${encodeKeyPart(k, encode)}]`;
        append(next, v);
      }
      return;
    }
    search.append(path, String(value));
  }
  for (const [k, v] of Object.entries(params)) {
    append(encodeKeyPart(k, encode), v);
  }
  return search.toString();
}
/**
 * Dispatches between raw URLSearchParams, custom serializers, and the default object serializer for query strings.
 */
function serializeParams(
  params: Record<string, unknown> | URLSearchParams | undefined,
  paramsSerializer?: KleosRequestConfig["paramsSerializer"],
): string {
  if (params === undefined || params === null) return "";
  if (params instanceof URLSearchParams) return params.toString();
  if (typeof paramsSerializer === "function") {
    return paramsSerializer(params as Record<string, unknown>);
  }
  return serializeParamsObject(
    params as Record<string, unknown>,
    paramsSerializer,
  );
}
/**
 * Builds the final request URL including query string while preserving hash fragments for client-side routers.
 * Exported for callers who need preview links or cache keys without sending the request yet.
 */
export function buildURL(config: InternalKleosRequestConfig): string {
  const {
    url = "",
    baseURL,
    allowAbsoluteUrls,
    params,
    paramsSerializer,
  } = config;
  // Teams using baseURL must not break absolute URLs unless allowAbsoluteUrls forces prepending (Axios contract)
  const isAbsolute = /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
  let path = url;
  if (baseURL && (!isAbsolute || allowAbsoluteUrls === false)) {
    const base = baseURL.replace(/\/+$/, "");
    const rel = url.replace(/^\/+/, "");
    path = base ? `${base}/${rel}` : rel;
  }
  const qs = serializeParams(
    params as Record<string, unknown> | URLSearchParams | undefined,
    paramsSerializer,
  );
  if (!qs) return path;
  const hashIndex = path.indexOf("#");
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : "";
  const pathNoHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  // Preserve existing query pairs when appending serialized params so deep links keep prior filters
  const joiner = pathNoHash.includes("?") ? "&" : "?";
  return `${pathNoHash}${joiner}${qs}${hash}`;
}
/**
 * Coerces arbitrary values into FormData-safe parts while preserving binary types the browser must not stringify.
 */
function convertFormValue(value: unknown): string | Blob {
  // Preserve binary bodies as-is so multipart uploads stay intact for the server
  if (isKleosBlob(value)) return value;
  // Files are Blobs with a name; keep them raw so the browser sets filename metadata on the wire
  if (isKleosFile(value)) return value;
  // Scalar and missing fields become empty or string form parts so backends always receive text-safe entries
  return value === null || value === undefined ? "" : String(value);
}
/**
 * Determines whether nested object traversal should continue for multipart serialization.
 */
function isVisitable(value: unknown): boolean {
  // Nullish leaves nothing to recurse into for nested form field names
  if (value === null || value === undefined) return false;
  if (typeof value === "object") {
    // Dates are serialized as single values, not walked like plain objects
    if (value instanceof Date) return false;
    // Files and blobs are appended directly, not expanded as nested key paths
    if (isKleosFile(value)) return false;
    if (isKleosBlob(value)) return false;
    // Plain objects and arrays need recursive visitation to match server-side bracket notation expectations
    return true;
  }
  return false;
}
/**
 * Recursively appends fields to FormData following Axios-like bracket/dot rules and custom visitor hooks.
 * Wrong traversal duplicates keys, drops files, or produces names the backend cannot parse into structured data.
 */
function defaultFormVisitor(
  value: unknown,
  key: string,
  path: string | null,
  helpers: FormSerializerHelpers,
  options: FormSerializerOptions,
  form: FormData,
): boolean {
  const metaTokens = options.metaTokens !== false;
  const indexes = options.indexes;
  const useDots = options.dots === true;
  const buildKey = (segment: string): string => {
    if (path === null) return segment;
    return useDots ? `${path}.${segment}` : `${path}[${segment}]`;
  };
  // Keys ending with {} request JSON serialization for nested graphs some APIs ingest as a single field
  if (key.endsWith("{}") && metaTokens && isVisitable(value)) {
    form.append(key, JSON.stringify(value));
    return false;
  }
  // Explicit [] suffix means repeat the same field name for each array element (HTML form semantics)
  if (key.endsWith("[]") && Array.isArray(value)) {
    for (const item of value) {
      form.append(key, convertFormValue(item) as string | Blob);
    }
    return false;
  }
  // <input multiple> style file lists must expand to multiple parts under a conventional array-like name
  if (typeof FileList !== "undefined" && value instanceof FileList) {
    const fieldKey = key.endsWith("[]") ? key : `${key}[]`;
    for (let i = 0; i < value.length; i++) {
      form.append(fieldKey, value[i]!);
    }
    return false;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => {
      let k: string;
      if (indexes === true) {
        k = buildKey(String(i));
      } else if (indexes === null) {
        k = useDots ? `${path}.${key}` : `${path}[${key}]`;
      } else {
        k = useDots ? `${path}.${key}[]` : `${path}[${key}][]`;
      }
      if (indexes === null) {
        const flatKey = path === null ? key : `${path}[${key}]`;
        form.append(flatKey, convertFormValue(item) as string | Blob);
      } else {
        defaultFormVisitor(item, k, null, helpers, options, form);
      }
    });
    if (indexes === null) return false;
    return false;
  }
  if (isVisitable(value)) {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const nextPath = path === null ? k : buildKey(k);
      // Custom visitor may skip or replace default handling for sensitive or computed fields
      if (options.visitor?.(v, k, nextPath, helpers)) {
        continue;
      }
      defaultFormVisitor(
        v,
        k,
        path === null ? k : buildKey(k),
        helpers,
        options,
        form,
      );
    }
    return false;
  }
  // Leaf scalar (or already-normalized) value becomes a single named part in the multipart body
  const field =
    path === null
      ? key
      : useDots && path
        ? `${path}.${key}`
        : `${path}[${key}]`;
  form.append(field, convertFormValue(value) as string | Blob);
  return false;
}
/**
 * Converts a plain object into FormData using the shared visitor so object payloads can be sent as multipart uploads.
 * Throws early when FormData is unavailable so failures happen before a doomed network attempt.
 */
function objectToFormData(
  data: Record<string, unknown>,
  options?: FormSerializerOptions,
  FormDataRef?: new () => FormData,
): FormData {
  const FormDataCtor =
    FormDataRef ??
    ((typeof globalThis !== "undefined" && globalThis.FormData) ||
      (typeof FormData !== "undefined" ? FormData : undefined));
  if (!FormDataCtor) {
    throw new TypeError("FormData is not available in this environment");
  }
  const form = new FormDataCtor();
  const opts: FormSerializerOptions = {
    metaTokens: true,
    indexes: false,
    ...options,
  };
  const helpers: FormSerializerHelpers = {
    defaultVisitor: (v, k, p, h) => {
      defaultFormVisitor(v, k, p, h, opts, form);
      return false;
    },
    convertValue: convertFormValue,
    isVisitable,
  };
  for (const [k, v] of Object.entries(data)) {
    // Top-level visitor short-circuit lets apps strip read-only or derived properties before append
    if (opts.visitor?.(v, k, k, helpers)) continue;
    defaultFormVisitor(v, k, null, helpers, opts, form);
  }
  return form;
}
/**
 * Finds an existing Content-Type header case-insensitively because callers may set mixed-case keys.
 */
function getContentType(headers: Record<string, string>): string | undefined {
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === "content-type") return v;
  }
  return undefined;
}
/**
 * Sets Content-Type only when absent so explicit caller headers or multipart boundaries are never clobbered.
 */
function setContentType(headers: Record<string, string>, value: string): void {
  if (!getContentType(headers)) {
    headers["content-type"] = value;
  }
}
/**
 * Serializes a plain object body to JSON, urlencoded, or multipart according to Content-Type so servers receive the encoding they expect.
 * Shared between HTML-form flattening and object POSTs so both paths stay aligned with Axios automatic serialization docs.
 */
function serializeObjectPayload(
  record: Record<string, unknown>,
  headers: Record<string, string>,
  config: InternalKleosRequestConfig,
): BodyInit {
  const ct = getContentType(headers)?.toLowerCase() ?? "";
  // Multipart object graphs need a boundary from the runtime; strip a literal multipart header so fetch can inject it
  if (ct.includes("multipart/form-data")) {
    const fd = objectToFormData(
      record,
      config.formSerializer,
      config.env?.FormData as (new () => FormData) | undefined,
    );
    delete headers["content-type"];
    return fd;
  }
  // URL-encoded APIs expect bracketed keys; reuse query serialization so nested objects match backend parsers
  if (ct.includes("application/x-www-form-urlencoded")) {
    setContentType(headers, "application/x-www-form-urlencoded;charset=utf-8");
    return serializeParamsObject(record, { indexes: false });
  }
  // Default JSON is what most REST APIs expect when no explicit encoding is chosen
  setContentType(headers, "application/json;charset=utf-8");
  return JSON.stringify(record);
}
/**
 * Default Axios-style request transform: turns `data` into a fetch body and sets Content-Type when appropriate.
 * Replacing `transformRequest` entirely lets callers bypass this pipeline the same way Axios allows custom adapters/transforms.
 */
function defaultTransformRequest(
  data: unknown,
  headers: Record<string, string>,
  config: InternalKleosRequestConfig,
): unknown {
  const m = normalizeMethod(config.method);
  // Read-only methods must not send entity bodies; mis-sent bodies break caches and some proxies
  if (!isBodyMethod(m)) {
    return data;
  }
  if (data === undefined || data === null) {
    return data;
  }
  const ct = getContentType(headers)?.toLowerCase() ?? "";
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    // Fetch must set multipart boundaries; removing Content-Type lets the runtime inject the correct boundary value
    delete headers["content-type"];
    return data;
  }
  if (
    typeof URLSearchParams !== "undefined" &&
    data instanceof URLSearchParams
  ) {
    setContentType(headers, "application/x-www-form-urlencoded;charset=utf-8");
    return data.toString();
  }
  // Axios postForm(FileList) sends every file under files[]; callers rely on that for multi-file uploads without manual FormData
  if (typeof FileList !== "undefined" && data instanceof FileList) {
    const FormDataCtor =
      config.env?.FormData ??
      (typeof globalThis !== "undefined" && globalThis.FormData) ??
      (typeof FormData !== "undefined" ? FormData : undefined);
    if (!FormDataCtor) {
      throw new TypeError("FormData is not available in this environment");
    }
    const fd = new FormDataCtor();
    for (let i = 0; i < data.length; i++) {
      fd.append("files[]", data[i]!);
    }
    delete headers["content-type"];
    return fd;
  }
  // Axios lets apps post a real HTML form as JSON or encoded bodies when Content-Type is set (browser migration path)
  if (
    typeof HTMLFormElement !== "undefined" &&
    data instanceof HTMLFormElement
  ) {
    const form = data;
    const plainFromForm = (): Record<string, string> => {
      const out: Record<string, string> = {};
      let filled = false;
      if (typeof FormData !== "undefined") {
        try {
          const fd = new FormData(form);
          fd.forEach((value, key) => {
            if (typeof value === "string") {
              out[key] = value;
            } else {
              // File inputs are named but not JSON-safe; omit from JSON/urlencoded shapes
              out[key] = isKleosFile(value) ? value.name : String(value);
            }
          });
          filled = true;
        } catch {
          filled = false;
        }
      }
      if (!filled) {
        const elements = (
          form as unknown as {
            elements?: ArrayLike<{
              name?: string;
              value?: string;
              type?: string;
              checked?: boolean;
              disabled?: boolean;
            }>;
          }
        ).elements;
        if (elements) {
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i]!;
            const name = el.name;
            if (!name || el.disabled) continue;
            const type = (el.type ?? "").toLowerCase();
            if (type === "file") continue;
            if (type === "checkbox" || type === "radio") {
              if (el.checked) out[name] = el.value ?? "";
            } else {
              out[name] = el.value ?? "";
            }
          }
        }
      }
      return out;
    };
    const plain = plainFromForm();
    if (ct.includes("multipart/form-data")) {
      if (typeof FormData !== "undefined") {
        try {
          const fd = new FormData(form);
          delete headers["content-type"];
          return fd;
        } catch {
          /* fall through to object-based multipart */
        }
      }
      return serializeObjectPayload(
        plain as Record<string, unknown>,
        headers,
        config,
      );
    }
    return serializeObjectPayload(
      plain as Record<string, unknown>,
      headers,
      config,
    );
  }
  if (typeof data === "string") {
    return data;
  }
  if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
    return data as BodyInit;
  }
  if (isKleosBlob(data)) {
    return data;
  }
  if (typeof ReadableStream !== "undefined" && data instanceof ReadableStream) {
    return data as BodyInit;
  }
  if (typeof data === "object") {
    return serializeObjectPayload(
      data as Record<string, unknown>,
      headers,
      config,
    );
  }
  return String(data);
}
/**
 * Default Axios-style response transform: parses JSON when responseType is json and transitional rules allow it.
 * Runs as the first transformResponse step so custom transforms receive parsed objects when the server sent JSON.
 */
function defaultTransformResponse(
  data: unknown,
  headers: Record<string, string>,
  _status: number,
  config?: KleosRequestConfig,
): unknown {
  // Request config may be omitted in typings; treat as empty so defaults match plain axios transform calls
  const cfg: KleosRequestConfig = config ?? {};
  const rt = cfg.responseType ?? "json";
  const transitional = cfg.transitional ?? {};
  if (rt !== "json") {
    return data;
  }
  if (typeof data !== "string") {
    return data;
  }
  const text = data;
  const contentType = headers["content-type"] ?? "";
  const jsonish = /json|\+json/i.test(contentType);
  // Only JSON-parse when there is a body and JSON is plausible (axios-like); empty bodies stay as "" for HEAD/204 parity.
  const shouldTryJsonParse =
    text.length > 0 && (jsonish || transitional.forcedJSONParsing !== false);
  if (shouldTryJsonParse) {
    try {
      return JSON.parse(text);
    } catch (e) {
      // Wrong content-type but valid text (e.g. text/plain error bodies) returns raw string when silent.
      if (transitional.silentJSONParsing) {
        return text;
      }
      throw e;
    }
  }
  return text;
}
/**
 * Produces the library baseline config merged with optional factory overrides so new instances behave predictably.
 * Wrong defaults break auth cookies, redirects, JSON assumptions, and timeout semantics across every request on that instance.
 */
function libraryDefaults(overrides?: KleosRequestConfig): KleosRequestConfig {
  const base: KleosRequestConfig = {
    // Safe read default for cacheable fetches when callers omit an explicit verb
    method: "get",
    // Zero means “no artificial timeout” unless the caller opts in, matching common HTTP client expectations
    timeout: 0,
    headers: createDefaultHeaders(),
    transitional: {
      // Avoid throwing on slightly malformed JSON from legacy backends during migrations
      silentJSONParsing: true,
      // Still try JSON when content-type hints JSON so most REST APIs deserialize automatically
      forcedJSONParsing: true,
      // Keep timeout vs user-abort codes distinct only when apps enable stricter compatibility
      clarifyTimeoutError: false,
    },
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",
    // Treat only 2xx as success by default so error handlers run for 4xx/5xx unless overridden
    validateStatus: (status: number) => status >= 200 && status < 300,
    allowAbsoluteUrls: true,
    maxRedirects: 21,
    decompress: true,
    // Axios runs default request serialization in transformRequest; overriding the array replaces this entirely
    transformRequest: [defaultTransformRequest],
    // Axios runs default JSON parsing in transformResponse; overriding the array replaces this entirely
    transformResponse: [defaultTransformResponse],
  };
  return mergeDeep(base, overrides);
}
/**
 * Applies request transformers in order so middleware can mutate outgoing payloads and headers consistently.
 * Axios only runs these for methods that may carry a body; running them on GET would wrongly mutate read-only requests.
 */
function applyTransformRequest(
  config: InternalKleosRequestConfig,
): InternalKleosRequestConfig {
  const transforms = config.transformRequest;
  if (!transforms) return config;
  const method = normalizeMethod(config.method);
  if (!isBodyMethod(method)) return config;
  const list = asArray(transforms);
  let data = config.data;
  for (const fn of list) {
    // Each transformer sees the latest payload so signing/encryption layers compose in registration order
    data = fn(data, config.headers, config) as typeof data;
  }
  return { ...config, data };
}
/**
 * Reads the raw Response body by responseType (string for json); defaultTransformResponse applies JSON + transitional rules next.
 * Wrong shape here breaks binary downloads and leaves transformResponse chains with the wrong input type.
 */
async function parseResponseData(
  response: Response,
  config: InternalKleosRequestConfig,
): Promise<unknown> {
  const rt = config.responseType ?? "json";
  // Stream consumers manage backpressure themselves (e.g. SSE, large downloads) without buffering entire bodies
  if (rt === "stream") {
    return response.body;
  }
  if (rt === "blob") {
    return response.blob();
  }
  if (rt === "arraybuffer") {
    return response.arrayBuffer();
  }
  if (rt === "text") {
    return response.text();
  }
  if (rt === "document") {
    const text = await response.text();
    if (typeof DOMParser !== "undefined") {
      const parser = new DOMParser();
      const ct = response.headers.get("content-type") ?? "text/html";
      const mime: DOMParserSupportedType = ct.includes("xml")
        ? "application/xml"
        : "text/html";
      return parser.parseFromString(text, mime);
    }
    // Without DOMParser (SSR), fall back to raw text so callers can still inspect HTML/XML payloads
    return text;
  }
  // responseType json: return raw text; defaultTransformResponse (Axios pipeline) performs JSON.parse + transitional rules
  return response.text();
}
/**
 * Normalizes Fetch Headers into a plain lowercase-key map matching KleosResponse.headers expectations.
 */
function headersToObject(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key.toLowerCase()] = value;
  });
  return out;
}
/**
 * Returns an already-aborted signal so fetch fails immediately when cancellation is known before the request starts.
 * Duplicated controller setup would make timeout and cancel paths harder to reason about and audit.
 */
function createAbortedSignal(): AbortSignal {
  const dead = new AbortController();
  dead.abort();
  return dead.signal;
}
/**
 * Combines user abort, timeout, and legacy cancel tokens into one signal Fetch can observe, plus cleanup for bridges.
 * Leaked listeners or missing timeout aborts cause hung UI states or duplicate in-flight requests after navigation.
 */
function composeAbortSignals(
  userSignal: AbortSignal | GenericAbortSignal | undefined,
  timeoutMs: number,
  cancelToken?: CancelToken,
): {
  signal: AbortSignal | undefined;
  cleanup: () => void;
} {
  // Already-cancelled tokens should abort immediately without registering new listeners
  if (cancelToken?.reason) {
    return { signal: createAbortedSignal(), cleanup: () => {} };
  }
  const cleanups: (() => void)[] = [];
  const childSignals: AbortSignal[] = [];
  if (userSignal) {
    if (userSignal.aborted) {
      return { signal: createAbortedSignal(), cleanup: () => {} };
    }
    if (typeof AbortSignal !== "undefined") {
      const asUser = userSignal as AbortSignal;
      if (asUser instanceof AbortSignal) {
        childSignals.push(asUser);
      } else if (typeof userSignal.addEventListener === "function") {
        const bridge = new AbortController();
        const onAbort = (): void => bridge.abort();
        userSignal.addEventListener!("abort", onAbort);
        cleanups.push(() => userSignal.removeEventListener?.("abort", onAbort));
        childSignals.push(bridge.signal);
      }
    }
  }
  if (timeoutMs > 0) {
    const as = AbortSignal as typeof AbortSignal & {
      timeout?: (ms: number) => AbortSignal;
    };
    if (typeof as.timeout === "function") {
      childSignals.push(as.timeout(timeoutMs));
    } else {
      const tc = new AbortController();
      const id = setTimeout(() => tc.abort(), timeoutMs);
      cleanups.push(() => clearTimeout(id));
      childSignals.push(tc.signal);
    }
  }
  if (cancelToken) {
    const bridge = new AbortController();
    void cancelToken.promise.then(() => bridge.abort());
    childSignals.push(bridge.signal);
  }
  const cleanup = (): void => {
    for (const c of cleanups) c();
  };
  if (childSignals.length === 0) {
    return { signal: undefined, cleanup };
  }
  if (childSignals.length === 1) {
    return { signal: childSignals[0]!, cleanup };
  }
  const combined = new AbortController();
  const onAnyAbort = (): void => combined.abort();
  for (const s of childSignals) {
    if (s.aborted) {
      combined.abort();
      break;
    }
    s.addEventListener("abort", onAnyAbort);
    cleanups.push(() => s.removeEventListener("abort", onAnyAbort));
  }
  return { signal: combined.signal, cleanup };
}
/**
 * Best-effort upload progress for string bodies where Fetch does not stream measurement; keeps progress UI from being empty.
 */
function maybeReportUploadProgress(
  config: InternalKleosRequestConfig,
  body: BodyInit | null | undefined,
): void {
  const cb = config.onUploadProgress;
  if (!cb || body === undefined || body === null) return;
  if (typeof body === "string") {
    const len = new TextEncoder().encode(body).length;
    cb({
      loaded: len,
      total: len,
      lengthComputable: true,
      progress: 1,
      bytes: len,
      upload: true,
    });
  }
}
/**
 * Streams the download through a reader to emit progress, then rehydrates a Response for normal parsing.
 * Skips streaming when no callback or body exists so typical JSON responses stay on the fast path.
 */
async function readBodyWithDownloadProgress(
  response: Response,
  config: InternalKleosRequestConfig,
): Promise<unknown> {
  if (!config.onDownloadProgress || !response.body) {
    return parseResponseData(response, config);
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  const total = Number(response.headers.get("content-length")) || undefined;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      // Accumulate size for progress ratio and final buffer reconstruction identical to a single read()
      loaded += value.byteLength;
      config.onDownloadProgress({
        loaded,
        total,
        lengthComputable: total !== undefined,
        progress: total ? loaded / total : undefined,
        bytes: value.byteLength,
        download: true,
      });
      chunks.push(value);
    }
  }
  const all = new Uint8Array(loaded);
  let offset = 0;
  for (const c of chunks) {
    all.set(c, offset);
    offset += c.byteLength;
  }
  const blob = new Blob([all]);
  // Re-wrap as Response so parseResponseData can reuse JSON/blob/text branches unchanged after streaming
  const cloned = new Response(blob, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
  return parseResponseData(cloned, config);
}
/**
 * Maps low-level fetch/abort errors to stable Kleos error codes apps can branch on for retries and messaging.
 */
function toKleosCode(err: unknown, clarifyTimeout?: boolean): string {
  if (err instanceof DOMException && err.name === "AbortError") {
    return clarifyTimeout ? "ETIMEDOUT" : "ECONNABORTED";
  }
  if (err instanceof Error) {
    if (err.message.includes("aborted")) {
      return clarifyTimeout ? "ETIMEDOUT" : "ECONNABORTED";
    }
  }
  return "ERR_NETWORK";
}
/**
 * Application-facing error with enough context to debug failed calls without losing the original request/response.
 */
export class KleosError<T = unknown, D = unknown>
  extends Error
  implements KleosError<T, D>
{
  isKleosError = true as const;
  code?: string;
  config: InternalKleosRequestConfig<D>;
  request?: unknown;
  response?: KleosResponse<T, D>;
  status?: number;
  cause?: Error;
  constructor(
    message: string,
    code: string | undefined,
    config: InternalKleosRequestConfig<D>,
    request?: unknown,
    response?: KleosResponse<T, D>,
  ) {
    super(message);
    this.name = "KleosError";
    this.code = code;
    this.config = config;
    this.request = request;
    this.response = response;
    this.status = response?.status;
    const Err = Error as unknown as {
      captureStackTrace?: (e: Error, ctor: unknown) => void;
    };
    // V8 stack traces are clearer when the constructor is pinned to KleosError for log grouping
    if (typeof Err.captureStackTrace === "function") {
      Err.captureStackTrace(this, KleosError);
    }
  }
  /**
   * Serializable snapshot for logging/telemetry pipelines that must not execute arbitrary code while stringifying errors.
   */
  toJSON(): object {
    return {
      message: this.message,
      name: this.name,
      stack: this.stack,
      config: this.config,
      code: this.code,
      status: this.status,
    };
  }
}
/**
 * Type guard so catch blocks can distinguish Kleos failures from validation bugs or third-party errors.
 */
export function isKleosError<T = unknown, D = unknown>(
  payload: unknown,
): payload is KleosError<T, D> {
  return (
    typeof payload === "object" &&
    payload !== null &&
    (payload as KleosError).isKleosError === true
  );
}
/**
 * Legacy cancellation bridge: resolves a promise when cancel() runs so older code can race against fetch.
 */
export class CancelToken {
  promise: Promise<Cancel>;
  reason?: Cancel;
  private _resolve!: (c: Cancel) => void;
  constructor(executor: (cancel: (message?: string) => void) => void) {
    this.promise = new Promise((resolve) => {
      this._resolve = resolve;
    });
    executor((message) => {
      const c = new Cancel(message ?? "canceled");
      this.reason = c;
      this._resolve(c);
    });
  }
  /**
   * Factory for the common { token, cancel } pair so components can pass the token inward and keep cancel local.
   */
  static source(): CancelTokenSource {
    let cancel!: (message?: string) => void;
    const token = new CancelToken((c) => {
      cancel = c;
    });
    return { token, cancel };
  }
}
/**
 * Lightweight cancel reason object carried through CancelToken.promise for instanceof checks.
 */
export class Cancel {
  message: string;
  constructor(message: string) {
    this.message = message;
  }
}
/**
 * Bundle returned by CancelToken.source() for ergonomic wiring in React effects and similar lifecycles.
 */
export interface CancelTokenSource {
  token: CancelToken;
  cancel: (message?: string) => void;
}
/**
 * Distinguishes intentional cancellation from real failures when both surface as promise rejections.
 */
export function isCancel(value: unknown): boolean {
  return value instanceof Cancel;
}
type InterceptorHandler<V> = {
  fulfilled?: (value: V) => V | Promise<V>;
  rejected?: (error: unknown) => unknown;
  synchronous?: boolean;
  runWhen?: (config: InternalKleosRequestConfig) => boolean;
};
/**
 * Ordered list of interceptors with eject slots set to null so IDs remain stable after removal.
 */
export class InterceptorManager<V> implements KleosInterceptorManager<V> {
  readonly _handlers: (InterceptorHandler<V> | null)[] = [];
  /**
   * Registers a handler pair and returns an id for eject(); order matches registration for deterministic cross-cutting behavior.
   */
  use(
    onFulfilled?: (value: V) => V | Promise<V>,
    onRejected?: (error: unknown) => unknown,
    options?: KleosInterceptorOptions,
  ): number {
    this._handlers.push({
      fulfilled: onFulfilled,
      rejected: onRejected,
      synchronous: options?.synchronous,
      runWhen: options?.runWhen as
        | ((config: InternalKleosRequestConfig) => boolean)
        | undefined,
    });
    return this._handlers.length - 1;
  }
  /**
   * Soft-removes a handler by slot so later eject indices remain valid and forEach skips removed entries.
   */
  eject(id: number): void {
    if (this._handlers[id]) {
      this._handlers[id] = null;
    }
  }
  /**
   * Wipes all interceptors when reconfiguring a client for a new tenant or tearing down test doubles.
   */
  clear(): void {
    this._handlers.length = 0;
  }
  /**
   * Internal iterator honoring runWhen gates so conditional interceptors do not run on unrelated routes.
   */
  forEach(
    fn: (h: InterceptorHandler<V>) => void,
    config?: InternalKleosRequestConfig,
  ): void {
    for (const h of this._handlers) {
      if (!h) continue;
      if (config && h.runWhen && !h.runWhen(config)) continue;
      fn(h);
    }
  }
}
/**
 * Merges instance defaults with per-request config and materializes headers + Basic auth the dispatcher will use.
 * Callers rely on this single merge point so retries and interceptors see the same effective URL, headers, and auth the user intended.
 */
function mergeConfig(
  defaults: KleosRequestConfig,
  config: KleosRequestConfig,
): InternalKleosRequestConfig {
  const merged = mergeDeep(defaults, config) as KleosRequestConfig;
  const method = normalizeMethod(merged.method);
  const flat = flattenHeaders(merged.headers, method);
  const headers = { ...flat };
  // auth: null means “do not apply instance basic auth”; it must not strip a Bearer or custom Authorization the app set
  if (merged.auth && merged.auth.username !== undefined) {
    const { username, password } = merged.auth;
    const credentialString = `${username}:${password ?? ""}`;
    let token: string;
    if (typeof globalThis.btoa === "function") {
      const bytes = new TextEncoder().encode(credentialString);
      let binary = "";
      const chunk = 0x8000;
      // Chunk conversion avoids call stack limits on very long credentials while preserving UTF-8 semantics
      for (let i = 0; i < bytes.length; i += chunk) {
        const sub = bytes.subarray(i, i + chunk);
        binary += String.fromCharCode(...sub);
      }
      token = globalThis.btoa(binary);
    } else if (typeof Buffer !== "undefined") {
      // Node runtimes without btoa still need RFC 7617 Basic tokens for internal APIs
      token = Buffer.from(credentialString, "utf8").toString("base64");
    } else {
      throw new Error("btoa is not available in this environment");
    }
    // Basic auth header is expected by many internal APIs; undefined password still yields a valid RFC 7617 string
    headers["authorization"] = `Basic ${token}`;
  }
  return { ...merged, method, headers } as InternalKleosRequestConfig;
}
/**
 * Performs the actual fetch: transforms body, merges abort signals, handles errors, parses response, validates status.
 */
async function dispatchRequest(
  config: InternalKleosRequestConfig,
): Promise<KleosResponse> {
  applyXsrfHeaders(config);
  let working = applyTransformRequest(config);
  // After transformRequest, data is the wire body (string, FormData, Buffer, etc.) per Axios contract
  const body = working.data as BodyInit | null | undefined;
  const url = buildURL(working);
  const method = normalizeMethod(working.method);
  const timeout = working.timeout ?? 0;
  const { signal, cleanup } = composeAbortSignals(
    working.signal as AbortSignal | undefined,
    timeout,
    working.cancelToken,
  );
  maybeReportUploadProgress(working, body ?? undefined);
  // maxRedirects === 0 opts out of automatic redirect following so callers can handle 3xx manually
  const redirect =
    working.maxRedirects === 0
      ? ("manual" as RequestRedirect)
      : ("follow" as RequestRedirect);
  const init: RequestInit = {
    method,
    headers: working.headers,
    body: body === undefined || body === null ? undefined : body,
    ...(signal !== undefined ? { signal } : {}),
    credentials: working.withCredentials ? "include" : "same-origin",
    redirect,
    ...working.fetchOptions,
  };
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (err) {
    cleanup();
    // Legacy cancel token: reject with the same Cancel instance axios users expect for isCancel().
    if (working.cancelToken?.reason instanceof Cancel) {
      throw working.cancelToken.reason;
    }
    const isAbortError =
      (err instanceof DOMException && err.name === "AbortError") ||
      (err instanceof Error && err.message.includes("aborted"));
    if (isAbortError) {
      const userSig = working.signal;
      if (userSig?.aborted) {
        const message =
          typeof AbortSignal !== "undefined" &&
          userSig instanceof AbortSignal &&
          userSig.reason !== undefined &&
          userSig.reason !== null
            ? String(userSig.reason)
            : "canceled";
        throw new Cancel(message);
      }
    }
    const code = toKleosCode(
      err,
      working.transitional?.clarifyTimeoutError === true,
    );
    const msg =
      code === "ETIMEDOUT" || code === "ECONNABORTED"
        ? (working.timeoutErrorMessage ??
          "timeout of " + timeout + "ms exceeded")
        : "Network Error";
    throw new KleosError(msg, code, working, { kind: "fetch" }, undefined);
  } finally {
    cleanup();
  }
  const responseHeaders = headersToObject(response.headers);
  let data: unknown;
  if (
    working.onDownloadProgress &&
    response.body &&
    working.responseType !== "stream"
  ) {
    data = await readBodyWithDownloadProgress(response, working);
  } else {
    data = await parseResponseData(response, working);
  }
  const transforms = working.transformResponse;
  if (transforms) {
    const list = asArray(transforms);
    // Axios applies transformResponse in array order so each step sees the previous step’s output
    for (let i = 0; i < list.length; i++) {
      data = list[i]!(data, responseHeaders, response.status, working);
    }
  }
  const kleosResponse: KleosResponse = {
    data,
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
    config: working,
    request: { kind: "fetch", url },
  };
  const validate =
    working.validateStatus ?? ((s: number) => s >= 200 && s < 300);
  if (validate === null || validate(response.status)) {
    return kleosResponse;
  }
  throw new KleosError(
    `Request failed with status code ${response.status}`,
    "ERR_BAD_RESPONSE",
    working,
    { kind: "fetch", url },
    kleosResponse,
  );
}
/**
 * Runs the request/response interceptor chains around dispatchRequest, preserving promise ordering and error propagation.
 */
async function runRequest(
  config: InternalKleosRequestConfig,
  interceptors: {
    request: InterceptorManager<InternalKleosRequestConfig>;
    response: InterceptorManager<KleosResponse>;
  },
): Promise<KleosResponse> {
  let chain: Promise<InternalKleosRequestConfig> = Promise.resolve(config);
  const reqHandlers = interceptors.request._handlers;
  // Axios runs the last registered request interceptor first; walk slots in reverse while keeping stable eject indices.
  for (let i = reqHandlers.length - 1; i >= 0; i--) {
    const h = reqHandlers[i];
    if (!h) continue;
    if (h.runWhen && !h.runWhen(config)) continue;
    const { fulfilled, rejected, synchronous } = h;
    chain = chain.then(
      (cfg) => {
        if (synchronous && fulfilled) {
          return fulfilled(cfg) as InternalKleosRequestConfig;
        }
        return Promise.resolve(cfg).then(
          fulfilled ?? ((c: InternalKleosRequestConfig) => c),
        ) as Promise<InternalKleosRequestConfig>;
      },
      rejected ?? ((e: unknown) => Promise.reject(e)),
    ) as Promise<InternalKleosRequestConfig>;
  }
  let responseChain: Promise<KleosResponse> = chain.then((cfg) =>
    dispatchRequest(cfg),
  );
  interceptors.response.forEach(({ fulfilled, rejected }) => {
    responseChain = responseChain.then(
      (r) => (fulfilled ? fulfilled(r) : r) as KleosResponse,
      rejected ?? ((e: unknown) => Promise.reject(e)),
    ) as Promise<KleosResponse>;
  });
  return responseChain;
}
/**
 * Merges caller config with multipart intent so object payloads become FormData while still honoring per-instance defaults.
 * Centralizing this avoids three copies drifting when upload-related headers or spread order must stay consistent with plain post/put/patch.
 */
function withMultipartFormDataHeaders<D>(
  method: string,
  url: string,
  data: D | undefined,
  config?: KleosRequestConfig<D>,
): KleosRequestConfig<D> {
  return {
    ...config,
    url,
    method,
    data,
    headers: {
      ...config?.headers,
      "Content-Type": "multipart/form-data",
    },
  };
}
/**
 * Configurable HTTP client instance: holds shared defaults and interceptor registries used by every request method.
 */
export class Kleos {
  defaults: KleosRequestConfig;
  interceptors: {
    request: InterceptorManager<InternalKleosRequestConfig>;
    response: InterceptorManager<KleosResponse>;
  };
  /**
   * Seeds instance defaults (merged with library baseline) and empty interceptor chains for this client.
   */
  constructor(defaults?: KleosRequestConfig) {
    this.defaults = libraryDefaults(defaults);
    this.interceptors = {
      request: new InterceptorManager<InternalKleosRequestConfig>(),
      response: new InterceptorManager<KleosResponse>(),
    };
  }
  /**
   * Computes the resolved URL string for debugging, caching, or signing without performing I/O.
   */
  getUri(config?: KleosRequestConfig): string {
    const merged = mergeConfig(this.defaults, config ?? {});
    return buildURL(merged);
  }
  /**
   * Primary entry: merges defaults, runs interceptors, and dispatches fetch with full config expressiveness.
   */
  request<T = unknown, R = KleosResponse<T>, D = unknown>(
    config: KleosRequestConfig<D>,
  ): Promise<R> {
    const merged = mergeConfig(this.defaults, config);
    return runRequest(merged, this.interceptors) as Promise<R>;
  }
  /**
   * Shorthand for safe, cache-friendly reads that should not mutate server state.
   */
  get<T = unknown, R = KleosResponse<T>, D = unknown>(
    url: string,
    config?: KleosRequestConfig<D>,
  ): Promise<R> {
    return this.request<T, R, D>({ ...config, url, method: "GET" });
  }
  /**
   * Shorthand for resource deletion flows where bodies are uncommon but still supported by the shared pipeline.
   */
  delete<T = unknown, R = KleosResponse<T>, D = unknown>(
    url: string,
    config?: KleosRequestConfig<D>,
  ): Promise<R> {
    return this.request<T, R, D>({ ...config, url, method: "DELETE" });
  }
  /**
   * Shorthand for metadata-only probes (headers, existence checks) without downloading a full body by default.
   */
  head<T = unknown, R = KleosResponse<T>, D = unknown>(
    url: string,
    config?: KleosRequestConfig<D>,
  ): Promise<R> {
    return this.request<T, R, D>({ ...config, url, method: "HEAD" });
  }
  /**
   * Shorthand for CORS preflight discovery and capability negotiation endpoints some APIs expose explicitly.
   */
  options<T = unknown, R = KleosResponse<T>, D = unknown>(
    url: string,
    config?: KleosRequestConfig<D>,
  ): Promise<R> {
    return this.request<T, R, D>({ ...config, url, method: "OPTIONS" });
  }
  /**
   * Shorthand for creates and commands that submit payloads to the server for validation and persistence.
   */
  post<T = unknown, R = KleosResponse<T>, D = unknown>(
    url: string,
    data?: D,
    config?: KleosRequestConfig<D>,
  ): Promise<R> {
    return this.request<T, R, D>({ ...config, url, method: "POST", data });
  }
  /**
   * Shorthand for full replacements or idempotent writes where the URL identifies the resource being updated.
   */
  put<T = unknown, R = KleosResponse<T>, D = unknown>(
    url: string,
    data?: D,
    config?: KleosRequestConfig<D>,
  ): Promise<R> {
    return this.request<T, R, D>({ ...config, url, method: "PUT", data });
  }
  /**
   * Shorthand for partial updates so large resources do not need full PUT payloads on every small change.
   */
  patch<T = unknown, R = KleosResponse<T>, D = unknown>(
    url: string,
    data?: D,
    config?: KleosRequestConfig<D>,
  ): Promise<R> {
    return this.request<T, R, D>({ ...config, url, method: "PATCH", data });
  }
  /**
   * POST with multipart intent so plain objects serialize to FormData for file upload and form-heavy backends.
   */
  postForm<T = unknown, R = KleosResponse<T>, D = unknown>(
    url: string,
    data?: D,
    config?: KleosRequestConfig<D>,
  ): Promise<R> {
    return this.request<T, R, D>(
      withMultipartFormDataHeaders("POST", url, data, config),
    );
  }
  /**
   * PUT with multipart intent for replacing resources that include binary attachments in one round trip.
   */
  putForm<T = unknown, R = KleosResponse<T>, D = unknown>(
    url: string,
    data?: D,
    config?: KleosRequestConfig<D>,
  ): Promise<R> {
    return this.request<T, R, D>(
      withMultipartFormDataHeaders("PUT", url, data, config),
    );
  }
  /**
   * PATCH with multipart intent for partial updates that still carry files without switching client APIs.
   */
  patchForm<T = unknown, R = KleosResponse<T>, D = unknown>(
    url: string,
    data?: D,
    config?: KleosRequestConfig<D>,
  ): Promise<R> {
    return this.request<T, R, D>(
      withMultipartFormDataHeaders("PATCH", url, data, config),
    );
  }
}
/**
 * Wraps a Kleos instance as a callable function (axios-style) while exposing the same methods and shared state.
 */
function createCallable(instance: Kleos): KleosInstance {
  const fn = function <T = unknown, R = KleosResponse<T>, D = unknown>(
    urlOrConfig: string | KleosRequestConfig<D>,
    config?: KleosRequestConfig<D>,
  ): Promise<R> {
    if (typeof urlOrConfig === "string") {
      // Two-argument call form keeps quick GET/POST ergonomics for string-first tutorials and snippets
      return instance.request<T, R, D>({ ...config, url: urlOrConfig });
    }
    return instance.request<T, R, D>(urlOrConfig);
  } as KleosInstance;
  fn.defaults = instance.defaults;
  fn.interceptors = instance.interceptors;
  fn.getUri = instance.getUri.bind(instance);
  fn.request = instance.request.bind(instance);
  fn.get = instance.get.bind(instance);
  fn.delete = instance.delete.bind(instance);
  fn.head = instance.head.bind(instance);
  fn.options = instance.options.bind(instance);
  fn.post = instance.post.bind(instance);
  fn.put = instance.put.bind(instance);
  fn.patch = instance.patch.bind(instance);
  fn.postForm = instance.postForm.bind(instance);
  fn.putForm = instance.putForm.bind(instance);
  fn.patchForm = instance.patchForm.bind(instance);
  return fn;
}
const defaultInstance = createCallable(new Kleos());
/**
 * Factory for isolated clients (different base URLs, auth, interceptors) without mutating the shared default export.
 */
function create(config?: KleosRequestConfig): KleosInstance {
  return createCallable(new Kleos(config));
}
const kleos = defaultInstance as KleosStatic;
kleos.create = create;
kleos.KleosError = KleosError;
kleos.isKleosError = isKleosError;
kleos.CancelToken = CancelToken;
kleos.isCancel = isCancel;
kleos.all = Promise.all.bind(Promise);
// spread mirrors legacy helper usage: turn a tuple response array into positional callback arguments for older codebases
kleos.spread =
  <T, R>(callback: (...args: T[]) => R) =>
  (arr: T[]) =>
    callback(...arr);
export default kleos;
export { kleos };

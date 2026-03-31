# kleos

**kleos** is a small TypeScript HTTP client with an **Axios-compatible API** built on **native `fetch`** only—no runtime npm dependencies. Use it when you want familiar `axios`-style calls, interceptors, and config merging in browsers or Node 18+ without pulling in Axios itself.

```bash
npm install && npm run build
```

```ts
import axios from 'kleos';

const { data } = await axios.get('/api/items', { params: { page: 1 } });
```

See [`src/axios.ts`](src/axios.ts) for the full API. Some Node-only Axios options (custom agents, proxy, `maxRate`, and similar) are intentionally unsupported.

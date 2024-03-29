---
title: Slides
theme: ./theme.css
highlightTheme: tokyo-night-dark
template: ./template.html
revealOptions:
  hash: true
  controls: false
  progress: false
  slideNumber: false
  transition: none
  width: 1280
  height: 720
  margin: 0.1
---

---

# 👋

<div class="fragment">

github.com/tim-smart<br />
x.com/tim_smart

</div>

---

## Latest & Greatest

Exploring recent additions to Effect

---

Problem 1:

### CPU bound work

<div class="fragment">Don't block the main JS thread</div>

---

#### Solutions

<li class="fragment">Multiple processes</li>
<li class="fragment">Use another language</li>
<li class="fragment"><span class="fragment highlight-green">Workers</span></li>

---

#### Problems with workers:

<li class="fragment">Different API for each platform</li>
<li class="fragment">Serialization - crossing execution boundaries</li>

---

<img width="60%" style="display: block; margin: 0 auto;" src="./images/worker-error.jpeg" />

---

## @effect/platform/Worker

<li class="fragment">Same API for every platform</li>
<li class="fragment">Supports <code>@effect/schema</code></li>
<li class="fragment">Streaming</li>
<li class="fragment">Tracing</li>

---

#### Defining requests

```typescript [|8|4-5,9|10|11|14-15|]
import { Schema } from "@effect/schema"
import { Transferable } from "@effect/platform"

export class CropImageError
  extends Schema.TaggedError<CropImageError>()("CropImageError", {}) {}

export class CropImage extends Schema.TaggedRequest<CropImage>()(
  "CropImage", // string tag
  CropImageError, // error schema
  Transferable.ImageData, // success schema
  { data: Tranferable.ImageData } // request schema
) {}

export const Request = Schema.union(CropImage, ...)
export type Request = Schema.Schema.To<typeof Request>
```

---

#### Implementing the worker

```ts [|12|6,13||11]
import type { WorkerError } from "@effect/platform"
import { WorkerRunner } from "@effect/platform"
import type { Effect, Layer } from "effect"
import { Request } from "./schemas.js"

declare const crop: (data: ImageData) => Effect.Effect<ImageData>

export const WorkerRunnerLive: Layer.Layer<
  never,
  WorkerError.WorkerError,
  WorkerRunner.PlatformRunner
> = WorkerRunner.layerSerialized(Request, {
  CropImage: (request) => crop(request.data)
})
```

---

#### Implementing the worker

```ts
import { WorkerRunner } from "@effect/platform"
import type { Effect, Layer } from "effect"
import { Request } from "./schemas.js"

declare const crop: (data: ImageData) => Effect.Effect<ImageData>

export const WorkerRunnerLive = WorkerRunner.layerSerialized(Request, {
  CropImage: (request) => crop(request.data)
})
```

---

#### Running the worker

```ts [|3|6|9|]
import { BrowserRuntime, BrowserWorkerRunner } from "@effect/platform-browser"
import { Layer } from "effect"
import { WorkerRunnerLive } from "./worker.js"

const MainLive = WorkerRunnerLive.pipe(
  Layer.provide(BrowserWorkerRunner.layer)
)

BrowserRuntime.runMain(Layer.launch(MainLive))
```

---

#### Using the worker

```ts [|7-9|10|12-14|]
import { Worker } from "@effect/platform"
import { BrowserWorker } from "@effect/platform-browser"
import { Effect } from "effect"
import { CropImage, type Request } from "./schemas.js"

Effect.gen(function*(_) {
  const pool = yield* _(Worker.makePoolSerialized<Request>({
    size: 4
  }))
  yield* _(pool.executeEffect(new CropImage({ data: new ImageData(1, 1) })))
}).pipe(
  Effect.provide(BrowserWorker.layer(
    () => new globalThis.Worker(new URL("./worker.ts", import.meta.url))
  ))
)
```

---

Problem 2:

### Type safety over network boundaries

<div class="fragment">Fully type-safe client-to-server communication</div>

---

#### Solutions

<li class="fragment">tRPC</li>
<li class="fragment">tsrpc</li>
<li class="fragment">typed-rpc</li>
<li class="fragment">...</li>

---

### @effect/rpc

<li class="fragment">Built for Effect</li>
<li class="fragment">Bidirectional schemas with <code>@effect/schema</code></li>
<li class="fragment">Batching using <code>RequestResolver</code></li>
<li class="fragment">Response streaming</li>
<li class="fragment">Tracing</li>

---

#### Defining requests

```ts
import { Schema } from "@effect/schema"

export class User extends Schema.Class<User>()({ ... }) {}

export class GetUserById extends Schema.TaggedRequest<GetUserById>()(
  "GetUserById",
  Schema.never,
  User,
  { id: Schema.number }
) {}
```

---

#### Define a Router

```ts [|5|]
import { Router, Rpc } from "@effect/rpc"
import { GetUserById, User } from "./schema.ts"

export const router = Router.make(
  Rpc.effect(GetUserById, ({ id }) => Effect.succeed(new User({ ... })))
)

export type Router = typeof router
```

---

#### Add to http server

```ts
import { HttpRouter } from "@effect/rpc-http"
import { HttpServer } from "@effect/platform"
import { router } from "./router.ts"

HttpServer.router.empty.pipe(
  HttpServer.router.post("/rpc", HttpRouter.toHttpApp(router))
)
```

---

#### Create the client

```ts [|2,5|8|]
import { HttpResolver } from "@effect/rpc-http"
import type { Router } from "./router.ts"
import { GetUserById } from "./schema.ts"

const client = HttpResolver.makeClient<Router>("http://localhost:3000/rpc")

// make calls
client(new GetUserById({ id: 123 }))
```

---

#### Create a RequestResolver

```ts [|10|12|]
import { Resolver } from "@effect/rpc"
import { HttpResolver } from "@effect/rpc-http"
import { HttpClient } from "@effect/platform"
import type { Router } from "./router.ts"
import { GetUserById } from "./schema.ts"
import { Schedule } from "effect"

const resolver = HttpResolver.make<Router>(HttpClient.client.fetchOk().pipe(
  HttpClient.client.mapRequest(
    HttpClient.request.prependUrl("http://localhost:3000/rpc")
  ),
  HttpClient.client.retry(Schedule.exponential(1000))
)).pipe(Resolver.toClient)

// make calls
client(new GetUserById({ id: 123 }))
```

---

Problem 3:

### Batching across contexts

<p class="fragment">Also known as the data-loader pattern</p>

---

### @effect/experimental/RequestResolver

---

```ts [|4|5-7|]
import { dataLoader } from "@effect/experimental/RequestResolver"

Effect.gen(function* (_) {
  const resolver = HttpResolver.make<Router>(...)
  const newResolver = yield* _(dataLoader(resolver, {
    window: "100 millis",
    maxBatchSize: 1000
  }))
})
```

---

Problem 4:

### Persistent caching of requests

<div class="fragment">Storing request results between app instances</div>

---

### @effect/experimental/Persistence

<li class="fragment">Built on <code>@effect/schema</code></li>
<li class="fragment">In-memory adapter</li>
<li class="fragment"><code>@effect/platform/KeyValueStore</code> adapter</li>
<li class="fragment">lmdb adapter</li>
<li class="fragment">more to come...</li>

---

### Defining requests

```ts [|12-14]
import { Schema } from "@effect/schema"
import { PrimaryKey } from "effect"

export class User extends Schema.Class<User>()({ ... }) {}

export class GetUserById extends Schema.TaggedRequest<GetUserById>()(
  "GetUserById",
  Schema.never,
  User,
  { id: Schema.number }
) {
  [PrimaryKey.symbol]() {
    return `GetUserById-${this.id}`
  }
}
```

---

### Usage with RequestResolver

```ts [|6|1,7|9-11|]
import { persisted } from "@effect/experimental/RequestResolver"
import * as Persistence from "@effect/experimental/Persistence"
import { NodeKeyValueStore } from "@effect/platform-node"

Effect.gen(function* (_) {
  const resolver = HttpResolver.make<Router>(...)
  const persistedResolver = yield* _(persisted(resolver, "store-id"))
}).pipe(
  Effect.provide(Persistence.layerResultKeyValueStore.pipe(
    Layer.provide(NodeKeyValueStore.layerFileSystem("./store"))
  ))
)
```

---

Problem 5:

### Observability in development

<div class="fragment">Easy tracing & metrics in development</div>

---

### Solutions

<li class="fragment">docker + tempo + prometheus</li>
<li class="fragment"><code>console.log</code></li>

---

## Announcing...

---

<img width="50%" style="display: block; margin: 0 auto;" src="./images/effect-vscode.png" />

---

## vscode extension

<li class="fragment">Tracing</li>
<li class="fragment">Metrics</li>
<li class="fragment">Inspecting Context</li>
<li class="fragment">All inside your IDE</li>
<li class="fragment">Early alpha...</li>

---

### Demo

---

# 👋

Come find me if you have questions!

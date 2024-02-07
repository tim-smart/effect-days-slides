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

Problem:

### CPU bound work on a single thread

---

#### Solutions:

<li class="fragment">Multiple processes</li>
<li class="fragment">Use another language</li>
<li class="fragment"><span class="fragment highlight-red">Workers</span></li>

---

#### Problems with workers:

<li class="fragment">Slightly different API for each platform</li>
<li class="fragment">Serialization - crossing execution boundaries</li>

---

## @effect/platform/Worker

<li class="fragment">Same API for every platform</li>
<li class="fragment">Supports <code>@effect/schema</code></li>
<li class="fragment">Streaming</li>

---

#### Defining requests

```typescript [|6|7|8|11-12]
import { Schema } from "@effect/schema"
import { Transferable } from "@effect/platform"

export class CropImage extends Schema.TaggedRequest<CropImage>()(
  "EncodeImage",
  Schema.never,
  Transferable.ImageData,
  { data: Tranferable.ImageData }
) {}

export const Request = Schema.union(CropImage)
export type Request = Schema.Schema.To<typeof Request>
```

---

#### Implementing the worker

```ts [12|6,13||11]
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

#### Running the worker

```ts [3|6|9|]
import { BrowserRuntime, BrowserWorkerRunner } from "@effect/platform-browser"
import { Layer } from "effect"
import { WorkerRunnerLive } from "./worker.js"

const MainLive = WorkerRunnerLive.pipe(
  Layer.provide(BrowserWorkerRunner.layer)
)

BrowserRuntime.runMain(Layer.launch(MainLive))
```
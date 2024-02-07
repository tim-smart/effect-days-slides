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

**Solutions:**

<li class="fragment">Multiple processes</li>
<li class="fragment">Use another language</li>
<li class="fragment"><span class="fragment highlight-red">Workers</span></li>

---

**Problems with workers:**

<li class="fragment">Slightly different API for each platform</li>
<li class="fragment">Serialization - crossing execution boundaries</li>

---

## @effect/platform/Worker

<li class="fragment">Same API for every platform</li>
<li class="fragment">Supports <code>@effect/schema</code></li>
<li class="fragment">Streaming</li>

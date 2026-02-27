# Getting Started

## What is Vio?

Vio is an **AI-agent-first frontend framework**. It is designed from the ground up so that both humans and AI agents can build, inspect, and control user interfaces programmatically.

Core principles:

- **JSON-to-DOM** -- Components return plain `{ tag, props, children }` objects. No templates, no JSX, no compiler step. Any LLM can produce valid component trees.
- **Immutable state** -- State changes produce new objects. The virtual DOM diff determines exactly what to update.
- **Observable everything** -- All mutations flow through an event bus. Every state change, route transition, and store dispatch is serializable, loggable, and replayable.
- **MCP-ready** -- Connect the companion `@atrotos/vio-devtools` package and any MCP-capable client (Claude Code, Cursor, etc.) can read state, dispatch actions, navigate routes, and inspect the component tree in real time.

## Installation

::: code-group

```sh [npm]
npm install @atrotos/vio
```

```sh [pnpm]
pnpm add @atrotos/vio
```

```sh [yarn]
yarn add @atrotos/vio
```

:::

## Your First Component

Components in Vio are defined with `defineComponent()`. A component needs a **name**, optional initial **state**, and a **render** function that returns a `VioNodeDescriptor` -- a plain object describing what to render.

```typescript
import { defineComponent } from '@atrotos/vio'

const Greeting = defineComponent({
  name: 'Greeting',
  state: { name: 'World' },
  render(state) {
    return {
      tag: 'h1',
      children: [`Hello, ${state.name}!`]
    }
  }
})
```

The render function receives the current `state` object and returns a tree of descriptors. Each descriptor has:

| Property   | Type                                        | Description                              |
|------------|---------------------------------------------|------------------------------------------|
| `tag`      | `string \| ComponentDef`                    | HTML tag name or a nested component      |
| `props`    | `Record<string, unknown>`                   | HTML attributes and event handlers       |
| `children` | `Array<VioNodeDescriptor \| string \| number \| boolean \| null>` | Child nodes  |
| `key`      | `string \| number`                          | Optional key for diffing                 |

::: tip
Because components are plain data, any tool that can produce JSON can produce a Vio component tree -- including LLMs.
:::

## Creating an App

Use `createApp()` to wire everything together. It accepts an `AppConfig` object:

```typescript
import { createApp } from '@atrotos/vio'

const app = createApp({
  root: '#app',       // CSS selector or HTMLElement
  routes: [           // Array of Route objects
    { path: '/', component: Greeting }
  ],
  store: {            // Optional global store
    state: { theme: 'light' },
    actions: {
      toggleTheme(state) {
        return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' }
      }
    }
  }
})
```

The `AppConfig` fields:

| Field    | Type                    | Required | Description                                     |
|----------|-------------------------|----------|-------------------------------------------------|
| `root`   | `string \| HTMLElement` | Yes      | The DOM element to mount into                   |
| `routes` | `Route[]`               | No       | Route definitions mapping paths to components   |
| `store`  | `StoreConfig`           | No       | Global state with pure action reducers          |

## Mounting

Call `app.mount()` to render the application into the DOM. The router reads the current URL hash and mounts the matching route component.

```typescript
app.mount()
```

Vio uses hash-based routing (`#/path`). When the hash changes, the router automatically unmounts the current component and mounts the matching one.

## Complete Example

Here is a full working example that puts all the pieces together -- a counter app with a global store for theming:

```typescript
import { createApp, defineComponent } from '@atrotos/vio'

// Define a Counter component with local state
const Counter = defineComponent({
  name: 'Counter',
  state: { count: 0 },
  render(state, store) {
    return {
      tag: 'div',
      props: { class: `counter ${store?.theme ?? 'light'}` },
      children: [
        {
          tag: 'h1',
          children: [`Count: ${state.count}`]
        },
        {
          tag: 'button',
          props: {
            onClick: () => {
              // State updates happen through the app runtime API
            }
          },
          children: ['Increment']
        },
        {
          tag: 'p',
          children: [`Current theme: ${store?.theme ?? 'light'}`]
        }
      ]
    }
  },
  onMount(ctx) {
    console.log('Counter mounted!')
    // onMount can return a cleanup function
    return () => console.log('Counter cleanup')
  },
  onUpdate(ctx, prevState) {
    console.log('State changed from', prevState, 'to', ctx.getState())
  },
  onUnmount(ctx) {
    console.log('Counter unmounted')
  }
})

// Create the app
const app = createApp({
  root: '#app',
  routes: [
    { path: '/', component: Counter }
  ],
  store: {
    state: { theme: 'light' },
    actions: {
      toggleTheme(state) {
        return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' }
      }
    }
  }
})

// Mount the app
app.mount()

// --- Runtime API examples ---

// Read and update component state
const tree = app.getComponentTree()
app.setState(tree.id, { count: 5 })
console.log(app.getState(tree.id)) // { count: 5 }

// Dispatch a global store action
app.dispatch('toggleTheme')
console.log(app.getStore()) // { theme: 'dark' }

// Listen for events
app.on('state:change', (event) => {
  console.log('State changed:', event)
})

// Navigate programmatically
app.navigate('/other-page')

// Batch multiple operations atomically
app.batch([
  { action: 'setState', target: tree.id, payload: { count: 10 } },
  { action: 'dispatch', payload: { action: 'toggleTheme' } }
])
```

### What Each Part Does

1. **`defineComponent()`** creates a component definition with a name, initial state, a render function, and optional lifecycle hooks (`onMount`, `onUpdate`, `onUnmount`).

2. **`render(state, store?)`** receives the component's local state and the optional global store state. It returns a `VioNodeDescriptor` tree describing the UI.

3. **`createApp()`** accepts a root element, route definitions, and an optional global store. It wires up the renderer, router, event bus, and store.

4. **`app.mount()`** reads the current URL hash, resolves the matching route, and renders the component into the root element.

5. **Runtime API** -- After mounting, the app exposes methods like `setState()`, `dispatch()`, `navigate()`, `getComponentTree()`, and `batch()` for programmatic control. These are the same methods that AI agents use through the MCP devtools.

::: tip
Every component instance gets a unique ID like `"Counter-1"`. Use `app.getComponentTree()` to discover IDs, then use them with `app.setState()` and other runtime methods.
:::

## HTML Setup

Your HTML file needs a root element for Vio to mount into:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>My Vio App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./main.ts"></script>
  </body>
</html>
```

## Next Steps

Now that you have a running Vio app, explore the core concepts:

- [Components](/guide/components) -- Component definitions, lifecycle hooks, nesting, and the component tree
- [State Management](/guide/state-management) -- Global store with pure action reducers
- [Routing](/guide/routing) -- Hash-based routing with guards and parameters
- [Event Bus](/guide/event-bus) -- Observable event system for logging and debugging
- [HTTP Client](/guide/http-client) -- Fetch wrapper with interceptors
- [Forms](/guide/forms) -- Form state management and validation
- [Batch Operations](/guide/batch-operations) -- Execute multiple operations atomically

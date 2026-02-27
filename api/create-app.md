# createApp

Creates and returns a Vio application instance. This is the main entry point for every Vio application.

## Import

```ts
import { createApp } from '@atrotos/vio'
```

## Signature

```ts
function createApp(config: AppConfig): VioApp
```

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `config` | [`AppConfig`](./types#appconfig) | Yes | Application configuration object |

### AppConfig

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `root` | `string \| HTMLElement` | Yes | CSS selector string or DOM element to mount into |
| `routes` | [`Route[]`](./types#route) | No | Array of route definitions for the router |
| `store` | [`StoreConfig`](./types#storeconfig) | No | Global store configuration |

## Return Type

Returns a [`VioApp`](#vioapp-interface) instance.

## VioApp Interface

```ts
interface VioApp {
  mount(): void
  setState(instanceId: string, partial: Record<string, unknown>): void
  getState(instanceId: string): Record<string, unknown>
  dispatch(action: string, payload?: unknown): void
  getStore(): Record<string, unknown>
  on(event: string, handler: (e: any) => void): () => void
  emit(event: string, payload?: Record<string, unknown>): void
  register(def: ComponentDef): void
  getRegisteredComponents(): string[]
  removeComponent(instanceId: string): void
  getComponentTree(): { id: string; name: string; state: Record<string, unknown>; children: any[] }
  navigate(path: string): void
  batch(ops: BatchOperation[]): void
  getEventHistory(): { type: string; payload: Record<string, unknown>; timestamp: number }[]
}
```

## Methods

### mount()

Mounts the application to the DOM. If routes are configured, resolves the current hash-based URL and renders the matching component. Registers a `hashchange` listener for client-side navigation.

```ts
mount(): void
```

```ts
const app = createApp({ root: '#app', routes })
app.mount()
```

### setState(instanceId, partial)

Merges a partial state object into the state of a mounted component instance.

```ts
setState(instanceId: string, partial: Record<string, unknown>): void
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `instanceId` | `string` | The unique ID of the component instance |
| `partial` | `Record<string, unknown>` | Partial state to merge |

```ts
app.setState('counter-1', { count: 5 })
```

### getState(instanceId)

Returns a shallow copy of the current state for a component instance. Returns an empty object if the instance is not found.

```ts
getState(instanceId: string): Record<string, unknown>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `instanceId` | `string` | The unique ID of the component instance |

```ts
const state = app.getState('counter-1')
console.log(state.count) // 5
```

### dispatch(action, payload?)

Dispatches an action to the global store. Throws if no store is configured.

```ts
dispatch(action: string, payload?: unknown): void
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `action` | `string` | The action name (must match a key in `StoreConfig.actions`) |
| `payload` | `unknown` | Optional payload passed to the action handler |

```ts
app.dispatch('increment')
app.dispatch('addTodo', { text: 'Learn Vio' })
```

::: warning
Throws `Error` if no store was provided in the `AppConfig`.
:::

### getStore()

Returns a shallow copy of the current global store state. Returns an empty object if no store is configured.

```ts
getStore(): Record<string, unknown>
```

```ts
const storeState = app.getStore()
console.log(storeState.count) // current count
```

### on(event, handler)

Subscribes to an event on the internal event bus. Returns an unsubscribe function.

```ts
on(event: string, handler: (e: any) => void): () => void
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `string` | Event type to listen for (e.g., `'store:change'`, `'route:change'`, or custom events) |
| `handler` | `(e: any) => void` | Callback invoked with the event object |

```ts
const unsubscribe = app.on('store:change', (e) => {
  console.log('Store changed:', e.payload)
})

// Later, stop listening
unsubscribe()
```

### emit(event, payload?)

Emits an event on the internal event bus.

```ts
emit(event: string, payload?: Record<string, unknown>): void
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `string` | Event type to emit |
| `payload` | `Record<string, unknown>` | Optional event payload (defaults to `{}`) |

```ts
app.emit('user:action', { action: 'click', target: 'button' })
```

### register(def)

Registers a component definition so it can be referenced by name.

```ts
register(def: ComponentDef): void
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `def` | [`ComponentDef`](./types#componentdef) | Component definition to register |

```ts
import { defineComponent } from '@atrotos/vio'

const MyButton = defineComponent({
  name: 'MyButton',
  render: () => ({ tag: 'button', children: ['Click me'] })
})

app.register(MyButton)
```

::: warning
Throws `Error` if a component with the same name is already registered.
:::

### getRegisteredComponents()

Returns an array of names of all registered components.

```ts
getRegisteredComponents(): string[]
```

```ts
const names = app.getRegisteredComponents()
// ['MyButton', 'Header', 'Footer']
```

### removeComponent(instanceId)

Unmounts and removes a component instance from the DOM. If the removed instance is the root and a hash listener is active, it cleans up the listener.

```ts
removeComponent(instanceId: string): void
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `instanceId` | `string` | The unique ID of the component instance to remove |

```ts
app.removeComponent('counter-1')
```

### getComponentTree()

Returns a tree representation of the currently mounted component hierarchy starting from the root instance.

```ts
getComponentTree(): {
  id: string
  name: string
  state: Record<string, unknown>
  children: any[]
}
```

```ts
const tree = app.getComponentTree()
console.log(tree.name) // 'App'
console.log(tree.state) // { page: 'home' }
```

### navigate(path)

Programmatically navigates to a route path. Updates the URL hash and renders the matching component. Throws if no routes are configured.

```ts
navigate(path: string): void
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | `string` | The path to navigate to (e.g., `'/about'` or `'/users/42'`) |

```ts
app.navigate('/about')
app.navigate('/users/42')
```

::: warning
Throws `Error` if no routes were provided in the `AppConfig`.
:::

### batch(ops)

Executes multiple operations atomically. Emits `batch:start` and `batch:end` events around the batch. Supported actions: `setState`, `dispatch`, `removeComponent`, `navigate`.

```ts
batch(ops: BatchOperation[]): void
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `ops` | [`BatchOperation[]`](./types#batchoperation) | Array of operations to execute |

```ts
app.batch([
  { action: 'setState', target: 'counter-1', payload: { count: 0 } },
  { action: 'dispatch', payload: { action: 'reset' } },
  { action: 'navigate', target: '/home' }
])
```

### getEventHistory()

Returns an array of all events recorded by the internal event bus (up to the configured history size, default 100).

```ts
getEventHistory(): {
  type: string
  payload: Record<string, unknown>
  timestamp: number
}[]
```

```ts
const history = app.getEventHistory()
history.forEach((event) => {
  console.log(`[${event.type}]`, event.payload)
})
```

## Full Example

```ts
import { createApp, defineComponent } from '@atrotos/vio'

const Home = defineComponent({
  name: 'Home',
  state: { count: 0 },
  render: (state) => ({
    tag: 'div',
    children: [
      { tag: 'h1', children: ['Home'] },
      { tag: 'p', children: [`Count: ${state.count}`] }
    ]
  })
})

const app = createApp({
  root: '#app',
  routes: [
    { path: '/', component: Home }
  ],
  store: {
    state: { theme: 'dark' },
    actions: {
      setTheme: (state, theme) => ({ ...state, theme })
    }
  }
})

app.on('store:change', (e) => {
  console.log('Store updated:', e.payload)
})

app.mount()
```

## Related

- [AppConfig type](./types#appconfig)
- [defineComponent](./define-component)
- [Store](./store)
- [Router](./router)
- [Batch Operations guide](/guide/batch-operations)

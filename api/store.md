# Store

The `Store` class provides centralized state management for Vio applications. It holds global state, processes actions, and notifies subscribers when state changes.

## Import

```ts
import { Store } from 'vio'
```

::: tip
You typically do not create a `Store` directly. Instead, pass a `StoreConfig` to [`createApp`](./create-app) and use `app.dispatch()` / `app.getStore()`. The `Store` class is exported for advanced use cases and testing.
:::

## Signature

```ts
class Store {
  constructor(config: StoreConfig, bus: EventBus)
  getState(): Record<string, unknown>
  dispatch(action: string, payload?: unknown): void
  subscribe(cb: StoreSubscriber): () => void
}
```

## Constructor

```ts
new Store(config: StoreConfig, bus: EventBus)
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `config` | [`StoreConfig`](./types#storeconfig) | Yes | Store configuration with initial state and actions |
| `bus` | [`EventBus`](./event-bus) | Yes | Event bus instance for emitting store events |

### StoreConfig

```ts
interface StoreConfig {
  state: Record<string, unknown>
  actions: Record<string, StoreAction>
}

interface StoreAction {
  (state: Record<string, unknown>, payload?: unknown): Record<string, unknown>
}
```

| Property | Type | Description |
|----------|------|-------------|
| `state` | `Record<string, unknown>` | Initial state object |
| `actions` | `Record<string, StoreAction>` | Map of action name to handler function. Each handler receives the current state and an optional payload, and must return the new state. |

## Methods

### getState()

Returns a shallow copy of the current store state.

```ts
getState(): Record<string, unknown>
```

```ts
const state = store.getState()
console.log(state.count) // 0
```

### dispatch(action, payload?)

Dispatches a named action to mutate the store state. The action handler is called with the current state and the payload, and its return value becomes the new state.

After a dispatch:
1. A `store:change` event is emitted on the event bus with `action`, `payload`, `prev`, and `next` in the payload.
2. All subscribers are notified with the new and previous state.

```ts
dispatch(action: string, payload?: unknown): void
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | `string` | Yes | Action name matching a key in `StoreConfig.actions` |
| `payload` | `unknown` | No | Data to pass to the action handler |

```ts
store.dispatch('increment')
store.dispatch('addTodo', { text: 'Learn Vio' })
```

::: warning
Throws `Error` if the action name does not match any registered action.
:::

### subscribe(cb)

Registers a callback that is invoked whenever the store state changes. Returns an unsubscribe function.

```ts
subscribe(cb: StoreSubscriber): () => void
```

The subscriber callback signature:

```ts
type StoreSubscriber = (
  newState: Record<string, unknown>,
  prevState: Record<string, unknown>
) => void
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `cb` | `StoreSubscriber` | Callback receiving new state and previous state |

```ts
const unsubscribe = store.subscribe((newState, prevState) => {
  console.log('State changed from', prevState, 'to', newState)
})

// Stop listening
unsubscribe()
```

## Events Emitted

The store emits the following event on the event bus after every dispatch:

| Event | Payload |
|-------|---------|
| `store:change` | `{ action: string, payload: Record<string, unknown>, prev: Record<string, unknown>, next: Record<string, unknown> }` |

## Full Example

```ts
import { createApp, defineComponent } from 'vio'

const Counter = defineComponent({
  name: 'Counter',
  render: (state, store) => ({
    tag: 'div',
    children: [
      { tag: 'p', children: [`Global count: ${store?.count}`] },
      { tag: 'button', props: { id: 'inc' }, children: ['+'] },
      { tag: 'button', props: { id: 'dec' }, children: ['-'] }
    ]
  })
})

const app = createApp({
  root: '#app',
  routes: [{ path: '/', component: Counter }],
  store: {
    state: { count: 0 },
    actions: {
      increment: (state) => ({ ...state, count: (state.count as number) + 1 }),
      decrement: (state) => ({ ...state, count: (state.count as number) - 1 }),
      set: (state, value) => ({ ...state, count: value })
    }
  }
})

app.on('store:change', (e) => {
  console.log(`[${e.payload.action}]`, e.payload.prev, '->', e.payload.next)
})

app.mount()
app.dispatch('increment')
app.dispatch('set', 10)
```

## Related

- [StoreConfig type](./types#storeconfig)
- [State Management guide](/guide/state-management)
- [createApp](./create-app)
- [EventBus](./event-bus)

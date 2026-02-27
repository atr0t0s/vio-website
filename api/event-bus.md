# EventBus

The `EventBus` class is the publish/subscribe messaging system used throughout Vio. It provides typed event emission, wildcard listeners, and event history tracking.

## Import

```ts
import { EventBus } from 'vio'
```

::: tip
Every `VioApp` has an internal `EventBus`. You interact with it via `app.on()` and `app.emit()`. The `EventBus` class is exported for advanced use cases, testing, or building custom modules.
:::

## Signature

```ts
class EventBus {
  constructor(options?: EventBusOptions)
  on(type: string, handler: EventHandler): () => void
  emit(type: string, payload?: Record<string, unknown>): void
  getHistory(): VioEvent[]
  clear(): void
}
```

## Constructor

```ts
new EventBus(options?: EventBusOptions)
```

### EventBusOptions

```ts
interface EventBusOptions {
  historySize?: number
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `historySize` | `number` | `100` | Maximum number of events to retain in history. Set to `0` to disable history. |

```ts
const bus = new EventBus({ historySize: 50 })
```

## Methods

### on(type, handler)

Subscribes a handler to events of the given type. Returns an unsubscribe function.

```ts
on(type: string, handler: (event: VioEvent) => void): () => void
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | `string` | Event type to listen for. Use `'*'` to listen to all events. |
| `handler` | `(event: VioEvent) => void` | Callback invoked with the event object |

The handler receives a [`VioEvent`](./types#vioevent) object.

```ts
// Listen to a specific event
const unsubscribe = bus.on('store:change', (event) => {
  console.log('Store changed:', event.payload)
})

// Later, stop listening
unsubscribe()
```

#### Wildcard Listener

Use `'*'` to receive every event emitted on the bus:

```ts
bus.on('*', (event) => {
  console.log(`[${event.type}]`, event.payload)
})
```

::: tip
Wildcard handlers are called in addition to type-specific handlers, not instead of them. They do not receive events that are themselves emitted with the type `'*'`.
:::

### emit(type, payload?)

Emits an event to all handlers registered for the given type, plus any wildcard (`'*'`) handlers. The event is also added to the history buffer.

```ts
emit(type: string, payload?: Record<string, unknown>): void
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | `string` | -- | Event type |
| `payload` | `Record<string, unknown>` | `{}` | Event data |

```ts
bus.emit('user:click', { target: 'submit-button' })
```

The emitted event object has this shape:

```ts
{
  type: 'user:click',
  payload: { target: 'submit-button' },
  timestamp: 1709000000000 // Date.now()
}
```

### getHistory()

Returns a copy of the event history array, ordered from oldest to newest.

```ts
getHistory(): VioEvent[]
```

```ts
const history = bus.getHistory()
console.log(`${history.length} events recorded`)
history.forEach((e) => {
  console.log(`[${e.timestamp}] ${e.type}`, e.payload)
})
```

::: tip
History size is bounded by the `historySize` option (default 100). When the limit is exceeded, the oldest events are dropped.
:::

### clear()

Removes all registered listeners and clears the event history.

```ts
clear(): void
```

```ts
bus.clear()
// All listeners removed, history emptied
```

## Built-in Event Types

Vio's core modules emit these events automatically:

| Event Type | Source | Payload |
|------------|--------|---------|
| `state:change` | Renderer | `{ instanceId, key, value, prev }` |
| `store:change` | Store | `{ action, payload, prev, next }` |
| `component:mount` | Renderer | `{ instanceId, name }` |
| `component:update` | Renderer | `{ instanceId, name }` |
| `component:unmount` | Renderer | `{ instanceId, name }` |
| `route:before` | Router | `{ from, to }` |
| `route:change` | Router | `{ from, to, params }` |
| `route:after` | Router | `{ path, params }` |
| `batch:start` | App | `{ operations }` |
| `batch:end` | App | `{ operations }` |

You can also emit and listen for any custom event type.

## Full Example

```ts
import { EventBus } from 'vio'

const bus = new EventBus({ historySize: 200 })

// Type-specific listener
bus.on('user:login', (event) => {
  console.log('User logged in:', event.payload.username)
})

// Wildcard listener for debugging
const stopLogging = bus.on('*', (event) => {
  console.log(`[${event.type}] at ${event.timestamp}`, event.payload)
})

// Emit events
bus.emit('user:login', { username: 'alice' })
bus.emit('user:action', { action: 'navigate', to: '/dashboard' })

// Check history
const history = bus.getHistory()
console.log(`Total events: ${history.length}`) // 2

// Cleanup
stopLogging()
bus.clear()
```

## Related

- [VioEvent type](./types#vioevent)
- [VioEventType type](./types#vioeventtype)
- [Event Bus guide](/guide/event-bus)
- [createApp](./create-app)

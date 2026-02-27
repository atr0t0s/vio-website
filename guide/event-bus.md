# Event Bus

Every state change, route transition, component lifecycle event, and batch operation in Vio flows through a central **event bus**. This gives you full observability into your application — subscribe to any event, emit custom events, and inspect the event history.

## Why an Event Bus?

Traditional frameworks scatter state changes across callbacks, watchers, and effects. Debugging means hunting through component trees and console logs. Vio takes a different approach: every mutation is an event, and every event is recorded.

This design serves two audiences:

- **Developers** get a single place to observe, log, and react to everything happening in their app
- **AI agents** get a structured, serializable stream of every operation — making the app fully inspectable and controllable via MCP devtools

## Event Shape

Every event is a `VioEvent` object with three fields:

```typescript
interface VioEvent {
  type: string                        // event identifier
  payload: Record<string, unknown>    // event-specific data
  timestamp: number                   // Date.now() when emitted
}
```

## Built-in Event Types

Vio emits the following events automatically. You do not need to emit these yourself — they fire as part of normal framework operations.

### Component Lifecycle

#### `component:mount`

Emitted when a component instance is mounted to the DOM.

```typescript
app.on('component:mount', (event) => {
  // event.payload:
  // {
  //   name: 'Counter',
  //   id: 'Counter-1',
  //   state: { count: 0 }
  // }
})
```

#### `component:update`

Triggered when `setState` is called on a component. The underlying event on the bus is `state:change` (see below), while the `onUpdate` lifecycle hook fires on the component instance itself.

#### `component:unmount`

Emitted when a component is removed from the DOM.

```typescript
app.on('component:unmount', (event) => {
  // event.payload:
  // {
  //   name: 'Counter',
  //   id: 'Counter-1'
  // }
})
```

### State Changes

#### `state:change`

Emitted when a component's local state is updated via `setState`.

```typescript
app.on('state:change', (event) => {
  // event.payload:
  // {
  //   component: 'Counter',
  //   id: 'Counter-1',
  //   prev: { count: 0 },
  //   next: { count: 1 }
  // }
})
```

#### `store:change`

Emitted when a global store action is dispatched.

```typescript
app.on('store:change', (event) => {
  // event.payload:
  // {
  //   action: 'addTodo',
  //   payload: { text: 'Learn Vio' },
  //   prev: { todos: [] },
  //   next: { todos: [{ text: 'Learn Vio' }] }
  // }
})
```

### Route Events

#### `route:before`

Emitted before a route change takes effect.

```typescript
app.on('route:before', (event) => {
  // event.payload:
  // {
  //   from: '/',         // previous path, or null on first navigation
  //   to: '/dashboard'
  // }
})
```

#### `route:change`

Emitted after the route has been resolved.

```typescript
app.on('route:change', (event) => {
  // event.payload:
  // {
  //   from: '/',
  //   to: '/users/42',
  //   params: { id: '42' }
  // }
})
```

#### `route:after`

Emitted after navigation is complete.

```typescript
app.on('route:after', (event) => {
  // event.payload:
  // {
  //   path: '/users/42',
  //   params: { id: '42' }
  // }
})
```

### Batch Operations

#### `batch:start`

Emitted when a batch operation begins.

```typescript
app.on('batch:start', (event) => {
  // event.payload:
  // { operations: 3 }   // number of operations in the batch
})
```

#### `batch:end`

Emitted when a batch operation completes.

```typescript
app.on('batch:end', (event) => {
  // event.payload:
  // { operations: 3 }
})
```

## Subscribing to Events

Use `app.on()` to listen for events. It returns an **unsubscribe function** — call it to stop listening.

```typescript
// Subscribe
const unsubscribe = app.on('state:change', (event) => {
  console.log(`${event.payload.component} state changed`)
})

// Later, unsubscribe
unsubscribe()
```

### Listening to All Events

Use the wildcard `*` to receive every event that flows through the bus:

```typescript
const unsubscribe = app.on('*', (event) => {
  console.log(`[${event.type}]`, event.payload)
})
```

This is particularly useful for debugging and logging.

### Multiple Subscribers

You can attach as many handlers as you want to the same event type. They all fire in the order they were registered.

```typescript
// Logger
app.on('store:change', (event) => {
  console.log('Store action:', event.payload.action)
})

// Persistence
app.on('store:change', (event) => {
  localStorage.setItem('state', JSON.stringify(event.payload.next))
})

// Analytics
app.on('store:change', (event) => {
  analytics.track('store_action', { action: event.payload.action })
})
```

## Custom Events

Emit your own events using `app.emit()`. Custom events flow through the same bus and appear in the event history alongside built-in events.

```typescript
// Emit a custom event
app.emit('analytics:pageview', { page: '/dashboard', referrer: '/' })
app.emit('notification:show', { message: 'Saved!', type: 'success' })
app.emit('feature:flag', { name: 'dark-mode', enabled: true })
```

Subscribe to custom events exactly like built-in ones:

```typescript
app.on('notification:show', (event) => {
  showToast(event.payload.message as string, event.payload.type as string)
})
```

::: tip
Use a consistent naming convention for custom events. The `namespace:action` pattern (e.g., `analytics:pageview`, `notification:show`) keeps things organized and avoids collisions with built-in events.
:::

## Event History

Vio keeps a rolling buffer of the last **100 events**. Retrieve them with `app.getEventHistory()`:

```typescript
const history = app.getEventHistory()

// Returns an array of VioEvent objects, oldest first
// [
//   { type: 'component:mount', payload: {...}, timestamp: 1709001234567 },
//   { type: 'state:change', payload: {...}, timestamp: 1709001234589 },
//   ...
// ]
```

The history includes both built-in and custom events. When the buffer exceeds 100 entries, the oldest event is dropped.

### Using History for Debugging

```typescript
// Print all recent state changes
const stateChanges = app.getEventHistory()
  .filter(e => e.type === 'state:change')

stateChanges.forEach(e => {
  console.log(`[${new Date(e.timestamp).toISOString()}]`,
    `${e.payload.component}: `, e.payload.prev, '→', e.payload.next)
})
```

### Using History for AI Agents

The event history is one of the key features that makes Vio AI-agent-friendly. An MCP tool can call `getEventHistory()` to understand what happened in the app — without needing to instrument anything manually.

```typescript
// An MCP tool might do this:
const events = app.getEventHistory()
const lastNavigation = events.findLast(e => e.type === 'route:change')
const recentErrors = events.filter(e => e.type === 'error:occurred')
```

## Practical Patterns

### State Persistence

Automatically save and restore store state:

```typescript
// Save on every change
app.on('store:change', (event) => {
  localStorage.setItem('vio-store', JSON.stringify(event.payload.next))
})

// Restore on app start (before mount)
const saved = localStorage.getItem('vio-store')
if (saved) {
  const restored = JSON.parse(saved)
  // Use restored data as initial store state
}
```

### Route Analytics

Track page views:

```typescript
app.on('route:after', (event) => {
  analytics.pageView({
    path: event.payload.path,
    params: event.payload.params,
    timestamp: event.timestamp
  })
})
```

### Debug Logger

Log everything during development:

```typescript
if (import.meta.env.DEV) {
  app.on('*', (event) => {
    const time = new Date(event.timestamp).toLocaleTimeString()
    console.log(`%c[${time}] ${event.type}`, 'color: #888', event.payload)
  })
}
```

### Component Lifecycle Tracking

Monitor which components are alive:

```typescript
const mounted = new Set<string>()

app.on('component:mount', (event) => {
  mounted.add(event.payload.id as string)
  console.log('Mounted components:', [...mounted])
})

app.on('component:unmount', (event) => {
  mounted.delete(event.payload.id as string)
  console.log('Mounted components:', [...mounted])
})
```

## Event Reference

| Event Type | Payload Fields | When It Fires |
|-----------|---------------|--------------|
| `component:mount` | `name`, `id`, `state` | Component added to DOM |
| `component:unmount` | `name`, `id` | Component removed from DOM |
| `state:change` | `component`, `id`, `prev`, `next` | `setState` called on a component |
| `store:change` | `action`, `payload`, `prev`, `next` | `dispatch` called on the store |
| `route:before` | `from`, `to` | Before route resolution |
| `route:change` | `from`, `to`, `params` | After route resolved |
| `route:after` | `path`, `params` | After navigation complete |
| `batch:start` | `operations` | Batch operation begins |
| `batch:end` | `operations` | Batch operation ends |

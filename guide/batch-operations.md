# Batch Operations

Batch operations let you execute multiple actions against a Vio app in a single call. They are designed for AI agents that need to perform atomic multi-step UI updates without making many round-trip calls.

## Why Batching Exists

When an AI agent controls a Vio application through MCP devtools, it often needs to perform several operations in sequence -- update state, dispatch an action, navigate to a new route. Without batching, each operation is a separate call, which is slow and can leave the UI in intermediate states the user should never see.

`app.batch()` solves this by accepting an array of operations and executing them all synchronously in order. The event bus emits `batch:start` before the first operation and `batch:end` after the last, so observers can treat the entire batch as a single transaction.

## Using batch()

```typescript
app.batch([
  { action: 'setState', target: 'user-profile-1', payload: { name: 'Alice' } },
  { action: 'dispatch', payload: { action: 'incrementCount', value: 5 } },
  { action: 'navigate', target: '/dashboard' }
])
```

The method signature:

```typescript
app.batch(ops: BatchOperation[]): void
```

## BatchOperation

Each operation in the array is a `BatchOperation` object:

```typescript
interface BatchOperation {
  action: 'setState' | 'addComponent' | 'removeComponent'
         | 'updateProps' | 'dispatch' | 'navigate'
  target?: string
  payload?: unknown
}
```

| Field     | Type     | Description |
|-----------|----------|-------------|
| `action`  | `string` | The operation to perform (see supported actions below) |
| `target`  | `string` | The target identifier -- usually a component instance ID or route path |
| `payload` | `unknown`| Data for the operation -- shape depends on the action |

## Supported Actions

### setState

Update the state of a mounted component instance.

- **target**: Component instance ID
- **payload**: Partial state object to merge

```typescript
{ action: 'setState', target: 'counter-1', payload: { count: 10 } }
```

### dispatch

Dispatch an action to the global store.

- **payload**: Object with `action` (string) and optional `value`

```typescript
{ action: 'dispatch', payload: { action: 'addTodo', value: { text: 'Buy milk' } } }
```

:::tip
The `dispatch` action does not use `target`. The action name and value are both provided inside `payload`.
:::

### removeComponent

Unmount and remove a component instance from the DOM.

- **target**: Component instance ID

```typescript
{ action: 'removeComponent', target: 'modal-1' }
```

### navigate

Navigate to a different route.

- **target**: Route path

```typescript
{ action: 'navigate', target: '/settings' }
```

### addComponent

Declared in the `BatchOperation` type for adding a new component.

- **payload**: A `ComponentDef` object

```typescript
{
  action: 'addComponent',
  payload: {
    name: 'Notification',
    state: { message: 'Saved!', visible: true },
    render(state) {
      if (!state.visible) return { tag: 'span' }
      return { tag: 'div', props: { class: 'notification' }, children: [state.message] }
    }
  }
}
```

### updateProps

Declared in the `BatchOperation` type for updating component props.

- **target**: Component instance ID
- **payload**: New props object

```typescript
{ action: 'updateProps', target: 'header-1', payload: { title: 'New Title' } }
```

## Events

The event bus emits two events around batch execution:

| Event         | Payload                    | When |
|---------------|----------------------------|------|
| `batch:start` | `{ operations: number }`   | Before the first operation runs |
| `batch:end`   | `{ operations: number }`   | After the last operation completes |

Listen for these events to observe batch boundaries:

```typescript
app.on('batch:start', (e) => {
  console.log(`Batch starting with ${e.operations} operations`)
})

app.on('batch:end', (e) => {
  console.log(`Batch completed: ${e.operations} operations`)
})
```

:::warning
Operations within a batch execute synchronously and sequentially. If one operation throws an error, subsequent operations in the batch will not run, but `batch:end` will not be emitted either.
:::

## Use Cases

### AI Agent Multi-Step Update

An AI agent analyzing user behavior might update several parts of the UI at once:

```typescript
app.batch([
  // Update the user's recommendation list
  { action: 'setState', target: 'recommendations-1', payload: {
    items: ['Product A', 'Product B', 'Product C']
  }},
  // Update the notification badge
  { action: 'setState', target: 'nav-badge-1', payload: {
    count: 3
  }},
  // Dispatch a store action to log the event
  { action: 'dispatch', payload: {
    action: 'logActivity',
    value: { type: 'recommendations_updated' }
  }}
])
```

### Form Submission Flow

After a form is submitted, batch multiple state changes together:

```typescript
app.batch([
  // Clear the form
  { action: 'setState', target: 'contact-form-1', payload: {
    name: '', email: '', message: ''
  }},
  // Show a success message
  { action: 'setState', target: 'toast-1', payload: {
    visible: true, text: 'Message sent!'
  }},
  // Navigate to a confirmation page
  { action: 'navigate', target: '/thank-you' }
])
```

### Dashboard Initialization

Set up an entire dashboard view in a single batch:

```typescript
app.batch([
  { action: 'setState', target: 'sidebar-1', payload: { activeItem: 'overview' } },
  { action: 'setState', target: 'chart-1', payload: { data: chartData, loading: false } },
  { action: 'setState', target: 'stats-1', payload: { revenue: 12500, users: 340 } },
  { action: 'dispatch', payload: { action: 'setLastViewed', value: 'overview' } }
])
```

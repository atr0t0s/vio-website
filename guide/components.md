# Components

Components are the building blocks of a Vio application. A component is a plain object that describes **what** to render, not **how** -- it returns a JSON-like tree of `{ tag, props, children }` descriptors that the renderer converts to DOM elements.

## Defining a Component

Use `defineComponent()` to create a component definition:

```typescript
import { defineComponent } from '@atrotos/vio'

const MyComponent = defineComponent({
  name: 'MyComponent',
  state: { message: 'Hello' },
  render(state) {
    return {
      tag: 'div',
      children: [state.message]
    }
  }
})
```

### `defineComponent()` Options

| Option      | Type                                                              | Required | Description                                          |
|-------------|-------------------------------------------------------------------|----------|------------------------------------------------------|
| `name`      | `string`                                                          | Yes      | Unique name for the component                        |
| `state`     | `Record<string, unknown>`                                         | No       | Initial local state (defaults to `{}`)               |
| `render`    | `(state, store?) => VioNodeDescriptor`                            | Yes      | Pure function that returns the component tree         |
| `onMount`   | `(ctx: ComponentContext) => void \| (() => void)`                 | No       | Called after DOM insertion; may return a cleanup function |
| `onUpdate`  | `(ctx: ComponentContext, prevState: Record<string, unknown>) => void` | No  | Called after state changes                           |
| `onUnmount` | `(ctx: ComponentContext) => void`                                 | No       | Called before removal from DOM                       |

The return value of `defineComponent()` is a `ComponentDef` object that can be used in routes or nested inside other components.

## The Render Function

The render function is the heart of every component. It receives the component's **local state** and the optional **global store state**, and returns a `VioNodeDescriptor`.

```typescript
render(state: Record<string, unknown>, store?: Record<string, unknown>): VioNodeDescriptor
```

The render function must be **pure** -- given the same state and store, it must always return the same descriptor tree. This is what makes Vio deterministic and inspectable by AI agents.

```typescript
const UserCard = defineComponent({
  name: 'UserCard',
  state: { name: 'Alice', role: 'Admin' },
  render(state, store) {
    return {
      tag: 'div',
      props: { class: 'user-card' },
      children: [
        { tag: 'h2', children: [String(state.name)] },
        { tag: 'span', props: { class: 'role' }, children: [String(state.role)] },
        store?.theme === 'dark'
          ? { tag: 'p', children: ['Dark mode active'] }
          : null
      ]
    }
  }
})
```

::: tip
The render function re-runs whenever local state changes or the global store updates. Vio diffs the old and new descriptor trees and patches only the DOM nodes that changed.
:::

## VioNodeDescriptor

Every render function returns a `VioNodeDescriptor`. This is the core data structure of Vio:

```typescript
interface VioNodeDescriptor {
  tag: string | ComponentDef
  props?: Record<string, unknown>
  children?: VioChild[]
  key?: string | number
}

type VioChild = VioNodeDescriptor | string | number | boolean | null | undefined
```

### `tag`

The `tag` field determines what gets rendered:

- **`string`** -- An HTML element. For example, `'div'`, `'button'`, `'input'`.
- **`ComponentDef`** -- A nested component definition (the return value of `defineComponent()`). See [Nesting Components](#nesting-components) below.

### `props`

An object of HTML attributes and event handlers:

```typescript
{
  tag: 'button',
  props: {
    class: 'btn primary',            // HTML class attribute
    id: 'submit-btn',                // HTML id attribute
    disabled: true,                  // Boolean attribute
    style: { color: 'red', fontSize: '14px' }, // Style object
    onClick: () => console.log('clicked'),     // Event handler
    onMouseEnter: (e) => console.log(e),       // Any DOM event
  },
  children: ['Submit']
}
```

Props handling rules:

| Prop pattern      | Behavior                                       |
|-------------------|-------------------------------------------------|
| `on*` + function  | Attached as a DOM event listener (lowercased)  |
| `class`           | Set as `element.className`                     |
| `style` (object)  | Merged into `element.style`                    |
| `false` / `null` / `undefined` | Attribute is not set                |
| Other strings     | Set via `element.setAttribute()`               |

::: warning
Event handler prop names follow the DOM convention: `onClick`, `onInput`, `onChange`, etc. They are lowercased internally when attached (e.g., `onClick` becomes `element.onclick`).
:::

### `children`

An array of child nodes. Each child can be:

- **`VioNodeDescriptor`** -- A nested element or component
- **`string`** -- Rendered as a text node
- **`number`** -- Converted to a string text node
- **`boolean | null | undefined`** -- Ignored (useful for conditional rendering)

```typescript
{
  tag: 'ul',
  children: [
    { tag: 'li', children: ['Item 1'] },
    { tag: 'li', children: ['Item 2'] },
    showThird ? { tag: 'li', children: ['Item 3'] } : null,  // conditional
    { tag: 'li', children: [`Total: ${count}`] }              // interpolation
  ]
}
```

### `key`

An optional key for the diffing algorithm. Use keys when rendering lists of items that may be reordered:

```typescript
{
  tag: 'ul',
  children: items.map(item => ({
    tag: 'li',
    key: item.id,
    children: [item.label]
  }))
}
```

## Nesting Components

To render one component inside another, use the child component's `ComponentDef` as the `tag` value. Props passed to the descriptor are merged into the child component's state.

```typescript
const Badge = defineComponent({
  name: 'Badge',
  state: { label: '', color: 'blue' },
  render(state) {
    return {
      tag: 'span',
      props: {
        class: 'badge',
        style: { backgroundColor: String(state.color) }
      },
      children: [String(state.label)]
    }
  }
})

const Profile = defineComponent({
  name: 'Profile',
  state: { username: 'alice' },
  render(state) {
    return {
      tag: 'div',
      children: [
        { tag: 'h2', children: [String(state.username)] },
        {
          tag: Badge,  // Use the ComponentDef as the tag
          props: { label: 'Admin', color: 'green' }  // Props merge into Badge's state
        }
      ]
    }
  }
})
```

When the renderer encounters a `ComponentDef` tag, it:
1. Creates a fresh state from the component's default `state`
2. Merges the `props` from the descriptor into that state
3. Calls the child component's `render()` with the merged state
4. Recursively resolves the resulting tree

::: tip
This means you can use `props` to pass data to child components. The props are spread into the child's state object, overriding any defaults.
:::

## Local State

Each component has its own local state object. The initial state is defined in `defineComponent()`:

```typescript
const TodoList = defineComponent({
  name: 'TodoList',
  state: {
    items: [],
    filter: 'all'
  },
  render(state) {
    return {
      tag: 'div',
      children: [
        { tag: 'h2', children: [`Filter: ${state.filter}`] },
        // ... render items
      ]
    }
  }
})
```

### Updating State

State is updated through `ComponentContext.setState()`, which performs a **partial merge** (like `Object.assign`). The component re-renders after every state update.

From inside lifecycle hooks, use the `ctx` parameter:

```typescript
const Timer = defineComponent({
  name: 'Timer',
  state: { seconds: 0 },
  render(state) {
    return {
      tag: 'div',
      children: [`Elapsed: ${state.seconds}s`]
    }
  },
  onMount(ctx) {
    const interval = setInterval(() => {
      const current = ctx.getState()
      ctx.setState({ seconds: (current.seconds as number) + 1 })
    }, 1000)

    // Return a cleanup function to clear the interval
    return () => clearInterval(interval)
  }
})
```

From outside the component (e.g., the app runtime API):

```typescript
const app = createApp({ root: '#app', routes: [{ path: '/', component: Timer }] })
app.mount()

const tree = app.getComponentTree()
app.setState(tree.id, { seconds: 100 })  // Jump to 100 seconds
```

::: warning
State updates are **partial merges**, not replacements. Calling `setState({ seconds: 5 })` keeps all other state fields intact.
:::

## Lifecycle Hooks

Components have three lifecycle hooks that run at specific points in the component's life.

### `onMount(ctx)`

Called **after** the component is inserted into the DOM. Use it to set up timers, subscriptions, or other side effects.

If `onMount` returns a function, that function is called as a **cleanup** when the component is unmounted -- similar to the cleanup pattern in React's `useEffect`.

```typescript
const LiveClock = defineComponent({
  name: 'LiveClock',
  state: { time: new Date().toLocaleTimeString() },
  render(state) {
    return { tag: 'time', children: [String(state.time)] }
  },
  onMount(ctx) {
    const id = setInterval(() => {
      ctx.setState({ time: new Date().toLocaleTimeString() })
    }, 1000)

    return () => clearInterval(id)  // Cleanup on unmount
  }
})
```

### `onUpdate(ctx, prevState)`

Called **after** a state change triggers a re-render. Receives the `ComponentContext` and the **previous state** before the update.

```typescript
const Search = defineComponent({
  name: 'Search',
  state: { query: '', results: [] },
  render(state) {
    return {
      tag: 'div',
      children: [
        { tag: 'input', props: { value: state.query } },
        {
          tag: 'ul',
          children: (state.results as string[]).map(r => ({
            tag: 'li', children: [r]
          }))
        }
      ]
    }
  },
  onUpdate(ctx, prevState) {
    const current = ctx.getState()
    if (current.query !== prevState.query) {
      console.log(`Query changed from "${prevState.query}" to "${current.query}"`)
      // Could trigger a search API call here
    }
  }
})
```

### `onUnmount(ctx)`

Called **before** the component is removed from the DOM. Use it for final cleanup that is not covered by the `onMount` return function.

```typescript
const Tracker = defineComponent({
  name: 'Tracker',
  state: {},
  render() {
    return { tag: 'div', children: ['Tracking...'] }
  },
  onUnmount(ctx) {
    console.log('Tracker is being removed')
    // Send analytics, close connections, etc.
  }
})
```

### Lifecycle Order

1. `render()` -- produces the initial descriptor tree
2. DOM elements are created and inserted
3. **`onMount(ctx)`** -- component is now in the DOM
4. On state change: `render()` runs again, DOM is patched, then **`onUpdate(ctx, prevState)`**
5. On removal: `onMount` cleanup function runs (if returned), then **`onUnmount(ctx)`**, then DOM removal

## ComponentContext

Every lifecycle hook receives a `ComponentContext` object. This is the component's interface for interacting with the framework:

```typescript
interface ComponentContext {
  setState: (partial: Record<string, unknown>) => void
  getState: () => Record<string, unknown>
  emit: (event: string, payload?: unknown) => void
  getRef: (name: string) => HTMLElement | null
}
```

| Method     | Description                                                       |
|------------|-------------------------------------------------------------------|
| `setState` | Merge a partial state update into the component, triggering a re-render |
| `getState` | Get a copy of the component's current state                      |
| `emit`     | Emit a custom event on the app's event bus                       |
| `getRef`   | Get a DOM element reference by name (reserved for future use)    |

### Emitting Events

Components can communicate through the event bus using `ctx.emit()`:

```typescript
const LoginForm = defineComponent({
  name: 'LoginForm',
  state: { username: '', password: '' },
  render(state) {
    return {
      tag: 'form',
      children: [
        { tag: 'input', props: { placeholder: 'Username', value: state.username } },
        { tag: 'input', props: { type: 'password', value: state.password } },
        { tag: 'button', props: { type: 'submit' }, children: ['Login'] }
      ]
    }
  },
  onMount(ctx) {
    // Emit an event when the form is ready
    ctx.emit('login:ready', { component: 'LoginForm' })
  }
})
```

Events emitted with `ctx.emit()` include the component's instance ID automatically and flow through the global event bus. You can listen for them with `app.on()`:

```typescript
app.on('login:ready', (event) => {
  console.log(event) // { component: 'LoginForm-1', ... }
})
```

## Component IDs

Every mounted component instance receives a unique ID in the format `"ComponentName-N"`, where `N` is an auto-incrementing counter:

- `Counter-1`
- `Counter-2`
- `TodoList-3`

These IDs are used throughout the runtime API to identify specific component instances:

```typescript
app.setState('Counter-1', { count: 10 })
app.getState('Counter-1')  // { count: 10 }
app.removeComponent('Counter-1')
```

## Component Tree

Use `app.getComponentTree()` to inspect the current component hierarchy. It returns an object with the root component's ID, name, state, and children:

```typescript
const tree = app.getComponentTree()
console.log(tree)
// {
//   id: 'Counter-1',
//   name: 'Counter',
//   state: { count: 0 },
//   children: []
// }
```

This is the same data structure that AI agents see through the MCP devtools. It gives full visibility into the running application's state.

## Component Registry

You can register components globally with `app.register()` and list all registered component names with `app.getRegisteredComponents()`:

```typescript
app.register(Counter)
app.register(TodoList)

console.log(app.getRegisteredComponents())
// ['Counter', 'TodoList']
```

::: warning
Registering a component with a name that is already taken will throw an error. Each component name must be unique within the registry.
:::

## Full Example

Here is a complete example combining local state, lifecycle hooks, nested components, and event emission:

```typescript
import { createApp, defineComponent } from '@atrotos/vio'

// A reusable Button component
const Button = defineComponent({
  name: 'Button',
  state: { label: 'Click', variant: 'primary' },
  render(state) {
    return {
      tag: 'button',
      props: { class: `btn btn-${state.variant}` },
      children: [String(state.label)]
    }
  }
})

// A counter that uses Button and lifecycle hooks
const Counter = defineComponent({
  name: 'Counter',
  state: { count: 0 },
  render(state) {
    return {
      tag: 'div',
      props: { class: 'counter' },
      children: [
        { tag: 'h1', children: [`Count: ${state.count}`] },
        {
          tag: Button,
          props: { label: 'Increment', variant: 'primary' }
        },
        {
          tag: Button,
          props: { label: 'Reset', variant: 'secondary' }
        }
      ]
    }
  },
  onMount(ctx) {
    ctx.emit('counter:mounted')
    console.log('Counter is live with state:', ctx.getState())
  },
  onUpdate(ctx, prevState) {
    const current = ctx.getState()
    ctx.emit('counter:updated', {
      from: prevState.count,
      to: current.count
    })
  },
  onUnmount(ctx) {
    ctx.emit('counter:removed')
  }
})

// Wire it all up
const app = createApp({
  root: '#app',
  routes: [{ path: '/', component: Counter }]
})

app.mount()

// Listen for counter events
app.on('counter:updated', (e) => {
  console.log(`Count went from ${e.from} to ${e.to}`)
})

// Programmatic control
const tree = app.getComponentTree()
app.setState(tree.id, { count: 42 })
```

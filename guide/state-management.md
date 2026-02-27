# State Management

Vio provides two complementary systems for managing data: **local component state** for UI-specific data and a **global store** for shared application state. Both are immutable — every change produces a new state object, never a mutation.

## Local Component State

Every component can declare an initial `state` object inside `defineComponent`. This state is private to the component instance.

```typescript
import { defineComponent } from 'vio'

const Counter = defineComponent({
  name: 'Counter',
  state: { count: 0 },
  render(state) {
    return {
      tag: 'div',
      children: [
        { tag: 'p', children: [`Count: ${state.count}`] },
        {
          tag: 'button',
          props: { onClick: () => {} },
          children: ['Increment']
        }
      ]
    }
  }
})
```

The `state` property is shallow-copied when the component mounts, so each instance gets its own copy of the initial state.

### Updating State with `setState`

Use `setState` to update a component's state. It performs a **partial merge** — you only provide the fields you want to change, and the rest are preserved.

```typescript
const Counter = defineComponent({
  name: 'Counter',
  state: { count: 0, label: 'My Counter' },
  onMount(ctx) {
    // Only updates `count`; `label` is preserved
    ctx.setState({ count: 1 })
  },
  render(state) {
    return {
      tag: 'div',
      children: [
        { tag: 'h3', children: [state.label as string] },
        { tag: 'span', children: [`${state.count}`] }
      ]
    }
  }
})
```

You can also call `setState` from outside the component through the app instance:

```typescript
const app = createApp({ root: '#app', routes: [{ path: '/', component: Counter }] })
app.mount()

// Update by instance ID
app.setState('Counter-1', { count: 10 })
```

### How setState Triggers Re-renders

When `setState` is called, Vio follows this cycle:

1. The previous state is captured as a snapshot
2. The new state is created by merging: `{ ...currentState, ...partial }`
3. A `state:change` event is emitted on the event bus
4. The component's `render` function is called with the new state
5. The new virtual tree is **diffed** against the previous tree
6. Only the changed patches are applied to the real DOM
7. The `onUpdate` lifecycle hook is called with the previous state

```typescript
const Timer = defineComponent({
  name: 'Timer',
  state: { seconds: 0 },
  onMount(ctx) {
    const interval = setInterval(() => {
      const current = ctx.getState()
      ctx.setState({ seconds: (current.seconds as number) + 1 })
    }, 1000)
    // Return cleanup function
    return () => clearInterval(interval)
  },
  onUpdate(ctx, prevState) {
    console.log(`Timer updated: ${prevState.seconds} → ${ctx.getState().seconds}`)
  },
  render(state) {
    return {
      tag: 'div',
      props: { class: 'timer' },
      children: [`Elapsed: ${state.seconds}s`]
    }
  }
})
```

::: tip
The diff/patch cycle means Vio only touches the DOM nodes that actually changed. You never need to worry about optimizing re-renders — return your full tree every time and let the diffing engine handle the rest.
:::

## Global Store

For state that needs to be shared across components — user authentication, theme preferences, shopping cart data — use the global store.

### Defining a Store

A store is configured with `state` (initial values) and `actions` (pure reducer functions):

```typescript
import { createApp } from 'vio'

const store = {
  state: {
    user: null,
    theme: 'dark',
    notifications: []
  },
  actions: {
    setUser(state, user) {
      return { ...state, user }
    },
    setTheme(state, theme) {
      return { ...state, theme }
    },
    addNotification(state, notification) {
      return {
        ...state,
        notifications: [...(state.notifications as any[]), notification]
      }
    },
    clearNotifications(state) {
      return { ...state, notifications: [] }
    }
  }
}

const app = createApp({
  root: '#app',
  store,
  routes: [{ path: '/', component: HomeComponent }]
})
```

### Actions Are Pure Reducers

Every action is a function that receives the current state and an optional payload, and **returns a brand-new state object**:

```typescript
(currentState, payload?) => newState
```

::: warning
Actions must **never** mutate the state object directly. Always spread or create a new object. Vio replaces the entire state with whatever your action returns.
:::

```typescript
// CORRECT — returns new state
const actions = {
  increment(state) {
    return { ...state, count: (state.count as number) + 1 }
  },
  addItem(state, item) {
    return { ...state, items: [...(state.items as any[]), item] }
  }
}

// WRONG — mutates state in place
const badActions = {
  increment(state) {
    state.count = (state.count as number) + 1  // mutation!
    return state  // same reference
  }
}
```

### Dispatching Actions

Use `app.dispatch()` to trigger a store action:

```typescript
app.dispatch('setUser', { id: 1, name: 'Alice' })
app.dispatch('setTheme', 'light')
app.dispatch('addNotification', { text: 'Welcome!', type: 'info' })
app.dispatch('clearNotifications')
```

If you dispatch an action that does not exist, Vio throws an error:

```typescript
app.dispatch('unknownAction')
// Error: Unknown store action: "unknownAction"
```

### Accessing Store State in Render

Component `render` functions receive local state as the first argument and the global store state as the second:

```typescript
const Header = defineComponent({
  name: 'Header',
  state: {},
  render(state, storeState) {
    const user = storeState?.user as { name: string } | null
    const theme = storeState?.theme as string

    return {
      tag: 'header',
      props: { class: `header ${theme}` },
      children: [
        { tag: 'span', children: [user ? `Hello, ${user.name}` : 'Guest'] }
      ]
    }
  }
})
```

::: tip
When the global store changes, **all mounted components automatically re-render**. The renderer listens for `store:change` events and triggers a diff/patch cycle on every component instance.
:::

### Store Subscriptions

You can subscribe to store changes directly for side effects like logging, persistence, or analytics:

```typescript
const store = app // after creating the app

// Subscribe returns an unsubscribe function
const unsubscribe = store.on('store:change', (event) => {
  console.log('Action:', event.payload.action)
  console.log('Previous state:', event.payload.prev)
  console.log('New state:', event.payload.next)
})

// Later, stop listening
unsubscribe()
```

You can also use the `store:change` event for persistence:

```typescript
app.on('store:change', (event) => {
  localStorage.setItem('appState', JSON.stringify(event.payload.next))
})
```

### Reading Store State

Outside of render functions, read the current store state with `app.getStore()`:

```typescript
const currentState = app.getStore()
console.log(currentState.user)
console.log(currentState.theme)
```

This returns a copy of the state, so modifying the returned object has no effect on the store.

## Local State vs Global Store

| Concern | Local State | Global Store |
|---------|-------------|--------------|
| Scope | Single component instance | Entire application |
| Access | `render(state)` | `render(state, storeState)` |
| Update | `ctx.setState({ ... })` | `app.dispatch('action', payload)` |
| Triggers re-render of | That component only | All mounted components |
| Use for | UI state, form inputs, toggles | Auth, settings, shared data |

::: tip When to use which
Use **local state** for data that only one component cares about — toggle flags, input values, animation state. Use the **global store** for data that multiple components need to read or that should survive navigation between routes.
:::

## Complete Example

Here is a full example combining local and global state:

```typescript
import { createApp, defineComponent } from 'vio'

// Global store for todos
const store = {
  state: {
    todos: [],
    filter: 'all'
  },
  actions: {
    addTodo(state, text) {
      const todos = state.todos as any[]
      return {
        ...state,
        todos: [...todos, { id: Date.now(), text, done: false }]
      }
    },
    toggleTodo(state, id) {
      const todos = (state.todos as any[]).map(t =>
        t.id === id ? { ...t, done: !t.done } : t
      )
      return { ...state, todos }
    },
    setFilter(state, filter) {
      return { ...state, filter }
    }
  }
}

// Component with local state for input field
const TodoApp = defineComponent({
  name: 'TodoApp',
  state: { inputText: '' },  // local state
  render(state, storeState) {
    const todos = storeState?.todos as any[] ?? []
    const filter = storeState?.filter as string ?? 'all'

    const filtered = todos.filter(t => {
      if (filter === 'done') return t.done
      if (filter === 'active') return !t.done
      return true
    })

    return {
      tag: 'div',
      children: [
        { tag: 'h1', children: ['Todo List'] },
        {
          tag: 'div',
          children: [
            {
              tag: 'input',
              props: {
                type: 'text',
                value: state.inputText,
                placeholder: 'Add a todo...'
              }
            },
            { tag: 'button', children: ['Add'] }
          ]
        },
        {
          tag: 'ul',
          children: filtered.map(todo => ({
            tag: 'li',
            key: todo.id,
            props: {
              style: { textDecoration: todo.done ? 'line-through' : 'none' }
            },
            children: [todo.text]
          }))
        }
      ]
    }
  }
})

const app = createApp({
  root: '#app',
  store,
  routes: [{ path: '/', component: TodoApp }]
})

app.mount()

// Dispatch store actions from anywhere
app.dispatch('addTodo', 'Read the Vio docs')
app.dispatch('addTodo', 'Build something')
app.dispatch('toggleTodo', app.getStore().todos[0].id)
app.dispatch('setFilter', 'active')
```

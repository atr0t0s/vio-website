# Forms

Vio provides a declarative form system through `createForm()`. Define fields with initial values, validation rules, and labels, then interact with the form programmatically or render it as a Vio node descriptor.

## Creating a Form

```typescript
import { createForm } from 'vio'

const form = createForm({
  fields: {
    username: { initial: '', label: 'Username', type: 'text' },
    email: { initial: '', label: 'Email', type: 'email' },
    age: { initial: 0, label: 'Age', type: 'number' }
  }
})
```

The `createForm` function accepts a `FormConfig` object:

```typescript
interface FormConfig {
  fields: Record<string, FieldDef>
  onSubmit?: (values: Record<string, unknown>) => void
}
```

## Field Definition

Each field is described by a `FieldDef`:

```typescript
interface FieldDef {
  initial: unknown                           // Starting value
  validate?: (value: unknown) => string | null // Validation function
  label?: string                             // Display label
  type?: string                              // Input type (defaults to 'text')
}
```

| Property   | Required | Description |
|------------|----------|-------------|
| `initial`  | Yes      | The initial value for the field |
| `validate` | No       | Returns an error message string or `null` if valid |
| `label`    | No       | Label text rendered alongside the input |
| `type`     | No       | HTML input type: `'text'`, `'email'`, `'number'`, `'password'`, etc. Defaults to `'text'` |

## Validation Functions

A validation function receives the current field value and returns either a string (error message) or `null` (valid):

```typescript
const form = createForm({
  fields: {
    email: {
      initial: '',
      label: 'Email',
      type: 'email',
      validate: (value) => {
        const v = value as string
        if (!v) return 'Email is required'
        if (!v.includes('@')) return 'Must be a valid email'
        return null
      }
    },
    password: {
      initial: '',
      label: 'Password',
      type: 'password',
      validate: (value) => {
        const v = value as string
        if (v.length < 8) return 'Must be at least 8 characters'
        return null
      }
    }
  }
})
```

:::tip
Validation functions are pure -- they receive the value and return a result. This makes them easy to test in isolation.
:::

## Form Methods

The `VioForm` object returned by `createForm()` exposes these methods:

### getValues()

Returns a shallow copy of all current field values:

```typescript
const values = form.getValues()
// { email: '', password: '' }
```

### setValue(field, value)

Sets the value of a single field. The field name must match a key in the original `fields` config:

```typescript
form.setValue('email', 'alice@example.com')
form.setValue('password', 'secret123')
```

:::warning
Calling `setValue` with a field name that does not exist in the form config is silently ignored.
:::

### validate()

Runs all validation functions and returns a record mapping field names to error messages (or `null` if valid):

```typescript
const errors = form.validate()
// { email: null, password: 'Must be at least 8 characters' }
```

Fields without a `validate` function always return `null`.

### isValid()

Returns `true` if every field passes validation:

```typescript
if (form.isValid()) {
  submitData(form.getValues())
}
```

### reset()

Resets all fields to their `initial` values:

```typescript
form.reset()
// All fields are back to their starting values
```

## Rendering with toNodeDescriptor()

`form.toNodeDescriptor()` returns a `VioNodeDescriptor` representing the form as HTML. This descriptor can be used as the return value of a component's `render` function.

The generated structure looks like this:

```typescript
// For a form with fields { username, email }:
{
  tag: 'form',
  children: [
    {
      tag: 'div',
      props: { class: 'form-field' },
      children: [
        { tag: 'label', props: { for: 'username' }, children: ['Username'] },
        { tag: 'input', props: { type: 'text', name: 'username', id: 'username', value: '' } }
      ]
    },
    {
      tag: 'div',
      props: { class: 'form-field' },
      children: [
        { tag: 'label', props: { for: 'email' }, children: ['Email'] },
        { tag: 'input', props: { type: 'email', name: 'email', id: 'email', value: '' } }
      ]
    }
  ]
}
```

Each field is wrapped in a `<div class="form-field">`. If a `label` is defined, a `<label>` element is rendered before the `<input>`.

## Using Forms Inside Components

Here is a complete example of a login form component:

```typescript
import { createForm } from 'vio'

const LoginForm = {
  name: 'LoginForm',
  state: { submitted: false, errors: {} },

  onMount(ctx) {
    const form = createForm({
      fields: {
        email: {
          initial: '',
          label: 'Email',
          type: 'email',
          validate: (v) => (v as string).includes('@') ? null : 'Invalid email'
        },
        password: {
          initial: '',
          label: 'Password',
          type: 'password',
          validate: (v) => (v as string).length >= 8 ? null : 'Too short'
        }
      }
    })

    // Store the form instance in state so render can access it
    ctx.setState({ form })
  },

  render(state) {
    if (!state.form) {
      return { tag: 'p', children: ['Loading...'] }
    }

    const form = state.form as VioForm
    return {
      tag: 'div',
      children: [
        form.toNodeDescriptor(),
        {
          tag: 'button',
          props: {
            onclick: () => {
              if (form.isValid()) {
                console.log('Submitting:', form.getValues())
              }
            }
          },
          children: ['Log In']
        }
      ]
    }
  }
}
```

## Form Validation Workflow

A typical validation workflow follows these steps:

1. **Create the form** with field definitions and validation rules
2. **Collect input** using `setValue()` as the user interacts with the form
3. **Validate on submit** by calling `validate()` or `isValid()`
4. **Display errors** from the validation result
5. **Reset if needed** using `reset()`

```typescript
const form = createForm({
  fields: {
    name: {
      initial: '',
      label: 'Name',
      validate: (v) => (v as string).trim() ? null : 'Name is required'
    },
    email: {
      initial: '',
      label: 'Email',
      type: 'email',
      validate: (v) => {
        const s = v as string
        if (!s) return 'Email is required'
        if (!/^[^@]+@[^@]+$/.test(s)) return 'Invalid email format'
        return null
      }
    }
  }
})

// Simulate user input
form.setValue('name', 'Alice')
form.setValue('email', 'not-an-email')

// Check validation
const errors = form.validate()
// { name: null, email: 'Invalid email format' }

if (!form.isValid()) {
  // Show errors to the user
  for (const [field, error] of Object.entries(errors)) {
    if (error) console.log(`${field}: ${error}`)
  }
}

// After fixing input
form.setValue('email', 'alice@example.com')
console.log(form.isValid()) // true
```

# Forms

The `createForm` function builds a form manager with field definitions, validation, and the ability to render to a Vio node descriptor.

## Import

```ts
import { createForm } from 'vio'
```

## createForm Signature

```ts
function createForm(config: FormConfig): VioForm
```

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `config` | [`FormConfig`](#formconfig) | Yes | Form configuration with field definitions and optional submit handler |

### FormConfig

```ts
interface FormConfig {
  fields: Record<string, FieldDef>
  onSubmit?: (values: Record<string, unknown>) => void
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `fields` | `Record<string, FieldDef>` | Yes | Map of field name to field definition |
| `onSubmit` | `(values: Record<string, unknown>) => void` | No | Callback invoked on form submission |

### FieldDef

```ts
interface FieldDef {
  initial: unknown
  validate?: (value: unknown) => string | null
  label?: string
  type?: string
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `initial` | `unknown` | Yes | Initial value for the field |
| `validate` | `(value: unknown) => string \| null` | No | Validation function. Return `null` for valid, or a string error message. |
| `label` | `string` | No | Display label for the field |
| `type` | `string` | No | HTML input type (defaults to `'text'`) |

## Return Type

Returns a [`VioForm`](#vioform-interface) instance.

## VioForm Interface {#vioform-interface}

```ts
interface VioForm {
  getValues(): Record<string, unknown>
  setValue(field: string, value: unknown): void
  validate(): Record<string, string | null>
  isValid(): boolean
  reset(): void
  toNodeDescriptor(): VioNodeDescriptor
}
```

## Methods

### getValues()

Returns a shallow copy of all current field values.

```ts
getValues(): Record<string, unknown>
```

```ts
const values = form.getValues()
console.log(values.email) // 'user@example.com'
```

### setValue(field, value)

Sets the value of a specific field. The field name must match a key in the `fields` config. Unknown field names are silently ignored.

```ts
setValue(field: string, value: unknown): void
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `field` | `string` | Field name |
| `value` | `unknown` | New value |

```ts
form.setValue('email', 'alice@example.com')
form.setValue('age', 30)
```

### validate()

Runs validation on all fields. Returns an object mapping field names to error messages (`string`) or `null` if the field is valid. Fields without a `validate` function always return `null`.

```ts
validate(): Record<string, string | null>
```

```ts
const errors = form.validate()
// { email: null, age: 'Must be at least 18' }
```

### isValid()

Returns `true` if all fields pass validation (all `validate` functions return `null`). Fields without a `validate` function are considered valid.

```ts
isValid(): boolean
```

```ts
if (form.isValid()) {
  submitData(form.getValues())
}
```

### reset()

Resets all field values to their `initial` values as defined in the `FieldDef`.

```ts
reset(): void
```

```ts
form.reset()
// All fields back to initial values
```

### toNodeDescriptor()

Generates a [`VioNodeDescriptor`](./types#vionodedescriptor) representing the form as HTML. Each field is wrapped in a `<div class="form-field">` containing an optional `<label>` and an `<input>`.

```ts
toNodeDescriptor(): VioNodeDescriptor
```

The generated structure:

```ts
{
  tag: 'form',
  children: [
    {
      tag: 'div',
      props: { class: 'form-field' },
      children: [
        { tag: 'label', props: { for: 'email' }, children: ['Email'] },
        {
          tag: 'input',
          props: {
            type: 'text',
            name: 'email',
            id: 'email',
            value: 'current-value'
          }
        }
      ]
    }
    // ...one div per field
  ]
}
```

```ts
const LoginForm = defineComponent({
  name: 'LoginForm',
  state: {},
  render: () => form.toNodeDescriptor()
})
```

## Full Example

```ts
import { createForm, defineComponent, createApp } from 'vio'

const form = createForm({
  fields: {
    username: {
      initial: '',
      label: 'Username',
      validate: (v) => {
        if (!v || (v as string).length < 3) return 'Username must be at least 3 characters'
        return null
      }
    },
    email: {
      initial: '',
      label: 'Email',
      type: 'email',
      validate: (v) => {
        if (!v || !(v as string).includes('@')) return 'Invalid email address'
        return null
      }
    },
    age: {
      initial: 0,
      label: 'Age',
      type: 'number',
      validate: (v) => {
        if ((v as number) < 18) return 'Must be at least 18'
        return null
      }
    }
  },
  onSubmit: (values) => {
    console.log('Submitted:', values)
  }
})

// Set values
form.setValue('username', 'alice')
form.setValue('email', 'alice@example.com')
form.setValue('age', 25)

// Validate
const errors = form.validate()
console.log(errors) // { username: null, email: null, age: null }
console.log(form.isValid()) // true

// Get all values
console.log(form.getValues())
// { username: 'alice', email: 'alice@example.com', age: 25 }

// Render as a component
const SignupPage = defineComponent({
  name: 'SignupPage',
  render: () => ({
    tag: 'div',
    children: [
      { tag: 'h1', children: ['Sign Up'] },
      form.toNodeDescriptor()
    ]
  })
})

// Reset to initial values
form.reset()
console.log(form.getValues())
// { username: '', email: '', age: 0 }
```

## Related

- [VioForm type](./types#vioform)
- [Forms guide](/guide/forms)
- [defineComponent](./define-component)

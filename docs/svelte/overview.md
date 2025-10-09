## Svelte 5 Runes

- `$state`: Declare reactive state

  ```typescript
  let count = $state(0);
  let user = $state({ name: '', email: '' });
  // For HTML elements (use generic typing):
  let fileInput = $state<HTMLInputElement>();
  ```

- `$derived`: Compute derived values (replaces $: reactive statements)

  ```typescript
  let doubled = $derived(count * 2);
  let fullName = $derived(`${user.firstName} ${user.lastName}`);
  ```

- `$effect`: Manage side effects and lifecycle (replaces $: for side effects)

  ```typescript
  $effect(() => {
  	console.log(`Count is now ${count}`);
  	return () => {
  		// Optional cleanup
  	};
  });
  ```

- `$props`: Declare component props (replaces export let)

  ```typescript
  interface Props {
  	optionalProp?: number;
  	requiredProp: string;
  	error?: { field: string; message: string } | null;
  }

  let { optionalProp = 42, requiredProp, error = null }: Props = $props();
  ```

- `$bindable`: Create two-way bindable props

  ```typescript
  let { bindableProp = $bindable() } = $props();
  ```

- `$inspect`: Debug reactive state (development only)
  ```typescript
  $inspect(count);
  ```

## Svelte 5 Migration Best Practices

### Component Props Pattern

Always use proper TypeScript interfaces for component props to prevent type errors:

```typescript
// ❌ Wrong - causes prop mismatch errors
export let value: string;
export let error: ErrorType | null = null;

// ✅ Correct - use $props with interface
interface Props {
	value: string;
	error?: ErrorType | null;
	customPrompt?: string;
	onOptionChange?: (value: string) => void;
}

let { value, error = null, customPrompt = '', onOptionChange = () => {} }: Props = $props();
```

### Event Handler Migration

```typescript
// ❌ Svelte 4
<button on:click={handleClick}>Click me</button>

// ✅ Svelte 5
<button onclick={handleClick}>Click me</button>
```

### Variable Naming Conflicts

Avoid naming conflicts with runes:

```typescript
// ❌ Causes conflicts with $state rune
export let state: MyState;
let isLoading = $state(false); // Error: state conflict

// ✅ Rename conflicting variables
interface Props {
	state: MyState;
}
let { state: formState }: Props = $props();
let isLoading = $state(false); // Now works
```

### HTML Element References

```typescript
// ❌ Wrong typing
let fileInput: HTMLInputElement = $state();

// ✅ Correct generic typing
let fileInput = $state<HTMLInputElement>();

// Usage with null safety
const handleClick = () => {
	fileInput?.click();
};
```

### Remove Export Statements

When migrating to `$props`, remove conflicting export statements:

```typescript
// ❌ Remove these - they cause redeclaration errors
export const error: ErrorType = null;
export const customPrompt: string = '';

// ✅ Use props destructuring instead
let { error = null, customPrompt = '' }: Props = $props();
```

## UI and Styling

- Use Tailwind CSS v4 for utility-first styling approach.
- Leverage Shadcn components for pre-built, customizable UI elements.
- Import Shadcn components from `$lib/components/ui`.
- Install new ones with `pnpm dlx shadcn-svelte@latest add <component_name>`. The documentation is available at https://shadcn-svelte.com/docs/installation/sveltekit.
- Use Svelte's built-in transition and animation features.
- Use Lucide for icons.

## Shadcn Color Conventions

- Use `background` and `foreground` convention for colors.
- Define CSS variables with oklch color space function:
  ```css
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  ```
- Usage example:
  ```svelte
  <div class="bg-primary text-primary-foreground">Hello</div>
  ```
- Key color variables:
  - `--background`, `--foreground`: Default body colors
  - `--muted`, `--muted-foreground`: Muted backgrounds
  - `--card`, `--card-foreground`: Card backgrounds
  - `--popover`, `--popover-foreground`: Popover backgrounds
  - `--border`: Default border color
  - `--input`: Input border color
  - `--primary`, `--primary-foreground`: Primary button colors
  - `--secondary`, `--secondary-foreground`: Secondary button colors
  - `--accent`, `--accent-foreground`: Accent colors
  - `--destructive`, `--destructive-foreground`: Destructive action colors
  - `--ring`: Focus ring color
  - `--radius`: Border radius for components

## SvelteKit Project Structure

- Use the recommended SvelteKit project structure:
  ```
  - src/
    - lib/
    - routes/
    - app.html
  - static/
  - svelte.config.js
  - vite.config.js
  ```

## Component Development

- Create .svelte files for Svelte components.
- Use .svelte.ts files for component logic and state machines.
- Implement proper component composition and reusability.
- Use Svelte's props for data passing.
- Leverage Svelte's reactive declarations for local state management.

## State Management

- Use classes for complex state management (state machines):

  ```typescript
  // counter.svelte.ts
  class Counter {
  	count = $state(0);
  	incrementor = $state(1);

  	increment() {
  		this.count += this.incrementor;
  	}

  	resetCount() {
  		this.count = 0;
  	}

  	resetIncrementor() {
  		this.incrementor = 1;
  	}
  }

  export const counter = new Counter();
  ```

- Use in components:

  ```svelte
  <script lang="ts">
  	import { counter } from './counter.svelte.ts';
  </script>

  <button on:click={() => counter.increment()}>
  	Count: {counter.count}
  </button>
  ```

## Routing and Pages

- Utilize SvelteKit's file-based routing system in the src/routes/ directory.
- Implement dynamic routes using [slug] syntax.
- Use load functions for server-side data fetching and pre-rendering.
- Implement proper error handling with +error.svelte pages.

## Server-Side Rendering (SSR) and Static Site Generation (SSG)

- Leverage SvelteKit's SSR capabilities for dynamic content.
- Implement SSG for static pages using prerender option.
- Use the adapter-auto for automatic deployment configuration.

## Performance Optimization

- Leverage Svelte's compile-time optimizations.
- Use `{#key}` blocks to force re-rendering of components when needed.
- Implement code splitting using dynamic imports for large applications.
- Profile and monitor performance using browser developer tools.
- Use `$effect.tracking()` to optimize effect dependencies.
- Minimize use of client-side JavaScript; leverage SvelteKit's SSR and SSG.
- Implement proper lazy loading for images and other assets.

## Enhanced Images

This project uses `@sveltejs/enhanced-img` for optimized image handling. Always use enhanced images for better performance and user experience.

- Always import images with the `?enhanced` query parameter:

  ```typescript
  // ✅ Correct - use ?enhanced for optimization
  import heroImage from '$lib/assets/images/hero.png?enhanced';
  import avatarImg from '$lib/assets/images/avatar.jpg?enhanced';

  // ❌ Wrong - regular imports don't get optimized
  import heroImage from '$lib/assets/images/hero.png';
  ```

- Use `<enhanced:img>` instead of regular `<img>` tags:

  ```svelte
  <!-- ✅ Correct - enhanced image with proper attributes -->
  <enhanced:img
  	src={heroImage}
  	alt="Hero section illustration"
  	class="h-64 w-full object-cover"
  	sizes="(min-width: 768px) 100vw, 50vw"
  />

  <!-- For small images like avatars, specify sizes -->
  <enhanced:img
  	src={avatarImg}
  	alt="User avatar"
  	class="h-10 w-10 rounded-full object-cover"
  	sizes="40px"
  />
  ```

- **Always specify sizes attribute** for responsive images:
  - For small fixed-size images: `sizes="40px"`
  - For responsive images: `sizes="(min-width: 768px) 100vw, 50vw"`

- **Use appropriate CSS classes**: `object-cover`, `rounded-full`, responsive width classes

- **Image organization**: Store images in `$lib/assets/images/` directory with descriptive filenames

- **Common patterns**:

  ```svelte
  <!-- Avatars -->
  <enhanced:img
  	src={agentImage}
  	alt={agentName}
  	class="h-12 w-12 rounded-full object-cover"
  	sizes="48px"
  />

  <!-- Hero images -->
  <enhanced:img
  	src={heroImage}
  	alt="Product showcase"
  	class="h-96 w-full object-cover"
  	sizes="100vw"
  />
  ```

- **Per-image transforms** using query parameters:

  ```svelte
  <!-- Quality adjustment -->
  <enhanced:img src={heroImage + '&quality=80'} alt="Hero" />

  <!-- Custom width generation -->
  <enhanced:img src={cardImage + '&w=400;800;1200'} alt="Card" />
  ```

- **Benefits**: Multiple format generation (`.avif`, `.webp`), responsive sizes, automatic width/height attributes, EXIF stripping, build-time optimization

## Data Fetching and API Routes

- Use load functions for server-side data fetching.
- Implement proper error handling for data fetching operations.
- Create API routes in the src/routes/api/ directory.
- Implement proper request handling and response formatting in API routes.
- Use SvelteKit's hooks for global API middleware.

## Remote Functions

SvelteKit's remote functions provide a type-safe and streamlined way to handle client-server communication. They allow you to call server-side code from the client as if it were a local function.

For a comprehensive guide on using `query`, `form`, `command`, and `prerender`, as well as best practices for validation, optimistic updates, and security, please read the svelte remote-functions documentation before trying to implement something related.

## Forms and Actions

For new forms, use the modern shadcn-svelte Form components with Formsnap v2:

### Recommended Form Pattern

```typescript
// 1. Define Zod schema
const formSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z.string().min(8, 'Password must be at least 8 characters')
});

// 2. In +page.server.ts
export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod(formSchema));
		if (!form.valid) return fail(400, { form });

		// Handle form submission
		return { form };
	}
};

// 3. In component
import * as Form from '$lib/components/ui/form';
import { formFieldProxy, superForm } from 'sveltekit-superforms';
import { zodClient } from 'sveltekit-superforms/adapters';

const form = superForm(data.form, {
	validators: zodClient(formSchema)
});
const { form: formData, enhance } = form;

// 4. Create field proxies for better reactivity
const email = formFieldProxy(form, 'email');
const password = formFieldProxy(form, 'password');
```

### Form Component Structure

```svelte
<form method="POST" use:enhance>
	<Form.Field {form} name="email">
		<Form.Control let:attrs>
			<Form.Label>Email</Form.Label>
			<Input {...attrs} bind:value={$email} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="password">
		<Form.Control let:attrs>
			<Form.Label>Password</Form.Label>
			<Input type="password" {...attrs} bind:value={$password} />
		</Form.Control>
		<Form.Description>Must be at least 8 characters long</Form.Description>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Button>Submit</Form.Button>
</form>
```

### Form Best Practices

- Use shadcn-svelte Form components for new forms: https://shadcn-svelte.com/docs/components/form
- Implement proper Zod validation schemas
- Use `formFieldProxy` for reactive field access
- Utilize SvelteKit's form actions for server-side form handling
- Use progressive enhancement for JavaScript-optional form submissions
- Always include proper ARIA attributes and field descriptions for accessibility

## Accessibility

- Ensure proper semantic HTML structure in Svelte components.
- Implement ARIA attributes where necessary.
- Ensure keyboard navigation support for interactive elements.
- Use Svelte's bind:this for managing focus programmatically.

## Key Conventions

1. Embrace Svelte's simplicity and avoid over-engineering solutions.
2. Use SvelteKit for full-stack applications with SSR and API routes.
3. Prioritize Web Vitals (LCP, FID, CLS) for performance optimization.
4. Use environment variables for configuration management.
5. Follow Svelte's best practices for component composition and state management.
6. Ensure cross-browser compatibility by testing on multiple platforms.
7. Keep your Svelte and SvelteKit versions up to date.
8. Use `pnpm` for all package management operations instead of `npm`.

## Official Documentation

- Svelte 5 Runes: https://svelte.dev/docs/svelte/v5-migration-guide
- Svelte: https://svelte.dev/llms-medium.txt
- SvelteKit: https://svelte.dev/docs/kit/llms.txt
- Svelte CLI: https://svelte.dev/docs/cli/llms.txt
- SvelteKit Enhanced Images: https://svelte.dev/docs/kit/images/llms.txt

Browse them if something from our internal docs and rules is not clear enough or is missing some details.

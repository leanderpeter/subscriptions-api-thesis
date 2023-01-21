## Names

1. Code in US-English
   ```typescript
   // Bad
   const someVar = "cancelled";
   // Good
   const someVar = "canceled";
   ```
   Always use US-english spelling
2. Use PascalCase for type names.
   ```typescript
   // Bad
   type car = {};
   // Good
   type Car = {};
   ```
3. Do not use `I` as a prefix for interface names.

   ```typescript
   // Bad
   interface I_dependencies {}
   // Good
   interface Dependencies {}
   ```

4. Use PascalCase for enum values.
   ```typescript
   // Bad
   enum status_codes {}
   // Good
   enum StatusCodes {}
   ```
5. Use UPPER_CASE for enum members
   ```typescript
   // Bad
   enum StatusCodes {
     success = 200,
   }
   // Good
   enum StatusCodes {
     SUCCESS = 200,
   }
   ```
6. Use camelCase for function names.
   ```typescript
   // Bad
   function map_to_product(input: ProductRecord): Product {}
   // Good
   function mapToProduct(input: ProductRecord): Product {}
   ```
7. Use camelCase for property names and local variables.
   ```typescript
   // Bad
   let car_id;
   // Good
   let carId;
   ```
8. Use snake_case incoming and outgoing JSON propertie names
   ```typescript
   // Bad
   type Response = { carId: string };
   // Good
   type Response = { car_id: string };
   ```
9. Do not use `_` as a prefix for private properties.
   ```typescript
   // Good
   private readonly _connection: AxiosInstance
   // Bad
   private readonly connection: AxiosInstance
   ```
10. Use whole words in names when possible.
   ```typescript
   // Bad
   let cncld;
   // Good
   let canceled;
   ```
11. Name tests specific to their behavior
   - Test naming strategy: `"[success/error] - [description of expected behavior]"`
   ```typescript
   // Good
   test("success - should return a subscription when every dependency passes", () => {});
   test("error - should throw an error when SubscriptionRepository fails", () => {});
   test("error - should throw NotFoundError on missing Subscription", () => {});
   // Bad
   test("fail", () => {});
   test("throws error", () => {});
   test("NotFound", () => {});
   test("error because of dependency failure", () => {});
   ```

## Types

1. Do not export types/functions unless you need to share it across multiple components.
2. Do not introduce new types/values to the global namespace.
3. Shared types should be defined in `~/src/domain/types/...`.
4. Within a file, type definitions should come first.

## Imports

Use the following order for module imports.

1. "builtin",
2. "external",
3. "internal",
   1. "index"
   2. "sibling"
   3. "parent"
   4. "object"

We do this for at least two good reasons:

1. This adds a light-weight hierarchical structure to the imports, which facilitates the understanding of the dependency network between all of the modules in your project.
2. As is almost always the case, having conventions such as these frees up a few more mental cycles when writing code.

## `null` and `undefined`

1. Use `undefined`. Do not use `null`.

## Logging

One of our principles is to make things visible. We want our services to talk to us, to tell us how they are doing and to give us to chance to help them when they are struggling. Each log entry must include:

1. Timestamp (time) - so we know when it happened
2. Log level (level)- so we know what it’s meant to express (error, warning, etc)
3. Info about source (scope)- so we can find it in the source (name of the filename)
4. Context - so we can investigate issues (e.g. the subscription_id)
5. Message that tells us what happened in english (message) - so that we can read the logs. This is the usual log message.
6. The version of the running service (v)
7. Who is performing the action (actor)

Example:

```Typescript
export default function createSubscriptionAction(
  deps: Dependencies
): CreateSubscription {

// On function begin initate logger with name of use-case
const logger = createLogger("create-subscription");

try {
   subscription = await deps.subscriptionRepo.create(...SubcriptionData);
   // Log level info on succesfull operation
   logger.info("subscription created successfully", {
      actor: metadata.actor,
   });
} catch (subErr) {
   // Log level error on failure
   logger.error("failed to create subscription", {
      actor: metadata.actor,
      err: (<Error>subErr).message,
      subscriptionId,
   });
throw subErr;
}
}
```

## Using .env variables

1. When developing and communicating with other services always use their respective staging environment (if possible)

## General Assumptions

1. Consider objects like Nodes, Symbols, etc. as immutable outside the component that created them. Do not change them.
2. Consider arrays as immutable by default after creation.

## Flags

1. More than 2 related Boolean properties on a type should be turned into a flag.

## Comments

1. Try to be explicit in the code. Code should always explain itself, making comments obsolete

## Strings

1. Use double quotes for strings.

## General Constructs

For a variety of reasons, we avoid certain constructs, and use some of our own. Among them:

1. Do not use `for..in` statements; instead, use `ts.forEach`, `ts.forEachKey` and `ts.forEachValue`. Be aware of their slightly different semantics.
2. Try to use `ts.forEach`, `ts.map`, and `ts.filter` instead of loops when it is not strongly inconvenient.

## Style

1. Use arrow functions over anonymous function expressions.
2. Only surround arrow function parameters when necessary. <br />For example, `(x) => x + x` is wrong but the following are correct:
   - `x => x + x`
   - `(x,y) => x + y`
   - `<T>(x: T, y: T) => x === y`
3. Always surround loop and conditional bodies with curly braces. Statements on the same line are allowed to omit braces.
4. Open curly braces always go on the same line as whatever necessitates them.
5. Parenthesized constructs should have no surrounding whitespace. <br />A single space follows commas, colons, and semicolons in those constructs. For example:
   - `for (var i = 0, n = str.length; i < 10; i++) { }`
   - `if (x < 10) { }`
   - `function f(x: number, y: string): void { }`
6. Use a single declaration per variable statement <br />(i.e. use `var x = 1; var y = 2;` over `var x = 1, y = 2;`).
7. `else` goes on a separate line from the closing curly brace.

## Design

### Interface

```ts
export function showYouKnow(): void;
```

- "View" function (ie. a function that does NOT alter contract state)
- Takes no parameters
- Returns nothing

```ts
export function sayHello(): string;
```

- View function
- Takes no parameters
- Returns a string

```ts
export function sayMyName(): string;
```

- "Call" function (although it does NOT alter state, it DOES read from `context`, [see docs for details](https://docs.near.org/docs/develop/contracts/as/intro))
- Takes no parameters
- Returns a string

```ts
export function saveMyName(): void;
```

- "Call" function (ie. a function that alters contract state)
- Takes no parameters
- Saves the sender account name to contract state
- Returns nothing

```ts
export function saveMyMessage(message: string): bool;
```

- Call function
- Takes a single parameter message of type string
- Saves the sender account name and message to contract state
- Returns nothing

```ts
export function getAllMessages(): Array<string>;
```

- View function
- Takes no parameters
- Reads all recorded messages from contract state (this can become expensive!)
- Returns an array of messages if any are found, otherwise empty array

**Notes**

- All of these methods append to the log for consistency

### Models

_This contract has no custom models_

_Using Gitpod?_

Please feel encouraged to edit any and all files in this repo while you explore. A reset of this environment is just a click away: just head back to the main `README` and reopen this workshop in Gitpod if you ever get stuck.

## Test

There are three classes of tests presented here:

- **Unit** tests exercise the methods and models of your contract
- **Simulation** tests provide fine-grained control over contract state, execution context and even network economics
- **Integration** tests get as close to production as possible with deployment to a local node, BetaNet or TestNet

We will explore each of these in turn.

### Unit Tests

Unit tests are written using [`as-pect`](https://github.com/jtenner/as-pect) which provides "blazing ???? fast testing with AssemblyScript".

To see unit tests for this contract run

```text
yarn test -f greeting.unit
```

You should see something like this (may be colorized depending on your terminal configuration)

```text
[Describe]: Greeting

 [Success]: ??? should respond to showYouKnow()
 [Success]: ??? should respond to sayHello()
 [Success]: ??? should respond to sayMyName()
 [Success]: ??? should respond to saveMyName()
 [Success]: ??? should respond to saveMyMessage()
 [Success]: ??? should respond to getAllMessages()

    [File]: 01.greeting/__tests__/greeting.unit.spec.ts
  [Groups]: 2 pass, 2 total
  [Result]: ??? PASS
[Snapshot]: 0 total, 0 added, 0 removed, 0 different
 [Summary]: 6 pass,  0 fail, 6 total
    [Time]: 12.852ms

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  [Result]: ??? PASS
   [Files]: 1 total
  [Groups]: 2 count, 2 pass
   [Tests]: 6 pass, 0 fail, 6 total
    [Time]: 2350.078ms
???  Done in 3.01s.
```

You can explore the contents of `01.greeting/__tests__/greeting.spec.ts` for unit test details.

### Simulation Tests

There are two types of simulation tests we can expect to use:

- **`near-vm`** allows us to exercise contract methods inside an exact replica of the on-chain virtual machine
- **Runtime API** exposes interfaces for cross-contract calls and is compatible with popular testing frameworks

Only the first, using `near-vm`, will be addressed in depth here. It's key limitation is that we can only test one contract at a time, invoking methods, observing changes in state and getting a sense of the operating costs of the contract.

#### Simulation Testing with `near-vm`

Run the following commands to simulate calling the method `sayMyName` on this contract

1. First compile (or recompile after changes) the optimized `.wasm` file

   ```text
   yarn build greeting
   ```

2. Then run a simulation test

   ```text
   yarn test:simulate:vm:greeting --method-name sayMyName
   ```

You should see something like the following response

```text
{"outcome":{"balance":"10000000000000000000000000","storage_usage":100,"return_data":{"Value":"\"Hello, bob!\""},"burnt_gas":41812607821,"used_gas":41812607821,"logs":["sayMyName() was called"]},"err":null,"receipts":[],"state":{}}
???  Done in 1.75s.
```

Which can be reformatted for easier scanning

```json
{
  "outcome": {
    "balance": "10000000000000000000000000",
    "storage_usage": 100,
    "return_data": {
      "Value": "\"Hello, bob!\""
    },
    "burnt_gas": 41812607821,
    "used_gas": 41812607821,
    "logs": ["sayMyName() was called"]
  },
  "err": null,
  "receipts": [],
  "state": {}
}
```

> **Notes**
>
> - The value in `return_data` is what we expect if our account name were "bob". But how did that get there? Run `near-vm --help` to see simulation options including control over contract state and execution context as well as network economics.
> - The amounts of `burnt_gas` and `used_gas` are the same, so why two different values? `used_gas` >= `burnt_gas` is always true. If ever a difference, it will be refunded back to the originating account. [See SO for more](https://stackoverflow.com/a/59146364).
> - The entry in `logs` is exactly what we would expect to see.
> - The contract `state` is empty.

Run the following command to simulate calling the method `saveMyName` on this contract

```text
yarn test:simulate:vm:greeting --method-name saveMyName
```

_(You only need to rebuild the contract if you've made changes)_

After reformatting, you should see something like the following response

```json
{
  "outcome": {
    "balance": "10000000000000000000000000",
    "storage_usage": 149,
    "return_data": "None",
    "burnt_gas": 49055516114,
    "used_gas": 49055516114,
    "logs": ["saveMyName() was called"]
  },
  "err": null,
  "receipts": [],
  "state": {
    "c2VuZGVy": "Ym9i"
  }
}
```

> **Notes**
>
> - The absence of value in `return_data` since `saveMyName` has a return type of `void`.
> - The amount of `used_gas` is higher now, by about 7.2 billion units. This difference represents more compute time required to fetch an account name from the `context` object as well as reading and writing to storage
> - The entry in `logs` is exactly what we would expect to see.
> - This time the contract `state` is not empty. It has 1 entry, a `key : value` pair, that is encoded as Base64 and, when decoded looks like this: `{"sender":"bob"}`.

**A brief aside on decoding**

_Base Sixty What?_

Just like human languages encode our thoughts into spoken words and printed text, data is encoded in different formats on computer systems depending on the use case. If data is "at rest", say on a backup drive, it can be encoded using a compression algorithm for better storage efficiency. And when data is "in motion", say between machines over HTTP, base64 is a good choice since the data less likely to get corrupted during transfer.

The state "key" and "value" above were decoded using the code snippet below but we could just as easily have used a [website like this one](https://www.base64decode.org/).

```js
const key = "c2VuZGVy";
const value = "Ym9i";
const decodedKey = Buffer.from(key, "base64").toString("utf8");
const decodedValue = Buffer.from(value, "base64").toString("utf8");
console.log(decodedKey, decodedValue);
```

#### Simulation Testing with Runtime API

At a very high level, testing with the Runtime API allows us, using JavaScript, to create accounts for contracts, load them up with the Wasm binary, add user accounts and simulate their interaction.

To try this out:

1. **move to the _sample project_ folder** (where **this** `README.md` appears: `01.greeting/`)
2. run `yarn` inside that folder _(we will use Jest for this)_
3. run `yarn build` to build `greeting.wasm` locally (just as we did when browsing the `.wat` file earlier)
4. run `yarn test:simulate:runtime`

You should see something like

```text
 PASS  __tests__/greeting.simulate.spec.js
  Greeting
    View methods
      ??? responds to showYouKnow() (113ms)
      ??? responds to sayHello() (115ms)
      responds to getAllMessages()
        ??? works with 0 messages (133ms)
        ??? works with 1 message (229ms)
        ??? works with many messages (493ms)
    Call methods
      ??? responds to sayMyName() (128ms)
      ??? responds to saveMyName() (113ms)
      ??? responds to saveMyMessage() (106ms)
    Cross-contract calls()
      ??? todo add cross contract call examples

Test Suites: 1 passed, 1 total
Tests:       1 todo, 8 passed, 9 total
Snapshots:   0 total
Time:        3.313s
Ran all test suites matching /simulate.spec/i.
???  Done in 9.88s.
```

Feel free to explore the file `__tests__/greeting.simulate.spec.js` for details.

**A brief aside on contracts and accounts**

You may have noticed that the words `contract` and `account` are sometimes interchangeable. This is because NEAR accounts can only hold zero or one contracts while a contract can be deployed to multiple accounts.

In the previous sections, since we were only testing and simulating and had not deployed anything to the network, the words `contract` and `account` were basically the same, although you may have already noticed this distinction if you took a close look at the `simulate.spec` file a moment ago.

In the next section about integration tests where we will be working with a live network, the distinction between **contract accounts** vs. **user accounts** will become useful and important.

We will deploy the contract to a specific account (ie. the contract account) on the network (ie. TestNet) and call contract methods from a **different** account (ie. our user account).

You can read more about [accounts on NEAR Protocol here](https://docs.near.org/docs/concepts/account).

### Integration Tests

There are two types of integration tests we can expect to use:

- **NEAR Shell** serves as a console Swiss army knife with the ability to manage accounts, contracts and more
- **`near-api-js`** (our JavaScript API) wraps the NEAR JSON RPC API and exposes NEAR Wallet authentication

Only the first, using NEAR Shell, will be addressed here in any depth. Its key limitation is that we cannot orchestrate cross-contract calls.

We will use NEAR Shell to login to our own user account and then use it again to create a new account for our contract before we deploy, verify, and invoke methods on the contract. Finally, we will delete the contract account to clean up after ourselves. We will rely on other tools like [NEAR Explorer](https://explorer.near.org/) for transaction visibility, history and more.

#### Integration Tests with NEAR Shell

**HEADS UP** -- if this is your first time using NEAR Shell to deploy a contract to TestNet, this may feel like a long and confusing process but once you've done it 3 times, it should only take about a minute from end to end and can be automated in a shell script.

But first the tldr; for anyone who wants to start running before they walk.

---

**tldr;**

We use the symbol `<???>` to represent text that is **unique to your account name**, whatever that is (or will be when you make it up). After this brief list of steps, each of these commands is described in greater detail including expected output and possible errors.

Note that all of this happening **on the command line.**

**(0) Confirm NEAR Shell is installed**

```text
near --version
```

_Expected output_

```text
0.21.0    (or any higher version number)
```

**(1) Authorize NEAR Shell to use your account**

- You must create an account in this step if you don't already have one
- _Using Gitpod?_
  - Click **Open Preview** button (will appear in the middle of 3 blue buttons)

```text
near login
```

**(2) Create an account for the contract**

- By design there is a limit of max 1 contract per account
- Account names follow a pattern similar to DNS
- We assume you already created `<???>.testnet` in the previous step

```text
near create_account greeting.<???>.testnet --master-account <???>.testnet --helper-url https://helper.testnet.near.org
```

_Expected output_

```text
Account greeting.<???>.testnet for network "default" was created.
```

**(3) Build the contract**

- The Wasm file will appear as `out/greeting.wasm`
- To silence metrics reporting during compilation, comment out all (2) instances of `"--measure"` in the file `asconfig.js`

```text
yarn build greeting
```

_Expected output_

```text
compiling contract [ 01.greeting/main.ts         ] to [ out/greeting.wasm ]
```

**(4) Deploy the contract to the contract account**

- We assume you already created `greeting.<???>.testnet` in a previous step

```text
near deploy --wasm-file out/greeting.wasm --account-id greeting.<???>.testnet
```

_Expected output_

```text
Starting deployment. Account id: greeting.<???>.testnet, node: https://rpc.testnet.near.org, helper: https://helper.testnet.near.org, file: out/greeting.wasm
```

**(5) Verify deployment of the correct contract to the intended**

- The account name `greeting.<???>.testnet` should match the intended contract account
- The value of `code_hash` should match _exactly_ (starting with `63tSDQ...`) **unless the contract code has changed**, in which case it will almost certainly be different.
- Other values in this response are unlikely to match

```text
near state greeting.<???>.testnet
```

_Expected output_

```text
Account greeting.<???>.testnet
```

```json
{
  "amount": "99999999949722583262485000",
  "locked": "0",
  "code_hash": "63tSDQc9K5Nt9C8b1HDkv3VBnMFev9hXB589dZ9adsKA",
  "storage_usage": 14912,
  "storage_paid_at": 0,
  "block_height": 2048367,
  "block_hash": "AbYg6aAbv4e1h2rwKG2vMsWphXm27Ehhde6xUKYzYjsT",
  "formattedAmount": "99.999999949722583262485"
}
```

**(6) For each method of the contract, test it and observe the response**

- _Using Gitpod?_
  - Replace all instances of `<???>` to make the lines below match your new account for a smooth workflow

**Test `showYouKnow()`**

```text
near view greeting.<???>.testnet showYouKnow
```

_Expected outcome_

```text
View call: greeting.<???>.testnet.showYouKnow()
[greeting.<???>.testnet]: showYouKnow() was called
false
```

**Test `sayHello()`**

```text
near view greeting.<???>.testnet sayHello
```

_Expected outcome_

```text
View call: greeting.<???>.testnet.sayHello()
[greeting.<???>.testnet]: sayHello() was called
'Hello!'
```

**Test `sayMyName()`**

```text
near call greeting.<???>.testnet sayMyName --account-id <???>.testnet
```

_Expected outcome_

```text
Scheduling a call: greeting.<???>.testnet.sayMyName()
[greeting.<???>.testnet]: sayMyName() was called
'Hello, <???>.testnet!'
```

**Test `saveMyName()`**

```text
near call greeting.<???>.testnet saveMyName --account-id <???>.testnet
```

_Expected outcome_

```text
Scheduling a call: greeting.<???>.testnet.saveMyName()
[greeting.<???>.testnet]: saveMyName() was called
''
```

**Test `saveMyMessage()`**

```text
near call greeting.<???>.testnet saveMyMessage '{"message": "bob? you in there?"}' --accountId <???>.testnet
```

_Expected outcome_

```text
Scheduling a call: greeting.<???>.testnet.saveMyMessage({"message": "bob? you in there?"})
[greeting.<???>.testnet]: saveMyMessage() was called
true
```

**Test `getAllMessages()`**

```text
near call greeting.<???>.testnet getAllMessages --account-id <???>.testnet
```

_Expected outcome_

```text
Scheduling a call: greeting.<???>.testnet.getAllMessages()
[greeting.<???>.testnet]: getAllMessages() was called
[ '<???>.testnet says bob? you in there?' ]
```

**(7) Cleanup by deleting the contract account**

```text
near delete greeting.<???>.testnet <???>.testnet
```

_Expected outcome_

```text
Deleting account. Account id: greeting.<???>.testnet, node: https://rpc.testnet.near.org, helper: https://helper.testnet.near.org, beneficiary: <???>.testnet
Account greeting.<???>.testnet for network "default" was deleted.

```

**END tldr;**

For more support using the commands above, see [help with NEAR Shell integration tests](near-shell-help.md).

#### Integration Tests with `near-api-js`

`near-api-js` is a JavaScript / TypeScript library for development of dApps on the NEAR platform that can be used from any client or server-side JavaScript environment.

For context, it's worth knowing that the core NEAR platform API is a JSON-RPC interface. `near-api-js` wraps this RPC interface with convenience functions and exposes NEAR primitives as first class JavaScript objects.

We use `near-api-js` internally in tools like NEAR Shell and NEAR Wallet.

You would use `near-api-js` as your primary interface with the NEAR platform anytime you are writing JavaScript (client or server-side).

See our [documentation for more details](https://docs.near.org/docs/develop/front-end/introduction).

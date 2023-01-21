![Subscriptions](docs/logo-horizontal.png)

This service provides a set of APIs to manage subscriptions and its state, from created to closed

## Table of contents

- 🚀 [Getting Started](#getting-started)
  - 🛠 [Dependencies](#dependencies)
  - 🚇 [Local setup](#local-setup)
  - 🔗 [Running locally](#running-locally)
- ✅ [Testing](#testing)
- 💾 [Migrations](#migrations)
- 🫶 [Troubleshooting](#troubleshooting)
- 👏 [Contributing](CONTRIBUTING.md)
- 👨‍💻 [Coding Guidelines](GUIDELINES.md)

## Getting Started

### Dependencies:

- node 14+
- yarn 1.22+
- docker 20.10.13, build a224086 +

### Local setup

```bash
# Clone the repo
git clone [repo link]
cd subscriptions
# Create your .env file by copying .env.sample
cp .env.sample .env
# Install code dependencies
yarn
# Fill .env file with staging values from Gitlab or Postman
```

### Running locally

```bash
# Instantiate a local DB
yarn run-db
# Apply migrations
yarn apply-migrations:local
# Start server
yarn start
```

Check the [Troubleshooting Guide](#troubleshooting) if any errors occur.

## Testing

This project uses [Jest](https://jestjs.io/) for testing. We write unit, integration and API tests.
They are named accoding to the following convention:

- `*.test.ts` - Unit
- `*.it.test.ts` - Integration
- `*.api.test.ts` - API

Run the unit tests using:

```bash
yarn test
```

Run the integration tests using:

```bash
yarn test:it
```

Run the integration tests using:

```bash
yarn test:api
```

Run all tests using:

```bash
yarn test:all
```

## Migrations

We use knex for connecting to our DB. It comes bundled with the Knex CLI which can help us create migration files. To create a new migration file:

```bash
npx knex migrate:make <PLEASE_GIVE_A_NAME_HERE> --knexfile ./src/postgres/knexfile.ts
```

This would create a new file in `/src/postgres/migrations` folder which would something like:

```typescript
import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Write the changes you want here
  // This function is executed in when we apply "knex migrate:latest" command
}

export async function down(knex: Knex): Promise<void> {
  // Write migrations that should revert the changes from the "up" function above
  // This function is executed in when we apply "knex migrate:rollback" command
}
```

For further info, read the [knex docs](http://knexjs.org/#Migrations-CLI)

## Troubleshooting

1. [Error running `yarn run-db`](#error-after-running-yarn-run-db)
1. [Error running `yarn apply-migrations:local`](#error-after-running-yarn-apply-migrationslocal)

### Error after running `yarn run-db`

Error:

```bash
yarn run-db
yarn run v1.22.17
$ docker run -d --rm --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:12.8-alpine
docker: Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?.
See 'docker run --help'.
error Command failed with exit code 125.
info Visit https://yarnpkg.com/en/docs/cli/run for documentation about this command.
```

Solution:
Please start your docker daemon via the GUI in `/Applications/Docker` or use

```bash
open -a Docker
# wait for 30 seconds
yarn run-db
```

### Error after running `yarn apply-migrations:local`

Error:

```bash
yarn run v1.22.17
$ NODE_ENV=local npx knex migrate:latest --knexfile ./src/postgres/knexfile.ts
Requiring external module ts-node/register
Working directory changed to ~/FINN/subscriptions/src/postgres
Using environment: local
database "subscriptions_local_thesis" does not exist
error: database "subscriptions_local_thesis" does not exist
    at Parser.parseErrorMessage (/Users/l/FINN/subscriptions/node_modules/pg-protocol/src/parser.ts:369:69)
    at Parser.handlePacket (/Users/l/FINN/subscriptions/node_modules/pg-protocol/src/parser.ts:188:21)
    at Parser.parse (/Users/l/FINN/subscriptions/node_modules/pg-protocol/src/parser.ts:103:30)
    at Socket.<anonymous> (/Users/l/FINN/subscriptions/node_modules/pg-protocol/src/index.ts:7:48)
    at Socket.emit (events.js:400:28)
    at Socket.emit (domain.js:475:12)
    at addChunk (internal/streams/readable.js:293:12)
    at readableAddChunk (internal/streams/readable.js:267:9)
    at Socket.Readable.push (internal/streams/readable.js:206:10)
    at TCP.onStreamRead (internal/stream_base_commons.js:188:23)
error Command failed with exit code 1.
info Visit https://yarnpkg.com/en/docs/cli/run for documentation about this command.
```

Solution:

This error is caused by the Docker postgres not having a database called `subscriptions_local_thesis`. This can be fixed by logging into the local postgres server and creating the database subscriptions_local_thesis manually.

Local instance login data:

```
URL: localhost
Port: 5432
User: postgres
Password: password
```

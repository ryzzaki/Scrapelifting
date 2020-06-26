## Installation

```bash
$ yarn install
```

## Running the app

Before running the app, fill out your own `.env` file using `.env-example`.

```bash
# generate ORM Config
$ yarn typeorm:setup

# migrate db
$ yarn db:migrate

# development
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod
```

## Migrations

If any changes are made to any entities, make sure a migration is generated:

```bash
# generate a migration
$ yarn db:migration:generate [name of your migration]

# run the migration against your DB
$ yarn db:migrate
```

## Test

```bash
# unit tests
$ yarn test
```

## Architecture

The project contains a `scraper` module which hosts a CRON job called `fetchNewCandidates`. This CRON job runs every 5 minutes to scrape and fetch new candidates from the sources.

To add a new `ScraperJob`:

1. Create a new `Injectable` service inside of the `scraper` module.
2. Extend the class based service using the `ScraperJob` interface
3. Implement your scraper logic & add the Injectable service to ScraperService in `src/scraper/scraper.service.ts`
4. Send the scraped data to a webhook

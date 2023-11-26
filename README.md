# karibou-seed

[![BrowserStack Status](https://automate.browserstack.com/badge.svg?badge_key=TWlJalpaN0djek82WllpaFgxN2JHdEdNZHU1UGgyb2tNeUJjNGY1QWllZz0tLXFiaXFkTXhJT3ZrM3AxVTB6a3U5Z3c9PQ==--ad4aa6b309d0f55e8a43ab47a468d089b5d9cb86)](https://automate.browserstack.com/public-build/TWlJalpaN0djek82WllpaFgxN2JHdEdNZHU1UGgyb2tNeUJjNGY1QWllZz0tLXFiaXFkTXhJT3ZrM3AxVTB6a3U5Z3c9PQ==--ad4aa6b309d0f55e8a43ab47a468d089b5d9cb86)

[![DigitalOcean Referral Badge](https://web-platforms.sfo2.digitaloceanspaces.com/WWW/Badge%202.svg)](https://www.digitalocean.com/?refcode=e71158f2a644&utm_campaign=Referral_Invite&utm_medium=Referral_Program&utm_source=badge)

Help us to build the futur of food distribution,
> Wherever you are, you'll see communities of farmers, foodmakers, wine merchants and grocers appearing on your screens who are committed to serving you the best food in depotit or on your doorstep.

## Fork and Test your karibou-seed with
[![BrowserStack](https://user-images.githubusercontent.com/1422935/51529667-72d45d00-1e39-11e9-96b0-78bf6906aa4b.png)](https://browserStack.com)


## Prerequisites
* git
* node/npm lts/*
* angular >=11
* npm -g install @angular/cli

```bash
git clone https://github.com/karibou-ch/karibou-seed
cd karibou-seed
npm install
export NODE_OPTIONS=--openssl-legacy-provider
ng serve -c=devel
```

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.1.4.

## Development server

Run `ng serve --aot=false -c=devel` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Commit description
We use our commit log to make beautifull and configurable changelog file with the application gitchangelog.
Please follow the rules, and start your commit description with:
* new: 
* chg:
* fix:

## Publish code
* ng build --prod  -c=auto
* rsync -avu --delete-after  dist/* nd1.karibou.ch:www/(devel|production)/

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## MDC/Angular links
* [hammer&navbar](https://github.com/trimox/angular-mdc-web/issues/156) 
* [animation](https://material.angular.io/guide/getting-started#step-2-animations) Noo
## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

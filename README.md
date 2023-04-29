# karibou-seed
[![BrowserStack Status](https://www.browserstack.com/automate/badge.svg?badge_key==)](https://www.browserstack.com/automate/public-build/)

Help us to build the futur of food distribution,
> Wherever you are, you'll see communities of farmers, foodmakers, wine merchants and grocers appearing on your screens who are committed to serving you the best food in depotit or on your doorstep.

## Fork and Test your karibou-seed with
[![BrowserStack](https://user-images.githubusercontent.com/1422935/51529667-72d45d00-1e39-11e9-96b0-78bf6906aa4b.png)](https://browserStack.com)


## Prerequisites
* git
* node/npm stable
* angular >=7
* npm -g install @angular/cli

```bash
git clone https://github.com/karibou-ch/karibou-seed
cd karibou-seed
npm install
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

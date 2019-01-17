# karibou-seed


## Prerequisites
* git
* node/npm stable
* angular >=7
* npm -g install @angular/cli

```bash
git clone https://github.com/karibou-ch/karibou-seed
cd karibou-seed
npm install
ng serve 
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
* rsync -avu --delete -e 'ssh -p22' dist/* <server>:www/<directory>

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## MDC/Angular links
* [hammer&navbar](https://github.com/trimox/angular-mdc-web/issues/156) 
* [animation](https://material.angular.io/guide/getting-started#step-2-animations) Noo
## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

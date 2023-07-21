import { Component, OnInit, OnDestroy, Inject, Input, Output, EventEmitter, forwardRef, HostBinding } from '@angular/core';

import { KngNavigationStateService, i18n, KngUtils } from '../../common';

import { MdcSnackbar, MdcDialogRef, MDC_DIALOG_DATA, MdcDialog } from '@angular-mdc/web';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, Validators, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

import {
  DocumentService,
  LoaderService,
  ConfigService,
  Config,
  UserAddress,
  DocumentHeader,
  Utils,
  Hub
} from 'kng2-core';

import { ActivatedRoute } from '@angular/router';
import { KngNavigationStoreResolve } from 'src/app/common/navigation.store.service';
import { ReplaySubject } from 'rxjs';


/**
 *  //
    // display karibou.ch welcome message
    welcome.message.en|fr
    welcome.message.active


    //
    // display karibou.ch tagLine
    tagLine.h.en|fr
    tagLine.t.en|fr
    tagLine.p.en|fr
    tagLine.image

    //
    // display karibou.ch About
    about.h.en|fr
    about.t.en|fr
    about.o.en|fr
    about.image

    //
    // display karibou.ch Footer
    footer.h.en|fr
    footer.t.en|fr
    footer.p.en|fr
    footer.image

    //
    // menu
    menu:[{
      name.en|fr
      url
      weight
      group
      active
    }],

    //
    // defines keys
    keys.pubConnect
    keys.pubStripe
    keys.pubGithub
    keys.pubUpcare
    keys.pubChat
    keys.pubMap
    keys.pubDisqus
    keys.pubGoogle
    keys.pubFacebook

    mail.signature
    mail.phone
    mail.subject

    //
    // hub specific content
    hubs:[{name,slug,description,image}],
 */

@Component({
  selector: 'kng-config',
  templateUrl: './kng-config.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngConfigComponent implements OnInit, OnDestroy {

  currenHub: Hub;
  config: Config;
  menus: any[];
  groups: string[];
  isLoading: boolean;
  isReady = false;



  constructor(
    public $dlg: MdcDialog,
    public $fb: FormBuilder,
    public $i18n: i18n,
    public $config: ConfigService,
    public $loader: LoaderService,
    public $util: KngUtils,
    public $route: ActivatedRoute,
    public $snack: MdcSnackbar,
    public $navigation: KngNavigationStateService
  ) {
    this.isLoading = false;
    this.isReady = true;
    const loader = this.$route.snapshot.data.loader;
    this.config = loader[0];
    this.currenHub = this.config.shared.hub || {};
    // HUB
    //this.config.shared.maintenance.reason = this.config.shared.maintenance.reason || {};
    //this.config.shared.header.message = this.config.shared.header.message || {};
    // this.config.shared.checkout.address = this.config.shared.checkout.address || {};
    // this.config.shared.checkout.payment = this.config.shared.checkout.payment || {};
    // this.config.shared.checkout.message = this.config.shared.checkout.message || {};
    this.config.shared.welcome.message = this.config.shared.welcome.message || {};
    this.config.shared.faq_title = this.config.shared.faq_title || {fr:'',en:''};

    //
    // used by child classes
    this.ngConstruct();
  }

  ngConstruct() {
    this.$config.get(this.currenHub.slug).subscribe(config => {
      this.config = config;
    });

  }

  ngOnInit() {
    //
    // set navigation layout
    this.formatDates();
    this.buildMenu();
  }



  buildMenu() {
    //
    // make sure to find menu item
    // this.config.shared.menu.forEach((menu,i)=>{
    //   menu.id=menu._id||i;
    //   menu.index=i;
    // })
    this.menus = this.config.shared.menu.sort(this.sortByGroupAndWeight);
    //
    // get menu groups names
    this.groups = this.menus.map(menu => menu.group)
    .filter((item, i, ar) => ar.indexOf(item) === i);
  }

  getMenuByGroup(group: string) {
    return this.menus.filter(menu => menu.group === group);
  }

  findMenuItem(item) {
    return this.config.shared.menu.findIndex(m => m._id === item._id);
    // return this.menus.find(menu=>menu.id===item.id).index;
  }

  formatDates() {
    const format = (d: Date) => {
      d = new Date(d);
      const month = ('0' + (d.getMonth() + 1)).slice(-2);
      const day = ('0' + d.getDate()).slice(-2);
      // return day+'-'+month+'-'+d.getFullYear();
      return d.getFullYear() + '-' + month + '-' + day;
    };
    (this.config.shared.noshipping || []).forEach(noshipping => {
      noshipping.from = format(<Date>noshipping.from);
      noshipping.to = format(<Date>noshipping.to);
    });
  }

  ngOnDestroy() {
    this.isLoading = false;
  }

  onCreateFAQ() {
    this.config.shared.faq = this.config.shared.faq || [];
    this.config.shared.faq.push({
      q: {en:'',fr:''},
      a: {en:'',fr:''}
    });
  }



  onDialogOpen(url) {
    if(url== 'rejected') {
      this.$snack.open(this.$i18n.label().img_max_sz, 'OK');
      return;
    }
    // this.onConfigSave();
  }


  onConfigSave() {
    this.isReady = false;
    this.isLoading = true;
    this.$config.save(this.config).subscribe(
      () => {
        this.formatDates();
        this.isReady = true;
        this.$snack.open(this.$i18n.label().save_ok, 'OK');
        }, (err) => {
          this.isReady = true;
          this.isLoading = false;
          this.$snack.open(err.error, 'OK')
        },
      () => this.isLoading = false
    );
  }

  sortByGroupAndWeight(m1, m2) {
    const g1 = m1.group || '';
    const g2 = m2.group || '';
    if (g1 === g2) {
      return m1.weight - m2.weight;
    }
    return g1.toLowerCase().localeCompare(g2.toLowerCase());
  }


}


@Component({
  selector: 'kng-welcome',
  templateUrl: './kng-welcome.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngWelcomeCfgComponent extends KngConfigComponent {
}

@Component({
  selector: 'kng-shop',
  templateUrl: './kng-shop.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngShopComponent extends KngConfigComponent {
}

@Component({
  selector: 'kng-page-content',
  templateUrl: './kng-page.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngPageContentComponent  {
  config: Config;
  contents: DocumentHeader[];

  constructor(
    public $fb: FormBuilder,
    public $i18n: i18n,
    public $document: DocumentService,
    public $loader: LoaderService,
    public $snack: MdcSnackbar,
    public $navigation: KngNavigationStateService
  ) {
  }

  ngOnInit() {
    //
    // set navigation layout
    // let categories=this.getCategories().map(type=>{
    //   return this.$document.select(type);
    // });
    // concat(categories).subscribe(docs=>{
    //   this.contents=docs;
    // });

    this.$document.getAll(true).subscribe((docs: DocumentHeader[]) => {
      this.contents = docs;
    }, err => this.$snack.open(err.error));
  }

  ngOnDestroy() {
    //
    // set navigation layout
  }

  getCategories() {
    return this.$document.getCategories();
  }

}


@Component({
  templateUrl: './kng-navigation-dlg.component.html',
  styleUrls: ['./kng-config-dlg.component.scss']
})
export class KngNavigationDlgComponent {
  constructor(
    public $dlgRef: MdcDialogRef<KngNavigationDlgComponent>,
    public $fb: FormBuilder,
    public $i18n: i18n,
    @Inject(MDC_DIALOG_DATA) public data: any
    ) {
      this.menu = data;
    }

    menu: any;

  //
  // init formBuilder
  form = this.$fb.group({
    'weight': ['', [Validators.required]],
    'active': ['', []],
    'group': ['', [Validators.required]],
    'name': ['', [Validators.required]],
    'url': ['', [Validators.required]]
  });

  askSave() {
    if (this.form.invalid) {
      return;
    }

    this.$dlgRef.close(this.form.value);

  }

  askDelete() {
    this.$dlgRef.close('delete');
  }

  askDecline() {
    this.$dlgRef.close('decline');
  }
}

@Component({
  selector: 'kng-navigation',
  templateUrl: './kng-navigation.component.html',
  styleUrls: ['./kng-config.component.scss']
})
export class KngNavigationComponent extends KngConfigComponent {
  //
  // edit content
  edit: {
    menu: any;
    form: any;
  };


  assign(value) {
    const lang = this.$i18n.locale;
    this.edit.menu.weight = value.weight;
    this.edit.menu.name[lang] = value.name;
    this.edit.menu.url = value.url;
    this.edit.menu.group = value.group;
    this.edit.menu.active = value.active;
  }

  ngConstruct() {
    //
    // init edit struct
    this.edit = {
      form: null,
      menu: null
    };
  }

  ngOnInit() {
    super.ngOnInit();
  }
  onDelete($event) {
    this.isLoading = true;
    const toRemove = this.findMenuItem(this.edit.menu);
    if (toRemove === -1) {
      return window.alert('Ooops');
    }

    this.config.shared.menu.splice(toRemove, 1);
    this.$config.save(this.config).subscribe(() => {
      this.edit.menu = null;
      this.$snack.open(this.$i18n.label().save_ok, 'OK');
      this.buildMenu();
    },
    (err) => this.$snack.open(err.error, 'OK'),
    () => this.isLoading = false
    );
    return false;
  }

  onDecline() {
    this.edit.menu = null;
  }


  onSave(value) {
     let toSave = -1;
    this.isLoading = true;
    this.isReady = false;

    //
    // save specific menu
    this.assign(value);
    //
    // create this menu
    if (!this.edit.menu._id) {
      toSave = this.config.shared.menu.push(this.edit.menu);
    } else {
      toSave = this.findMenuItem(this.edit.menu);
      Object.assign(this.config.shared.menu[toSave], this.edit.menu);
    }

    //
    // never goes there!
    if (toSave === -1) {
      return window.alert('Ooops, pas bien ça!');
    }

    this.$config.save(this.config).subscribe(() => {
      this.edit.menu = null;
      this.isReady = true;
      this.$snack.open(this.$i18n.label().save_ok, 'OK');
      this.buildMenu();
    },
    (err) => this.$snack.open(err.error, 'OK'),
    () => this.isLoading = false);
    return false;
  }
  onMenuCreate() {
    this.edit.menu = {name: {fr: '', en: null, de: null}};
    const dialogRef = this.$dlg.open(KngNavigationDlgComponent, {
      data: this.edit.menu
    });
    dialogRef.afterClosed().subscribe(value => {
      this.onSave(value);
    });
  }

  onMenuSelect($event, menu) {
    this.edit.menu = menu;
    const dialogRef = this.$dlg.open(KngNavigationDlgComponent, {
      data: this.edit.menu
    });
    dialogRef.afterClosed().subscribe(result => {
      // on delete
      if (result === 'delete') {
        return this.onDelete($event);
      }
      // on Save
      if (typeof result === 'object') {
        return this.onSave(result);
      }
      // on close
      this.onDecline();
    });

  }

}


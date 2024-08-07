import { Component, OnInit, Output, EventEmitter, Input, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User, Config } from 'kng2-core';
import { i18n, KngNavigationStateService } from '..';
import pkgInfo from '../../../../package.json';

@Component({
  selector: 'kng-footer',
  templateUrl: './kng-footer.component.html',
  styleUrls: ['./kng-footer.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class KngFooterComponent implements OnInit {

  @Output() updated: EventEmitter<User> = new EventEmitter<User>();

  @Input() user: User;
  @Input() set config(config: Config) {
    this.main(config);
  }

  VERSION: string = pkgInfo.version;
  shared: any;
  store: string;
  isReady: boolean;

  constructor(
    private $i18n: i18n,
    private $navigation: KngNavigationStateService,
    private $route: ActivatedRoute,
  ) {

    //
    // initialize loader
    const loader = this.$route.snapshot.data.loader;
    //
    // system ready
    if (loader[1].constructor.name === 'Document') {
      this.user   = loader[0][1];
      this.config = loader[0][0];
    } else {
      this.user   = loader[1];
      this.config = loader[0];
    }
    this.shared = this.config && this.config.shared;
  }

  ngOnInit() {
    this.store = this.$navigation.store;
    setTimeout(()=>this.isReady=true,4000);
  }

  get locale() {
    return this.$i18n.locale;
  }

  getFooter(key) {
    if (!this.shared || !this.shared.footer[key]) {
      return;
    }
    const hub = this.shared.hub;

    return (hub && hub.name) ? hub.footer[key][this.locale] : this.shared.footer[key][this.locale];
  }

  getKFooter(key) {
    if (!this.shared || !this.shared.footer[key]) {
      return;
    }

    return this.shared.footer[key][this.locale];
  }

  getMenuItems(group: string) {
    return this.$navigation.getMenuItems(group);
  }

  main(config: Config) {
    if (!config.shared) {
      return;
    }

    this.shared = config.shared;
    this.store = this.$navigation.store;
  }




}

import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User, Config } from 'kng2-core';
import { i18n } from '..';
import { KngNavigationStateService } from '../navigation.service';

@Component({
  selector: 'kng-footer',
  templateUrl: './kng-footer.component.html',
  styleUrls: ['./kng-footer.component.scss']
})
export class KngFooterComponent implements OnInit {

  @Output() updated: EventEmitter<User> = new EventEmitter<User>();

  @Input() user: User;
  @Input() set config(config: Config) {
    this.main(config);
  }

  locale: string;
  content: any;
  store: string;

  constructor(
    private $i18n: i18n,
    private $navigation: KngNavigationStateService
  ) {
    // init current locale
    this.locale = this.$i18n.locale;

  }

  ngOnInit() {
    this.store = 'geneva';
  }

  getFooter(key) {
    if (!this.content || !this.content.home.footer[key]) {
      return;
    }
    return this.content.home.footer[key][this.locale];
  }


  getMenuItems(group: string) {
    return this.$navigation.getMenuItems(group);
  }

  main(config: Config) {
    if (!config) {
      return;
    }
    this.$navigation.updateConfig(config);
    this.content = config.shared;
  }




}

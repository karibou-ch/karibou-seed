import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User, LoaderService } from 'kng2-core';
import { i18n } from '../common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'kng-user-subscription',
  templateUrl: './user-subscription.component.html',
  styleUrls: ['./user-subscription.component.scss']
})
export class UserSubscriptionComponent implements OnInit, OnDestroy {
  isReady = false;
  user: User;
  config: any;
  private subscription: Subscription;

  i18n: any = {
    fr: {
      title: 'Mon abonnement'
    },
    en: {
      title: 'My subscription'
    }
  };

  constructor(
    private $i18n: i18n,
    private route: ActivatedRoute,
    private $loader: LoaderService
  ) {
    // ✅ SYNCHRONE: Récupération immédiate des données cached
    const { config, user } = this.$loader.getLatestCoreData();

    this.config = config;
    this.user = user;
    this.subscription = new Subscription();
  }

  ngOnInit() {
    // ✅ CORRECTION CRITIQUE: Écouter emit.user pour mise à jour après login
    this.subscription.add(
      this.$loader.update().subscribe(emit => {
        if (emit.user) {
          this.user = emit.user;
        }
        if (emit.config) {
          this.config = emit.config;
        }
      })
    );

    this.isReady = true;
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  get locale() {
    return this.$i18n.locale;
  }
}

import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoaderService, User, UserService } from 'kng2-core';

@Component({
  selector: 'app-user-password',
  templateUrl: './user-password.component.html',
  styleUrls: ['./user-password.component.scss']
})
export class UserPasswordComponent implements OnInit {

  constructor(
    private $loader: LoaderService,
    private route: ActivatedRoute,
    private $user: UserService
  ) { }

  @Input() id: any;
  private currentUser: User;
  private isReady: boolean;
  private config: any;
  private user: User = new User();

  ngOnInit() {

    this.$loader.ready().subscribe(ready => {
      this.isReady = true;
      this.config = ready[0];
      this.currentUser = ready[1];

      if (!this.id) {
        this.id = this.route.snapshot.params['id'];
      }

      this.$user.get(this.id).subscribe(res => this.user = res);
    });
  }

  onSave() {
    // TODO use error feedback for user!
    //this.$category.save(this.slug,this.category).subscribe(this.noop,this.processErrors);
  }

}

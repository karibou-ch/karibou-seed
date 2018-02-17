import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MdcDialogComponent } from '@angular-mdc/web';

import {
    ProductService,
    Product,
    LoaderService,
    User,
    UserService,
    config
}  from 'kng2-core';


@Component({
    selector: 'kng-product',
    templateUrl: './product.component.html',
    styleUrls: ['./product.component.scss']
})
export class ProductComponent implements OnInit {

    @Input() sku: number;

    user: User=new User();
    isReady: boolean;
    isDialog: boolean = false;
    config: any;
    product: Product = new Product();
    thumbnail:boolean=false;

    WaitText:boolean=false;
    rootProductPath:string;
    @ViewChild('productDialog') dialog: MdcDialogComponent;

    constructor(
        private $loader: LoaderService,
        private $product: ProductService,
        private $router: Router,
        private $route: ActivatedRoute
    ) {
    }

    ngOnInit() {
        
        this.$loader.ready().subscribe((loader) => {
            this.isReady = true;
            this.config = loader[0];
            Object.assign(this.user,loader[1]);
            this.rootProductPath=(this.$route.snapshot.params['shop'])?
                '/shop/'+this.$route.snapshot.params['shop']:'';

            if (!this.sku) {
                this.sku = this.$route.snapshot.params['sku'];
                this.isDialog=true;
            }
            
            this.$product.findBySku(this.sku).subscribe(prod => {
                this.product = prod
                if(this.isDialog){
                    console.log('-----------------open')
                    this.dialog.show();    
                }
            })
        });
    }

    onClose($event){
        this.$router.navigate([{outlets:{modal: null}}]);
    }

    save(){

    }
    love(){
        
    }
}

@Component({
    selector: 'kng-product-thumbnail',
    templateUrl: './product-thumbnail.component.html',
    styleUrls: ['./product-thumbnail.component.scss']
})
export class ProductThumbnailComponent extends ProductComponent {
}

@Component({
    selector: 'kng-product-tiny',
    templateUrl: './product-tiny.component.html',
    styleUrls: ['./product-tiny.component.scss']
})
export class ProductTinyComponent extends ProductComponent {
}


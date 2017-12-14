import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {
    ProductService,
    Product,
    LoaderService,
    User,
    UserService,
    Category,
    CategoryService,
    config
}  from 'kng2-core';

@Component({
    selector: 'kng-product-list',
    templateUrl: './product-list.component.html',
    styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {

    isReady: boolean = false;
    config: any;
    products: Product[] = [];
    password: string;
    categories: Category[];
    category: Category;
    categorySlug:string;

    constructor(
        private loader: LoaderService,
        private $product: ProductService,
        private $category: CategoryService,
        private route: ActivatedRoute
    ) {

    }

    ngOnInit() {
        this.loader.ready().subscribe((loader) => {
            this.isReady = true;
            this.config = loader[0];
            this.categories= loader[2];
            this.categorySlug=this.route.snapshot.params['category'];
            this.category=this.categories.find(cat=>cat.slug===this.categorySlug);
            this.filterProduct();
        });
    }

    loadProducts() {
        let options={
            available:true,
            status:true
        };
        this.$product.select(options).subscribe((products: Product[]) => {
            this.products = products.sort();
        });
    }

    filterProduct() {
        this.$product.findByCategory(this.categorySlug).subscribe((products: Product[]) => {
            this.products = products.sort();
        });
    }

    loadLovedProduct() {
        this.$product.findLove().subscribe((products: Product[]) => {
            this.products = products.sort();
        });
    }


}

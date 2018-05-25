# Application layout

## Landing page ( Welcome )
* route / == **Welcome Page**  
* IIF user is authenticated, then it redirects to the home page
* roles
  * provide tagline
  * provide questions
  * provide frequent informations (times, holidays, address, ...)
  * open the shop
* it contains:
  * tagline image 
  * tagline title
  * welcome title
  * welcome header
  * welcome image
  * 
  * footer

## Shop ( Home )
* route /store/__:name__ == **Home Page**
* current store is __bretzel__ (cart, products, vendors, belongs to the store name)
* 


## Cart ( Cart ) 
* route /store/__:name__/cart
*

## Home page

    home:{
      // display love in home?
      love:Boolean,
      // display campagn page in home?
      email:String,
      phone:String,
      siteName:{
        en:String,de:String,fr:String,
        image:String
      },
      shop:{
        h:{en:String,de:String,fr:String},
        p:{en:String,de:String,fr:String},
        image:String
      },
      howto:{
        h:{en:String,de:String,fr:String},
        t:{en:String,de:String,fr:String},
        p:{en:String,de:String,fr:String},
        image:String
      },
      about:{
        h:{en:String,de:String,fr:String},
        t:{en:String,de:String,fr:String},
        p:{en:String,de:String,fr:String},
        image:String
      },
      tagLine:{
        t:{en:String,de:String,fr:String},
        h:{en:String,de:String,fr:String},
        p:{en:String,de:String,fr:String},
        image:String
      },
      footer:{
        h:{en:String,de:String,fr:String},
        p:{en:String,de:String,fr:String},
        image:String
      },
      views:[{
        name:{en:String,fr:String,de:String},
        weight:{type:Number,default:1},
        url:String
      }]
    },

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
  * footer

## Home 
* route /store/__:name__ == **Home Page**

## Shop ( Home )
* route /store/__:name__ == **Home Page**
* current store is __bretzel__ (cart, products, vendors, belongs to the store name)
* 

## Cart ( Cart ) 
* route /store/__:name__/cart == **Cart Page**

## User pages
* route /store/__:name__/me
  * route /store/__:name__/me/orders
  * route /store/__:name__/me/login
  * route /store/__:name__/me/register

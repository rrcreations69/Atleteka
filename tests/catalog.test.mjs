import test from "node:test";
import assert from "node:assert/strict";
import { pageSchema, slugSchema, storagePathSchema, productSchema, availabilitySchema, priceLabel, formatPrice, publicImageUrl, toCatalogProduct } from "../lib/catalog/validation.ts";
const id="550e8400-e29b-41d4-a716-446655440000";
const other="550e8400-e29b-41d4-a716-446655440001";
const row={id,slug:"shirt",name:"Shirt",description:"Text",product_variants:[{id,title:"Small",price:25,active:true},{id:other,title:"Hidden",price:1,active:false}],product_images:[]};

test("invalid slugs and unbounded pagination are rejected",()=>{
 for(const value of ["", "../admin", "a/b", "a".repeat(201)]) assert.equal(slugSchema.safeParse(value).success,false);
 for(const value of ["0","-1","1.5","100001","bad"]) assert.equal(pageSchema.safeParse(value).success,false);
 assert.equal(pageSchema.parse("2"),2);
});
test("media paths cannot escape the public product bucket",()=>{
 for(const value of ["../private","/private","x/../secret","x\\secret","x?token=y","x#hash","https://evil.example/a"]) assert.equal(storagePathSchema.safeParse(value).success,false);
 const url=publicImageUrl("https://example.supabase.co","shirts/front photo.webp");
 assert.equal(url,"https://example.supabase.co/storage/v1/object/public/product-images/shirts/front%20photo.webp");
});
test("database payload assumptions are checked",()=>{
 assert.equal(productSchema.safeParse(row).success,true);
 assert.equal(productSchema.safeParse({...row,product_variants:[{id,title:"X",price:-1,active:true}]}).success,false);
 assert.equal(availabilitySchema.safeParse([{variant_id:id,in_stock:7}]).success,false);
});
test("inactive variants are excluded and absent availability fails closed",()=>{
 const product=toCatalogProduct(productSchema.parse(row),new Map(),"https://example.supabase.co");
 assert.equal(product.variants.length,1);
 assert.equal(product.variants[0].inStock,false);
 assert.equal(product.variants[0].price,25);
 assert.equal("quantity_on_hand" in product.variants[0],false);
});
test("image order and meaningful fallback alt text are preserved",()=>{
 const r={...row,product_images:[{id,storage_path:"last.webp",alt_text:"Last",sort_order:2},{id:other,storage_path:"first.webp",alt_text:"",sort_order:1}]};
 const product=toCatalogProduct(productSchema.parse(r),new Map([[id,true]]),"https://example.supabase.co");
 assert.equal(product.images[0].alt,"Shirt");
 assert.match(product.images[0].url,/first.webp$/);
 assert.equal(product.variants[0].inStock,true);
});
test("prices use the user-approved PHP currency and active-variant range",()=>{
 assert.match(formatPrice(25),/^PHP\s25\.00$/);
 assert.equal(priceLabel([]),"Price unavailable");
 const a={id,title:"A",price:25,inStock:true};
 assert.match(priceLabel([a]),/^PHP/);
 assert.match(priceLabel([a,{...a,id:other,price:30}]),/^From PHP/);
});

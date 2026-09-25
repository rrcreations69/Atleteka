import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { cartMutationSchema, cartSchema, guestTokenSchema, parseCartForm } from "../lib/cart/validation.ts";
import { formatPrice } from "../lib/catalog/validation.ts";
registerHooks({ resolve(specifier, context, next) {
  if (specifier === "./validation" && context.parentURL?.endsWith("/lib/cart/cookie.ts")) {
    return next("./validation.ts", context);
  }
  return next(specifier, context);
}});
const { guestCartCookie, hasAuthCookie } = await import("../lib/cart/cookie.ts");
const id="550e8400-e29b-41d4-a716-446655440000";

test("cart quantities reject ambiguous, fractional, nonpositive and overflowing input",()=>{
 for(const quantity of ["", "0", "-1", "1.5", "1e2", " 2", "02", "2147483648", "Infinity", 2]){
  assert.equal(cartMutationSchema.safeParse({operation:"add",variantId:id,quantity}).success,false);
 }
 assert.equal(cartMutationSchema.parse({operation:"set",variantId:id,quantity:"2"}).quantity,2);
 assert.equal(cartMutationSchema.safeParse({operation:"remove",variantId:id,quantity:null}).success,true);
 assert.equal(cartMutationSchema.safeParse({operation:"remove",variantId:id,quantity:"0"}).success,false);
 assert.equal(cartMutationSchema.safeParse({operation:"add",variantId:"../other",quantity:"1"}).success,false);
});
test("form boundary ignores browser money and owner fields, rejects duplicate quantities",()=>{
 const f=new FormData();f.set("operation","add");f.set("variantId",id);f.set("quantity","2");
 f.set("price","0.01");f.set("user_id",id);f.set("cart_id",id);
 assert.deepEqual(parseCartForm(f),{operation:"add",variantId:id,quantity:2});
 f.append("quantity","3");assert.equal(parseCartForm(f),null);
});
test("cart responses require decimal strings and typed availability flags",()=>{
 const item={variantId:id,productSlug:"shirt",productName:"Shirt",variantName:"Small",quantity:2,unitPrice:"12.50",lineTotal:"25.00",available:true,quantityValid:true};
 assert.equal(cartSchema.safeParse({id,items:[item],subtotal:"25.00"}).success,true);
 for(const subtotal of [25,"NaN","Infinity","-1","1e3"]){
  assert.equal(cartSchema.safeParse({id,items:[item],subtotal}).success,false);
 }
 assert.equal(cartSchema.safeParse({id,items:[{...item,available:"yes"}],subtotal:"25"}).success,false);
 assert.equal(cartSchema.safeParse({id,items:[{...item,productSlug:null,unitPrice:null,lineTotal:null,available:false,quantityValid:false}],subtotal:"0"}).success,true);
});
test("guest cookie is host-only, HttpOnly, SameSite=Lax, secure on HTTPS and expires in 30 days",()=>{
 const secure=guestCartCookie("https://shop.example");
 assert.equal(secure.name,"__Host-atleteka-cart");
 assert.deepEqual(secure.options,{httpOnly:true,sameSite:"lax",secure:true,path:"/",maxAge:2592000});
 assert.equal(guestCartCookie("http://localhost:3001").options.secure,false);
 assert.equal(guestTokenSchema.safeParse("a".repeat(64)).success,true);
 for(const token of ["a".repeat(63),"A".repeat(64),"<script>",null])assert.equal(guestTokenSchema.safeParse(token).success,false);
});
test("only this project's session cookie or numeric chunks select account verification",()=>{
 const url="https://project.supabase.co";
 for(const name of ["sb-project-auth-token","sb-project-auth-token.0","sb-project-auth-token.12"]){
  assert.equal(hasAuthCookie([{name,value:"untrusted"}],url),true);
 }
 for(const name of ["sb-other-auth-token","sb-project-auth-token-code-verifier","sb-project-auth-token.bad"]){
  assert.equal(hasAuthCookie([{name,value:"x"}],url),false);
 }
});
test("PHP formatting preserves exact decimal strings beyond floating-point precision",()=>{
 assert.match(formatPrice("9007199254740993.25"),/^PHP\s9,007,199,254,740,993\.25$/);
 assert.match(formatPrice("0.10"),/^PHP\s0\.10$/);
});

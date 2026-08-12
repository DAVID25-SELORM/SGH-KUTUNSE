import "server-only";
import { cache } from "react";
import { adminDb } from "./firebase-admin";
import type { Article, Doctor } from "@/types";
function imageUrl(value:unknown){if(!value||typeof value!=="object")return undefined;const url=(value as{url?:unknown}).url;return typeof url==="string"&&url.startsWith("/")?url:undefined}
export const getPublishedDoctors=cache(async():Promise<Doctor[]>=>{try{const snapshot=await adminDb.collection("doctors").where("status","==","published").where("verified","==",true).orderBy("displayOrder","asc").limit(100).get();return snapshot.docs.map(doc=>{const data=doc.data();return{slug:String(data.slug),fullName:String(data.fullName),specialty:String(data.specialty),role:String(data.qualifications??""),bio:String(data.biography??""),availability:String(data.availability??""),photo:imageUrl(data.image)}})}catch{return[]}});
export const getPublishedDoctor=cache(async(slug:string)=>(await getPublishedDoctors()).find(doctor=>doctor.slug===slug));
export const getPublishedArticles=cache(async():Promise<Article[]>=>{try{const snapshot=await adminDb.collection("articles").where("status","==","published").orderBy("publishedAt","desc").limit(100).get();return snapshot.docs.map(doc=>{const data=doc.data();const published=data.publishedAt?.toDate?.()??new Date(data.publishedAt||Date.now());return{slug:String(data.slug),title:String(data.title),category:String(data.category??"General Health"),date:published.toISOString(),heroImage:imageUrl(data.image)??"",author:String(data.author),excerpt:String(data.summary),content:String(data.body).split(/\n\n+/).filter(Boolean)}})}catch{return[]}});
export const getPublishedArticle=cache(async(slug:string)=>(await getPublishedArticles()).find(article=>article.slug===slug));

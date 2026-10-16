import posts from '@/content/engineering-journal.json';
const e=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
export async function GET(){
 const xml='<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>CoFounder Engineering Journal</title><link>https://cofounder.cx/blog</link><description>People, AI, and dependable software delivery.</description>'+posts.map(p=>'<item><title>'+e(p.title)+'</title><link>https://cofounder.cx/blog/'+p.slug+'</link><guid isPermaLink="true">https://cofounder.cx/blog/'+p.slug+'</guid><pubDate>'+new Date(p.publishedAt).toUTCString()+'</pubDate><description>'+e(p.description)+'</description></item>').join('')+'</channel></rss>';
 return new Response(xml,{headers:{'Content-Type':'application/rss+xml; charset=utf-8'}});
}

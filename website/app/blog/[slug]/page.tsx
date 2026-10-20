import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import posts from '@/content/engineering-journal.json';
import '../blog.css';
type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams(){return posts.map(post=>({slug:post.slug}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {slug}=await params;const post=posts.find(p=>p.slug===slug);if(!post)return {title:'Article not found'};
 const url='https://cofounder.cx/blog/'+post.slug;const image='https://cofounder.cx'+post.imagePath;
 return {title:post.title,description:post.description,alternates:{canonical:url},openGraph:{type:'article',title:post.title,description:post.description,url,publishedTime:post.publishedAt,images:[{url:image,width:1400,height:788,alt:post.imageAlt}]},twitter:{card:'summary_large_image',title:post.title,description:post.description,images:[image]}};
}
export default async function JournalArticle({params}:Props){
 const {slug}=await params;const post=posts.find(p=>p.slug===slug);if(!post)notFound();
 const headings:Array<{id:string;title:string}>=[];
 const body=post.bodyHtml.replace(/<h2>(.*?)<\/h2>/g,(_,title)=>{const id='section-'+(headings.length+1);headings.push({id,title});return '<h2 id="'+id+'">'+title+'</h2>';});
 const url='https://cofounder.cx/blog/'+post.slug;
 const schema={'@context':'https://schema.org','@graph':[{'@type':'BlogPosting',headline:post.title,description:post.description,datePublished:post.publishedAt,dateModified:post.publishedAt,author:{'@type':'Organization',name:'CoFounder',url:'https://cofounder.cx'},publisher:{'@type':'Organization',name:'CoFounder'},mainEntityOfPage:url,image:'https://cofounder.cx'+post.imagePath},{'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'CoFounder',item:'https://cofounder.cx/'},{'@type':'ListItem',position:2,name:'Engineering Journal',item:'https://cofounder.cx/blog'},{'@type':'ListItem',position:3,name:post.title,item:url}]}]};
 return <article className="engineering-journal"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/><Link href="/blog">← Engineering Journal</Link><p className="ej-meta">{post.category}</p><h1>{post.title}</h1><p className="ej-deck">{post.description}</p><p className="ej-meta">CoFounder · <time dateTime={post.publishedAt}>{new Date(post.publishedAt+'T12:00:00Z').toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'})}</time> · {post.minutes} min read</p><figure><img src={post.imagePath} alt={post.imageAlt} width={1400} height={788}/><figcaption>{post.imageCaption}</figcaption></figure><div className="ej-body"><section className="ej-answer"><h2>The useful starting point</h2><p>{post.quickAnswer}</p></section><details className="ej-toc"><summary>In this guide</summary><ul>{headings.map(h=><li key={h.id}><a href={'#'+h.id}>{h.title}</a></li>)}</ul></details><div dangerouslySetInnerHTML={{__html:body}}/><section><h2>Questions you might be asking</h2>{post.faq.map(f=><div key={f.question}><h3>{f.question}</h3><p>{f.answer}</p></div>)}</section><section><h2>Sources and further reading</h2><ul>{post.sources.map(s=><li key={s.url}><a href={s.url} rel="noopener noreferrer">{s.label}</a></li>)}</ul><p className="ej-meta">Sources checked {post.sourcesCheckedAt}. Examples and suggested workflows are original teaching exercises.</p></section><section><h2>Put the practice to work</h2><p>Explore the <Link href="/docs">CoFounder documentation</Link> and <Link href="/training">training library</Link> for the implementation context relevant to your project.</p></section></div></article>;
}


import type { Metadata } from 'next';
import Link from 'next/link';
import posts from '@/content/engineering-journal.json';
import './blog.css';
export const metadata: Metadata = {
 title: 'Engineering Journal',
 description: 'Practical guides to forward-deployed developers, AI-assisted engineering teams, and agile delivery.',
 alternates: { canonical: 'https://cofounder.cx/blog', types: { 'application/rss+xml': 'https://cofounder.cx/blog/feed.xml' } },
 openGraph: { title: 'Engineering Journal | CoFounder', description: 'People, AI, and dependable software delivery.', url: 'https://cofounder.cx/blog' },
};
export default function JournalPage() {
 return <section className="engineering-journal"><p>COFOUNDER / ENGINEERING JOURNAL</p><h1>Build faster.<br />Keep the judgment.</h1><p className="ej-deck">Field guides for the people designing, building, and operating software with AI. Clear responsibilities, useful evidence, and practical next steps.</p><p className="ej-meta"><a href="/blog/feed.xml">Follow the journal by RSS</a></p><div className="ej-grid">{posts.map(post=><Link className="ej-card" key={post.slug} href={'/blog/'+post.slug}><img src={post.imagePath} alt={post.imageAlt} width={1400} height={788}/><div><p className="ej-meta">{post.category} · {post.minutes} min read</p><h2>{post.title}</h2><p>{post.description}</p><p className="ej-meta">Published {new Date(post.publishedAt+'T12:00:00Z').toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'})}</p></div></Link>)}</div></section>;
}

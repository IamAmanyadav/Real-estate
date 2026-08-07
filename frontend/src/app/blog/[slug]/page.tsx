"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Calendar, User, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getBlogPostBySlug } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { BlogPost } from "@/types";

export default function BlogPostPage() {
  const params = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await getBlogPostBySlug(params.slug as string);
        setPost(data);
      } catch {
        setPost(null);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [params.slug]);

  if (loading) {
    return (
      <div className="pt-24 pb-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-muted rounded w-32" />
          <div className="h-10 bg-muted rounded w-3/4" />
          <div className="aspect-[16/9] bg-muted rounded-2xl" />
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
            <div className="h-4 bg-muted rounded w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="pt-24 pb-16 text-center py-20">
        <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
        <Button asChild className="rounded-full">
          <Link href="/blog">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Blog
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" asChild className="text-muted-foreground -ml-2 mb-6">
            <Link href="/blog">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Blog
            </Link>
          </Button>

          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0 rounded-full mb-4">
            {post.category}
          </Badge>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
            <div className="flex items-center gap-2">
              <img src={post.author.avatar} alt={post.author.name} className="w-8 h-8 rounded-full object-cover" />
              <span>{post.author.name}</span>
            </div>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(post.publishedAt)}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{post.readTime} min read</span>
          </div>

          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-10">
            <Image src={post.coverImage} alt={post.title} fill className="object-cover" priority sizes="(max-width: 900px) 100vw, 900px" />
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-emerald-600 dark:prose-a:text-emerald-400">
            {post.content.split("\n\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          <Separator className="my-10" />

          <div className="flex flex-wrap items-center gap-2">
            <Tag className="w-4 h-4 text-muted-foreground" />
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="rounded-full">{tag}</Badge>
            ))}
          </div>
        </motion.div>
      </article>
    </div>
  );
}

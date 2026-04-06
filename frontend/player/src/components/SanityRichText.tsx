"use client";

import { PortableText, PortableTextComponents } from "@portabletext/react";

interface SanityRichTextProps {
  value: any[];
  className?: string;
}

const components: PortableTextComponents = {
  block: {
    h1: ({ children }) => (
      <h1 className="font-heading text-4xl font-black text-brand-text mt-10 mb-4 leading-tight">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="font-heading text-3xl font-bold text-brand-text mt-8 mb-3 leading-tight">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-heading text-2xl font-bold text-brand-text mt-6 mb-2">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="font-heading text-xl font-semibold text-brand-text mt-5 mb-2">
        {children}
      </h4>
    ),
    normal: ({ children }) => (
      <p className="text-base leading-relaxed text-brand-text-muted mb-4">
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-brand-primary pl-4 my-6 italic text-brand-text-muted">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc list-inside space-y-1 mb-4 text-brand-text-muted">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal list-inside space-y-1 mb-4 text-brand-text-muted">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li className="text-base leading-relaxed">{children}</li>
    ),
    number: ({ children }) => (
      <li className="text-base leading-relaxed">{children}</li>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-semibold text-brand-text">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    underline: ({ children }) => <span className="underline">{children}</span>,
    code: ({ children }) => (
      <code className="bg-brand-surface-alt px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    ),
    link: ({ children, value }) => {
      const href = value?.href || "#";
      const isExternal = href.startsWith("http");
      return (
        <a
          href={href}
          className="text-brand-primary hover:text-brand-primary-hover underline transition-colors"
          {...(isExternal
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {children}
        </a>
      );
    },
  },
};

export function SanityRichText({ value, className }: SanityRichTextProps) {
  if (!value || value.length === 0) return null;

  return (
    <div className={`font-body ${className || ""}`}>
      <PortableText value={value} components={components} />
    </div>
  );
}

import { cn } from '@/lib/utils';

const Prose = ({ html, className }: { html: string; className?: string }) => {
  return (
    <div
      className={cn(
        'prose prose-sm text-xs leading-tight max-w-6xl prose-li:marker:text-current text-foreground prose-headings:mt-8 prose-headings:font-semibold prose-headings:tracking-wide prose-headings:text-foreground prose-h1:text-5xl prose-h2:text-4xl prose-h3:text-3xl prose-h4:text-2xl prose-h5:text-xl prose-h6:text-lg prose-a:text-foreground prose-a:underline prose-a:hover:text-neutral-300 prose-strong:text-foreground prose-ol:mt-8 prose-ol:list-decimal prose-ol:pl-6 prose-ul:mt-8 prose-ul:list-disc prose-ul:pl-6',
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default Prose;

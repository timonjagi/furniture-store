import { Footer } from './footer';

export const PageLayout = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={className}>
      <main>{children}</main>
      <Footer />
    </div>
  );
};

import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-6">
        <h1 className="text-6xl font-serif font-bold text-foreground">404</h1>
        <p className="text-xl text-muted-foreground">Page not found</p>
        <Link href="/">
          <Button data-testid="button-home">Return Home</Button>
        </Link>
      </div>
    </div>
  );
}

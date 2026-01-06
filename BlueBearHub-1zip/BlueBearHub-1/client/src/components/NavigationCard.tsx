import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface NavigationCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  url: string;
  iconColor?: string;
  comingSoon?: boolean;
}

export default function NavigationCard({
  title,
  description,
  icon: Icon,
  url,
  iconColor = "text-primary",
  comingSoon = false,
}: NavigationCardProps) {
  const handleClick = () => {
    if (comingSoon) {
      return;
    }
    console.log(`Navigating to ${title} at ${url}`);
    if (url.startsWith('/')) {
      window.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card
      className={`p-6 transition-all duration-200 relative ${
        comingSoon 
          ? 'opacity-75 cursor-not-allowed' 
          : 'cursor-pointer hover-elevate active-elevate-2'
      }`}
      onClick={handleClick}
      data-testid={`card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {comingSoon && (
        <Badge 
          variant="secondary" 
          className="absolute top-4 right-4"
          data-testid={`badge-coming-soon-${title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          Coming Soon
        </Badge>
      )}
      <div className="flex flex-col items-center text-center gap-4">
        <div className={`${iconColor} p-4 bg-muted rounded-lg`}>
          <Icon className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-serif font-semibold text-foreground">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </Card>
  );
}

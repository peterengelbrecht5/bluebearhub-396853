import Header from '@/components/Header';
import NavigationCard from '@/components/NavigationCard';
import { 
  Coins, 
  Heart, 
  Wheat, 
  Zap, 
  Activity,
  ShoppingBag,
  Vote
} from 'lucide-react';

const destinations = [
  {
    title: 'Blue Finance',
    description: 'Manage your finances with our comprehensive financial services and investment platform',
    icon: Coins,
    url: 'https://example.com/finance',
    iconColor: 'text-primary',
    comingSoon: true,
  },
  {
    title: 'Bear Hope',
    description: 'Supporting communities through charitable initiatives and humanitarian programs',
    icon: Heart,
    url: 'https://bearhope.replit.app/',
    iconColor: 'text-accent',
  },
  {
    title: 'Blue Farms',
    description: 'Sustainable agriculture solutions and farm management systems for modern farming',
    icon: Wheat,
    url: 'https://petes-pantry.replit.app',
    iconColor: 'text-primary',
  },
  {
    title: 'Blue Energies',
    description: 'Renewable energy solutions and power management for a sustainable future',
    icon: Zap,
    url: 'https://example.com/energies',
    iconColor: 'text-accent',
    comingSoon: true,
  },
  {
    title: 'Blue Health',
    description: 'Comprehensive healthcare services and wellness programs for better living',
    icon: Activity,
    url: 'https://example.com/health',
    iconColor: 'text-primary',
    comingSoon: true,
  },
  {
    title: 'Bear Market',
    description: 'Your trusted marketplace for quality products and seamless shopping experiences',
    icon: ShoppingBag,
    url: 'https://bear-marketplace-balloo.replit.app/',
    iconColor: 'text-accent',
  },
  {
    title: 'Blue Ballot',
    description: 'Democratic voting platform and election management for transparent decision-making',
    icon: Vote,
    url: '/ballot',
    iconColor: 'text-primary',
    comingSoon: true,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground" data-testid="text-heading">Welcome
          to
           Blue hub</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {destinations.map((destination) => (
            <NavigationCard
              key={destination.title}
              {...destination}
            />
          ))}
        </div>

        <footer className="mt-16 pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground" data-testid="text-footer">
            © 2025 Blue Bear. All rights reserved. Inspired by Nordic wisdom and design.
          </p>
        </footer>
      </main>
    </div>
  );
}

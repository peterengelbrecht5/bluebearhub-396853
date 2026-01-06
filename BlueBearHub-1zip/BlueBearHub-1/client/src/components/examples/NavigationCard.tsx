import NavigationCard from '../NavigationCard';
import { Coins } from 'lucide-react';

export default function NavigationCardExample() {
  return (
    <NavigationCard
      title="Blue Finance"
      description="Manage your finances with our comprehensive financial services platform"
      icon={Coins}
      url="https://example.com/finance"
      iconColor="text-primary"
    />
  );
}

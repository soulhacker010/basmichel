import React from 'react';
import { CreditCard, Lock } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

export default function AdminPayments() {
  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Betalingen"
        description="Beheer facturen en betalingen"
      />

      <div className="bg-white rounded-xl border border-gray-100 p-12">
        <EmptyState 
          icon={Lock}
          title="Betalingen zijn uitgeschakeld"
          description="De betalingsmodule wordt binnenkort geactiveerd. Je kunt hier straks facturen aanmaken en betalingen bijhouden."
        />
      </div>
    </div>
  );
}
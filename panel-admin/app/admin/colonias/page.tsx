import ColoniasClient from '@/components/admin/ColoniasClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Colonias | Panel Admin',
  description: 'Gestión de colonias',
};

export default function ColoniasPage() {
  return <ColoniasClient />;
}

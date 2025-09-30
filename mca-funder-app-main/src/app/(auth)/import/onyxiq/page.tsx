import { Metadata } from 'next';
import OnyxIQImportClient from './_components/OnyxIQImportClient';

export const metadata: Metadata = {
  title: 'Import from OnyxIQ - Funder CRM',
  description: 'Import your data from OnyxIQ platform',
};

export default function OnyxIQImportPage() {
  return <OnyxIQImportClient />;
}

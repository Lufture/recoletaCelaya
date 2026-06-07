import PageHeader from '@/components/admin/PageHeader';
import DataTableSkeleton from '@/components/admin/DataTableSkeleton';

export default function CiudadanosPage() {
  return (
    <>
      <PageHeader
        title="Ciudadanos"
        description="Usuarios registrados, domicilios y dispositivos"
      />
      <DataTableSkeleton columns={5} rows={10} />
    </>
  );
}

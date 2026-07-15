import { adminRepository } from "@/lib/repositories/admin-repository";
import { AdminsManager } from "@/components/super-admin/admins-manager";

export default async function AdminsPage() {
  const admins = await adminRepository.listAdmins();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Admins & Roles</h1>
        <p className="text-sm text-muted-foreground">Promote users to admin, assign permissions.</p>
      </div>
      <AdminsManager admins={admins} />
    </div>
  );
}

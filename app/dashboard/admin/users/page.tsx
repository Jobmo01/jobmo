import { adminRepository } from "@/lib/repositories/admin-repository";
import { UsersManager } from "@/components/admin/users-manager";

export default async function AdminUsersPage() {
  const users = await adminRepository.listUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">Manage applicant and employer accounts.</p>
      </div>
      <UsersManager initialUsers={users} />
    </div>
  );
}

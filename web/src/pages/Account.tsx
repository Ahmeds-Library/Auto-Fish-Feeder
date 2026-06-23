import { DeveloperCredit } from '../components/DeveloperCredit';
import { PageTitle } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';

export function AccountPage() {
  const { user, logout } = useAuth();

  return (
    <>
      <PageTitle title="Account" subtitle="Firebase Authentication user profile." />
      <div className="grid gap-5 lg:grid-cols-[.8fr_1fr]">
        <div className="card max-w-xl space-y-3">
          <p>Email: <b>{user?.email}</b></p>
          <p>UID: <b className="break-all">{user?.uid}</b></p>
          <button className="btn-primary" onClick={logout}>Logout</button>
        </div>
        <DeveloperCredit variant="about" />
      </div>
    </>
  );
}

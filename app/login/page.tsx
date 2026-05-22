import LoginForm from "./LoginForm";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="page-title mb-6">Log in</h1>
      <LoginForm next={searchParams.next ?? "/"} />
    </div>
  );
}

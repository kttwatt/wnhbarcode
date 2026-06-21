import { LoginForm } from "./login-form";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  return <LoginForm queryErrorKey={params.error} />;
}

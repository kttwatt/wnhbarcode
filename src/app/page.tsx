import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const code = typeof params.code === "string" ? params.code : null;
  const type = typeof params.type === "string" ? params.type : null;
  const token_hash = typeof params.token_hash === "string" ? params.token_hash : null;

  if (code || token_hash || type) {
    const qs = new URLSearchParams();
    if (code) qs.set("code", code);
    if (token_hash) qs.set("token_hash", token_hash);
    if (type) qs.set("type", type);
    const query = qs.toString();
    const target =
      type === "recovery" ? "/auth/reset-password" : "/auth/callback";
    redirect(query ? `${target}?${query}` : target);
  }

  redirect("/dashboard");
}

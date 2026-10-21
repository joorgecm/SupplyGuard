import Link from "next/link";
import { buttonClass } from "@/components/field";
import { getDict } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = await getDict();
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="display text-[2rem]">{t.errors.notFoundTitle}</h1>
      <p className="mt-2 text-ink-muted">{t.errors.notFoundBody}</p>
      <Link href="/incidents" className={`${buttonClass.secondary} mt-6`}>
        {t.errors.backToIncidents}
      </Link>
    </div>
  );
}

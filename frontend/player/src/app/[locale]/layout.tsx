import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/i18n-config";

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isValidLocale(params.locale)) {
    notFound();
  }

  return <>{children}</>;
}

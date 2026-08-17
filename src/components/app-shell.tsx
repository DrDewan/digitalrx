"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import { translate } from "@/lib/i18n";
import type { Language } from "@/lib/rx/types";
import {
  IconFiles,
  IconGear,
  IconLogout,
  IconRx,
  IconTemplate,
  IconUsers,
} from "@/components/icons";

type NavItem = {
  href: string;
  labelKey: Parameters<typeof translate>[1];
  Icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
};

const NAV: NavItem[] = [
  { href: "/rx", labelKey: "navPrescription", Icon: IconRx },
  { href: "/patients", labelKey: "navPatients", Icon: IconUsers },
  { href: "/prescriptions", labelKey: "navHistory", Icon: IconFiles },
  { href: "/templates", labelKey: "navTemplates", Icon: IconTemplate },
  { href: "/settings", labelKey: "navSettings", Icon: IconGear },
];

export function AppShell({
  children,
  doctorName,
  clinicName,
  language,
}: {
  children: React.ReactNode;
  doctorName: string;
  clinicName: string;
  language: Language;
}) {
  const pathname = usePathname();
  const [navCollapsed, setNavCollapsed] = useState(false);
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);

  useEffect(() => {
    setNavCollapsed(window.localStorage.getItem("digital-rx:nav-collapsed") === "1");
  }, []);

  const toggleNav = () => {
    setNavCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("digital-rx:nav-collapsed", next ? "1" : "0");
      return next;
    });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-slate-100">
      <header className="no-print sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 bg-chrome-900 px-3 text-white sm:px-4">
        <Link href="/rx" className="flex items-center gap-2.5 rounded-md px-1 py-1">
          <span className="flex size-8 items-center justify-center rounded-md bg-brand-500 text-base font-bold">
            ℞
          </span>
          <span className="text-[15px] font-semibold tracking-tight">{t("brand")}</span>
          {clinicName && (
            <span className="hidden truncate text-sm text-slate-400 sm:inline">· {clinicName}</span>
          )}
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden max-w-[16rem] truncate text-sm text-slate-300 sm:inline">
            {doctorName}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <IconLogout />
              <span className="hidden sm:inline">{t("signOut")}</span>
            </button>
          </form>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Wide screens: a labelled rail. Narrow: a bottom-safe horizontal bar. */}
        <nav
          aria-label="Sections"
          className={`no-print sticky top-14 z-20 flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 py-1.5 transition-[width] duration-200
                     lg:sticky lg:top-14 lg:h-[calc(100dvh-3.5rem)] lg:flex-col lg:overflow-y-auto lg:border-r lg:border-b-0 lg:px-2 lg:py-3 ${
                       navCollapsed ? "lg:w-16" : "lg:w-52"
                     }`}
        >
          <button
            type="button"
            onClick={toggleNav}
            className="mb-1 hidden h-9 items-center justify-center rounded-md border border-slate-200 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:flex"
            aria-label={navCollapsed ? "Expand navigation" : "Collapse navigation"}
            title={navCollapsed ? "Expand navigation" : "Collapse navigation"}
          >
            {navCollapsed ? "›" : "‹"}
          </button>

          {NAV.map(({ href, labelKey, Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition ${
                  active
                    ? "bg-brand-50 text-brand-800"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon />
                <span className={navCollapsed ? "lg:hidden" : ""}>{t(labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

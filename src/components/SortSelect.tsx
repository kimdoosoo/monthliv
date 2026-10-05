"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { sorts, type Sort } from "@/lib/sorts";


/** "정렬" above the results: changing it reloads the results in that order, keeping the search. */
export function SortSelect({ value }: { value: Sort }) {
  const t = useTranslations("results");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <label className="lv-sort">
      {t("sort")}
      <select
        className="lv-select lv-select--sm"
        value={value}
        onChange={(event) => {
          const next = new URLSearchParams(params.toString());
          if (event.target.value === "recommended") next.delete("sort");
          else next.set("sort", event.target.value);
          const query = Object.fromEntries(next.entries());
          router.replace({ pathname, query }, { scroll: false });
        }}
      >
        {sorts.map((sort) => (
          <option key={sort} value={sort}>
            {t(`sorts.${sort}`)}
          </option>
        ))}
      </select>
    </label>
  );
}

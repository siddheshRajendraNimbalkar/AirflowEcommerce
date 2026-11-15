
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Activity,
  Database,
  Settings,
  Users,
  Package,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
  { name: "Customers", href: "/dashboard/customers", icon: Users },
  { name: "Products", href: "/dashboard/products", icon: Package },
  { name: "Pipelines", href: "/dashboard/pipelines", icon: Activity },
  { name: "Data Sources", href: "/dashboard/data-sources", icon: Database },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-r bg-background md:block">
      <div className="border-b p-6">
        <h2 className="text-xl font-bold">Commerce Analytics</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Data Pipeline Platform
        </p>
      </div>

      <nav className="space-y-2 p-4">
        {navigation.map(({ name, href, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href + "/"));

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { mcpClient } from "@/lib/api";
import { DollarSign, AlertTriangle, Bug, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface OverviewData {
  month_to_date_spend: number;
  currency: string;
  open_critical_findings: number;
  kev_exposed_components: number;
  control_pass_rate: number;
}

export function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await mcpClient.get("/tools/overview/summary");
        if (!cancelled) setData(data);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Cross-domain snapshot for the current tenant.
        </p>
      </div>
      {error && (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi
          title="MTD spend"
          value={data ? formatCurrency(data.month_to_date_spend, data.currency) : "—"}
          icon={DollarSign}
          hint="All clouds combined"
        />
        <Kpi
          title="Open critical findings"
          value={data?.open_critical_findings ?? "—"}
          icon={AlertTriangle}
          hint="Security CSPM, any provider"
        />
        <Kpi
          title="KEV-exposed components"
          value={data?.kev_exposed_components ?? "—"}
          icon={Bug}
          hint="In CISA Known Exploited Vulns"
        />
        <Kpi
          title="Control pass rate"
          value={data ? `${Math.round(data.control_pass_rate * 100)}%` : "—"}
          icon={ShieldCheck}
          hint="Across active frameworks"
        />
      </div>
    </div>
  );
}

function Kpi({
  title,
  value,
  icon: Icon,
  hint,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

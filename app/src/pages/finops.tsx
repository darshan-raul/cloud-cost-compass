import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function FinOpsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">FinOps</h1>
        <p className="text-sm text-muted-foreground">Rightsizing, reservation coverage, idle resources.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming in Phase 2</CardTitle>
          <CardDescription>
            FinOps tools (<code>finops.get_rightsizing</code>, <code>finops.get_reservation_coverage</code>) land in F2.2.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This page will surface rightsizing recommendations, reservation utilization, and idle-resource lists aggregated across AWS, Azure, and GCP.
        </CardContent>
      </Card>
    </div>
  );
}

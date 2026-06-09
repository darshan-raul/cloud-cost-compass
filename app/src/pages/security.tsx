import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Security Posture</h1>
        <p className="text-sm text-muted-foreground">CSPM findings, IAM drift, public assets, encryption.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming in Phase 2</CardTitle>
          <CardDescription>
            Security tools (<code>security.list_findings</code>, <code>security.get_public_assets</code>, …) land in F2.3.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Aggregates Security Hub, Defender for Cloud, and Security Command Center into a single severity donut + drill-down table.
        </CardContent>
      </Card>
    </div>
  );
}

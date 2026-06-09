import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AlertsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Alerts</h1>
        <p className="text-sm text-muted-foreground">Rules, channels, recent events.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming in Phase 3</CardTitle>
          <CardDescription>
            Alerts service + tools (<code>alerts.*</code>) land in F3.4/F3.5.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Anomaly detection (z-score on daily EC2 spend), Slack channel test, rule CRUD.
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CompliancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Compliance</h1>
        <p className="text-sm text-muted-foreground">CIS, SOC2 — auto-evidence and control matrix.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming in Phase 3</CardTitle>
          <CardDescription>
            Compliance tools land in F3.3 (framework packs) and F3.7 (control KB RAG).
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Pass/fail per control, evidence bundle export for an audit window.
        </CardContent>
      </Card>
    </div>
  );
}

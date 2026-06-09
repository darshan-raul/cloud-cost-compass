import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ScaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Software Composition Analysis</h1>
        <p className="text-sm text-muted-foreground">SBOM ingestion, CVE/KEV exposure.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming in Phase 3</CardTitle>
          <CardDescription>
            SCA tools (<code>sca.ingest_sbom</code>, <code>sca.list_vulnerabilities</code>) land in F3.2.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          SBOM upload (CycloneDX/SPDX) and CVE/KEV coverage across the tenant&apos;s workloads.
        </CardContent>
      </Card>
    </div>
  );
}

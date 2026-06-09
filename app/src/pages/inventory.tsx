import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mcpClient } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

interface Resource {
  provider: string;
  account_id: string;
  region: string | null;
  service: string;
  resource_type: string;
  resource_id: string;
  resource_name: string | null;
  tags: Record<string, string>;
  status: string | null;
  last_seen: string;
}

export function InventoryPage() {
  const [provider, setProvider] = useState<"all" | "aws" | "azure" | "gcp">("all");
  const [service, setService] = useState("");
  const [rows, setRows] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await mcpClient.post("/tools/inventory.list_resources/invoke", {
        provider: provider === "all" ? undefined : provider,
        service: service || undefined,
        limit: 200,
      });
      setRows(data.items ?? data.data ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch_();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Resource Inventory</h1>
        <p className="text-sm text-muted-foreground">Normalized inventory across all configured clouds.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div>
            <Label>Provider</Label>
            <Tabs value={provider} onValueChange={(v) => setProvider(v as typeof provider)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="aws">AWS</TabsTrigger>
                <TabsTrigger value="azure">Azure</TabsTrigger>
                <TabsTrigger value="gcp">GCP</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div>
            <Label>Service</Label>
            <Input placeholder="ec2 / storage / sql" value={service} onChange={(e) => setService(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={fetch_} disabled={loading}>{loading ? "Loading…" : "Apply"}</Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{rows.length} resources</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last seen</TableHead>
                <TableHead>Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={`${r.provider}:${r.resource_id}`}>
                  <TableCell><Badge variant="outline">{r.provider}</Badge></TableCell>
                  <TableCell>{r.service}</TableCell>
                  <TableCell className="font-mono text-xs">{r.resource_type}</TableCell>
                  <TableCell className="font-mono text-xs">{r.resource_id}</TableCell>
                  <TableCell>{r.region ?? "—"}</TableCell>
                  <TableCell>{r.status ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(r.last_seen)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{Object.keys(r.tags ?? {}).length}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

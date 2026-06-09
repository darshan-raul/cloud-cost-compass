import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSession } from "@/auth/useSession";
import { Badge } from "@/components/ui/badge";

export function SettingsPage() {
  const { session } = useSession();
  if (!session) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Tenant Settings</h1>
        <p className="text-sm text-muted-foreground">Credentials, KB, and user info.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
          <CardDescription>Read from the verified OIDC token. Cannot be edited here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><Label>Tenant ID</Label><Input value={session.tenantId} readOnly /></div>
          <div><Label>User</Label><Input value={session.username} readOnly /></div>
          <div>
            <Label>Roles</Label>
            <div className="flex gap-2 mt-1">
              {session.roles.map((r) => <Badge key={r} variant="secondary">{r}</Badge>)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cloud credentials</CardTitle>
          <CardDescription>
            Provider creds (AWS, Azure, GCP) live in Vault at <code>secret/tenants/&#123;tid&#125;/providers/*.json</code>.
            Update via the Vault seed job; this page is read-only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>Rotate creds (admin only)</Button>
        </CardContent>
      </Card>
    </div>
  );
}

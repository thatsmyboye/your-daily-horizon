import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Key, Shield, Activity } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const DocsSetup = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Setup Documentation</h1>
          <p className="text-muted-foreground">Environment configuration and security guidelines</p>
        </div>

        {/* Environment Variables */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Environment Variables
            </CardTitle>
            <CardDescription>
              Horizon uses Lovable Cloud for backend services. Most environment variables are auto-configured.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                The <code className="text-xs bg-muted px-1 py-0.5 rounded">.env</code> file is automatically managed by Lovable Cloud. 
                Do not edit it directly.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Auto-Configured Variables</h3>
              <div className="space-y-2 text-sm font-mono bg-muted p-4 rounded-lg">
                <div>
                  <span className="text-primary">VITE_SUPABASE_URL</span>
                  <span className="text-muted-foreground ml-2">→ Your Supabase project URL</span>
                </div>
                <div>
                  <span className="text-primary">VITE_SUPABASE_PUBLISHABLE_KEY</span>
                  <span className="text-muted-foreground ml-2">→ Public API key</span>
                </div>
                <div>
                  <span className="text-primary">VITE_SUPABASE_PROJECT_ID</span>
                  <span className="text-muted-foreground ml-2">→ Project identifier</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Manual Configuration (Optional)</h3>
              <div className="space-y-2 text-sm">
                <div className="bg-muted p-4 rounded-lg">
                  <code className="text-primary">VITE_TEST_MODE=true</code>
                  <p className="text-muted-foreground mt-2">
                    Enables test mode features (admin panel, demo data seeding). 
                    Add this to your local <code className="text-xs bg-background px-1 py-0.5 rounded">.env</code> file for development.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Backend Secrets (Edge Functions)</h3>
              <p className="text-sm text-muted-foreground">
                Sensitive keys are stored securely in Supabase Vault and accessed only by backend functions:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li><code className="text-xs">LOVABLE_API_KEY</code> — AI gateway access (auto-configured)</li>
                <li><code className="text-xs">STRIPE_SECRET_KEY</code> — Payment processing (if enabled)</li>
                <li><code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> — Admin database access</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Key Rotation */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Key Rotation & Security
            </CardTitle>
            <CardDescription>
              Best practices for managing secrets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Rotating API Keys</h3>
              <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                <li>
                  Access your backend via the Lovable editor (Settings → Backend)
                </li>
                <li>
                  Navigate to Project Settings → API
                </li>
                <li>
                  Click "Generate new anon key" or "Reset service role key"
                </li>
                <li>
                  Lovable Cloud will automatically sync the new keys to your project
                </li>
                <li>
                  Redeploy your app if already published
                </li>
              </ol>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Row-Level Security (RLS)</h3>
              <p className="text-sm text-muted-foreground">
                All database tables use RLS policies to protect user data:
              </p>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>
                  <strong>missions, daily_entries, checkins, mentor_notes:</strong> Users can only access their own records (<code className="text-xs">auth.uid() = user_id</code>)
                </li>
                <li>
                  <strong>profiles:</strong> Users can read/write their own profile
                </li>
                <li>
                  <strong>user_roles:</strong> Only admins can modify roles; users can view their own
                </li>
              </ul>
              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  To modify RLS policies, use the Lovable editor's migration tool or access your backend directly. 
                  Always test policy changes thoroughly before deploying.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Health Check */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Health Check
            </CardTitle>
            <CardDescription>
              Monitor application status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm font-mono">
                <div className="text-primary">GET /api/health</div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Returns application version and current timestamp
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg text-sm font-mono">
              <div className="text-muted-foreground">// Response</div>
              <div>{`{`}</div>
              <div className="ml-4">
                <span className="text-primary">"version"</span>: <span className="text-accent">"1.0.0"</span>,
              </div>
              <div className="ml-4">
                <span className="text-primary">"timestamp"</span>: <span className="text-accent">"2025-01-14T12:00:00Z"</span>,
              </div>
              <div className="ml-4">
                <span className="text-primary">"status"</span>: <span className="text-accent">"healthy"</span>
              </div>
              <div>{`}`}</div>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Note:</strong> This documentation page is visible in all environments. 
            Consider gating access in production by checking user roles or implementing auth-only access.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default DocsSetup;

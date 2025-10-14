import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dumbbell, Brain, MessagesSquare, Sparkles, BookOpen, Wallet, Home, Eraser, Feather } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

type Bucket = 'Body'|'Mind'|'Connect'|'Create'|'Learn'|'Earn'|'Home'|'Reset'|'Reflect';
type Cadence = 'daily'|'weekly'|'monthly'|'seasonal';
type Size = 'S'|'M'|'L';

type Mission = {
  id: string;
  title: string;
  bucket: Bucket;
  size: Size;
  cadence: Cadence;
  xp: number;
  coins: number;
  instructions?: string;
  status?: 'available'|'completed'|'claimed';
  instance_id?: string;
};

const bucketIcon: Record<Bucket, any> = {
  Body: Dumbbell, Mind: Brain, Connect: MessagesSquare, Create: Sparkles,
  Learn: BookOpen, Earn: Wallet, Home: Home, Reset: Eraser, Reflect: Feather
};

export default function Missions() {
  const [tab, setTab] = useState<Cadence>('daily');
  const [items, setItems] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMissions();
  }, [tab]);

  const loadMissions = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Roll instances for current period
    await supabase.functions.invoke('roll-mission-instances', {
      body: { cadence: tab }
    });

    // Fetch mission instances
    const { data: instances } = await supabase
      .from('mission_instances')
      .select(`
        id,
        status,
        completed_at,
        missions (
          id,
          title,
          bucket,
          size,
          cadence,
          xp,
          coins,
          instructions
        )
      `)
      .eq('user_id', user.id)
      .eq('missions.cadence', tab)
      .limit(5);

    if (instances) {
      const mapped = instances.map((inst: any) => ({
        ...inst.missions,
        status: inst.status,
        instance_id: inst.id
      }));
      setItems(mapped);
    }
    setLoading(false);
  };

  const onComplete = async (m: Mission) => {
    if (!m.instance_id) return;
    
    const { error } = await supabase
      .from('mission_instances')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', m.instance_id);

    if (error) {
      toast.error("Failed to mark complete");
      return;
    }

    setItems(prev => prev.map(x => x.id === m.id ? {...x, status: 'completed'} : x));
    toast.success(`Completed: ${m.title}`);
  };

  const onClaim = async (m: Mission) => {
    if (!m.instance_id) return;

    const { error } = await supabase.functions.invoke('claim-mission-rewards', {
      body: { instance_id: m.instance_id }
    });

    if (error) {
      toast.error("Failed to claim rewards");
      return;
    }

    setItems(prev => prev.map(x => x.id === m.id ? {...x, status: 'claimed'} : x));
    toast.success(`Claimed! +${m.xp} XP · +${m.coins} HC`);
  };

  const headerCopy = useMemo(() => ({
    daily: 'Small wins, today.',
    weekly: 'Build your week.',
    monthly: 'Shape the month.',
    seasonal: 'Bigger arcs, new seasons.'
  } as Record<Cadence, string>), []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold tracking-tight">Missions</h1>
        <p className="text-muted-foreground">{headerCopy[tab]}</p>
      </motion.div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Cadence)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 rounded-xl">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="seasonal">Seasonal</TabsTrigger>
        </TabsList>

        {(['daily','weekly','monthly','seasonal'] as Cadence[]).map(k => (
          <TabsContent key={k} value={k}>
            {loading ? (
              <div className="mt-6 text-center text-muted-foreground">Loading missions...</div>
            ) : items.length === 0 ? (
              <Card className="mt-6 rounded-2xl">
                <CardHeader><CardTitle>No missions yet</CardTitle></CardHeader>
                <CardContent className="text-muted-foreground">
                  Pick a track and start small—momentum loves tiny wins.
                </CardContent>
              </Card>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {items.map((m, index) => {
                  const Icon = bucketIcon[m.bucket];
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Card className="relative transition hover:shadow-lg rounded-2xl">
                        <CardHeader className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Icon className="h-5 w-5" />
                            <CardTitle className="text-lg">{m.title}</CardTitle>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline">{m.bucket}</Badge>
                            <Badge variant="secondary">{m.size}</Badge>
                            <Badge>{m.xp} XP</Badge>
                            <Badge>{m.coins} HC</Badge>
                          </div>
                        </CardHeader>
                        {m.instructions && (
                          <CardContent className="text-sm text-muted-foreground">{m.instructions}</CardContent>
                        )}
                        <CardFooter className="flex gap-2">
                          {m.status === 'available' && (
                            <Button onClick={() => onComplete(m)} className="rounded-xl">Mark done</Button>
                          )}
                          {m.status === 'completed' && (
                            <Button onClick={() => onClaim(m)} variant="secondary" className="rounded-xl">Claim rewards</Button>
                          )}
                          {m.status === 'claimed' && (
                            <span className="text-sm text-green-600">✓ Claimed</span>
                          )}
                        </CardFooter>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

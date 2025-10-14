import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2, Crown, AlertCircle, Info } from "lucide-react";
import ProtectedRoute from "./ProtectedRoute";
import { useToast } from "@/hooks/use-toast";
import { getMentorMessageCount, canSendMentorMessage, getUserPlan, getPlanLimits } from "@/lib/subscription";
import { useNavigate } from "react-router-dom";
import { analytics } from "@/lib/analytics";
import { validateUserText, truncateText } from "@/lib/validation";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Mentor = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [plan, setPlan] = useState<"free" | "premium">("free");
  const [dailyLimit, setDailyLimit] = useState(40);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      setMessages([
        {
          role: "assistant",
          content:
            "Pick the smallest possible step—then go smaller.",
        },
      ]);

      const userPlan = await getUserPlan(user.id);
      setPlan(userPlan);

      const limits = getPlanLimits(userPlan);
      setDailyLimit(limits.mentorMessagesPerDay);

      const count = await getMentorMessageCount(user.id);
      setMessageCount(count);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    // Validate message
    const validation = validateUserText(input);
    if (!validation.valid) {
      toast({
        title: "Invalid Input",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    // Check message limit
    const canSend = await canSendMentorMessage(userId);
    if (!canSend) {
      toast({
        title: "Daily Limit Reached",
        description:
          "You've reached your daily message limit. Upgrade to Premium for unlimited messaging.",
        variant: "destructive",
      });
      return;
    }

    const truncatedInput = truncateText(input);
    const userMessage: Message = { role: "user", content: truncatedInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setMessageCount((prev) => prev + 1);

    const startTime = Date.now();

    try {
      const { data, error } = await supabase.functions.invoke("mentor-chat", {
        body: {
          userId,
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        },
      });

      if (error) throw error;

      const endTime = Date.now();
      const tokensIn = truncatedInput.length / 4; // Rough estimate
      const tokensOut = data.message ? data.message.length / 4 : 0;

      // Track analytics
      analytics.track("mentor_message", {
        tokens_in: Math.round(tokensIn),
        tokens_out: Math.round(tokensOut),
      });

      // Check if tool call is required
      if (data.requiresAction) {
        const toolCall = data.toolCall;
        console.log("Tool call required:", toolCall);

        // Execute tool call
        const toolResult = await supabase.functions.invoke("mentor-chat", {
          body: {
            userId,
            functionCall: toolCall,
          },
        });

        if (toolResult.error) throw toolResult.error;

        // Show result to user
        if (toolCall.name === "saveMentorNote") {
          toast({
            title: "Note Saved",
            description: "I've saved that insight for our future conversations.",
          });
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "I've noted that down. It'll help me support you better going forward.",
            },
          ]);
        } else if (toolCall.name === "suggestMicroHabits") {
          const habits = toolResult.data.habits;
          const habitsList = habits.map((h: string, i: number) => `${i + 1}. ${h}`).join("\n");
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `Here are 3 quick wins you can tackle today:\n\n${habitsList}\n\nPick one and give it a try!`,
            },
          ]);
        }
      } else if (data.message) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.message,
          },
        ]);
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
      // Remove the user message on error
      setMessages((prev) => prev.slice(0, -1));
      setMessageCount((prev) => Math.max(0, prev - 1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Main content area */}
        <div className="flex-1 flex flex-col bg-gradient-subtle">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold">Mentor Chat</h1>
                {plan === "free" && (
                  <div className="text-sm text-muted-foreground">
                    {messageCount}/{dailyLimit} messages today
                  </div>
                )}
              </div>
              <p className="text-muted-foreground">Get personalized guidance anytime</p>

              {plan === "free" && messageCount >= dailyLimit * 0.8 && (
                <Alert className="mt-4 border-primary/20 bg-primary/5">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>
                      {messageCount >= dailyLimit
                        ? "You've reached your daily message limit."
                        : "You're approaching your daily message limit."}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl ml-4"
                      onClick={() => navigate("/app/settings?tab=billing")}
                    >
                      <Crown className="mr-2 h-3 w-3" />
                      Upgrade
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </motion.div>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-auto p-6 space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <Card className={`rounded-2xl shadow-soft max-w-[80%] ${
                    message.role === 'user' ? 'gradient-primary' : ''
                  }`}>
                    <CardContent className={`p-4 ${
                      message.role === 'user' ? 'text-primary-foreground' : ''
                    }`}>
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-primary">Horizon</span>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <Card className="rounded-2xl shadow-soft">
                  <CardContent className="p-4 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Horizon is thinking...</span>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-6 border-t border-border bg-background">
            <div className="flex gap-2 max-w-4xl mx-auto">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask me anything..."
                className="rounded-2xl"
                disabled={loading}
                maxLength={2000}
              />
              <Button 
                onClick={handleSend} 
                className="rounded-2xl"
                disabled={loading || !input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-w-4xl mx-auto mt-2 space-y-1">
              <p className="text-xs text-center text-muted-foreground">
                I have context about your missions, recent reflections, and progress
              </p>
              <Alert className="border-none bg-transparent p-2">
                <Info className="h-3 w-3" />
                <AlertDescription className="text-xs">
                  <strong>Disclaimer:</strong> Horizon is an AI assistant for personal growth and is not a substitute for professional medical, mental health, or crisis services. If you're experiencing a crisis, please contact a qualified professional or emergency services.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Mentor;

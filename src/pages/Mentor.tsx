import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2 } from "lucide-react";
import ProtectedRoute from "./ProtectedRoute";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Mentor = () => {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        // Initial greeting
        setMessages([{
          role: 'assistant',
          content: "Hi! I'm Horizon, your AI mentor. I'm here to help you reflect, grow, and stay on track. What's on your mind?"
        }]);
      }
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('mentor-chat', {
        body: {
          userId,
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      });

      if (error) throw error;

      // Check if tool call is required
      if (data.requiresAction) {
        const toolCall = data.toolCall;
        console.log("Tool call required:", toolCall);

        // Execute tool call
        const toolResult = await supabase.functions.invoke('mentor-chat', {
          body: {
            userId,
            functionCall: toolCall
          }
        });

        if (toolResult.error) throw toolResult.error;

        // Show result to user
        if (toolCall.name === 'saveMentorNote') {
          toast({
            title: "Note Saved",
            description: "I've saved that insight for our future conversations.",
          });
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: "I've noted that down. It'll help me support you better going forward."
          }]);
        } else if (toolCall.name === 'suggestMicroHabits') {
          const habits = toolResult.data.habits;
          const habitsList = habits.map((h: string, i: number) => `${i + 1}. ${h}`).join('\n');
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Here are 3 quick wins you can tackle today:\n\n${habitsList}\n\nPick one and give it a try!`
          }]);
        }
      } else if (data.message) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message
        }]);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
      // Remove the user message on error
      setMessages(prev => prev.slice(0, -1));
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
              <h1 className="text-3xl font-bold mb-2">Mentor Chat</h1>
              <p className="text-muted-foreground">Get personalized guidance anytime</p>
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
              />
              <Button 
                onClick={handleSend} 
                className="rounded-2xl"
                disabled={loading || !input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              I have context about your missions, recent reflections, and progress
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Mentor;

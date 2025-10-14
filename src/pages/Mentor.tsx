import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import ProtectedRoute from "./ProtectedRoute";

const Mentor = () => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your AI mentor. I'm here to help you grow, reflect, and navigate life's challenges. What's on your mind today?"
    }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages([...messages, { role: "user", content: input }]);
    setInput("");
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I hear you. That's an important question. Let me help you think through it..."
      }]);
    }, 1000);
  };

  return (
    <ProtectedRoute>
      <div className="h-[calc(100vh-4rem)] flex flex-col p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold mb-2">Mentor Chat</h1>
          <p className="text-muted-foreground">Get personalized guidance anytime</p>
        </motion.div>

        <div className="flex-1 overflow-auto mb-6 space-y-4">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
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
                      <span className="text-sm font-medium text-primary">AI Mentor</span>
                    </div>
                  )}
                  <p className="text-sm">{message.content}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            className="rounded-2xl"
          />
          <Button onClick={handleSend} className="rounded-2xl">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Mentor;

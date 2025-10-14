import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, MessageCircle, Target } from "lucide-react";
import logo from "@/assets/logo.png";
import heroBg from "@/assets/hero-bg.png";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Sparkles,
      title: "Daily Pulse",
      description: "Check in with your day, track your mood, and get personalized insights"
    },
    {
      icon: Target,
      title: "Smart Missions",
      description: "AI-curated tasks that align with your goals and values"
    },
    {
      icon: TrendingUp,
      title: "Progress Map",
      description: "Visualize your growth journey with beautiful analytics"
    },
    {
      icon: MessageCircle,
      title: "Mentor Chat",
      description: "24/7 AI guidance for life's questions, big and small"
    }
  ];

  return (
    <div className="min-h-screen gradient-subtle">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Horizon Logo" className="w-10 h-10 rounded-xl" />
            <span className="text-xl font-semibold">Horizon</span>
          </div>
          <Button onClick={() => navigate("/auth")} variant="default">
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="container mx-auto px-4 pt-32 pb-20 relative"
        style={{
          backgroundImage: `linear-gradient(rgba(var(--background-rgb, 255, 255, 255), 0.85), rgba(var(--background-rgb, 255, 255, 255), 0.85)), url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent gradient-primary">
            Your Daily AI Life Mentor
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Horizon helps you grow, reflect, and navigate life with personalized guidance, 
            daily check-ins, and actionable insights—all powered by AI.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="rounded-2xl">
              Start Your Journey
            </Button>
            <Button size="lg" variant="outline" className="rounded-2xl">
              Learn More
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-medium transition-shadow">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-card rounded-2xl p-12 text-center shadow-medium"
        >
          <h2 className="text-3xl font-bold mb-4">Ready to start growing?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of people using Horizon to become their best selves.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="rounded-2xl">
            Get Started Free
          </Button>
        </motion.div>
      </section>
    </div>
  );
};

export default Landing;

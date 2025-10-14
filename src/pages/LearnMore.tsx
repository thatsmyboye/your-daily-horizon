import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Sparkles, TrendingUp, MessageCircle, Target, 
  CheckCircle, ArrowRight, Heart, Brain, Users, 
  Shield, Clock, Zap
} from "lucide-react";
import logo from "@/assets/logo.png";
import { fadeRiseIn, staggerContainer } from "@/lib/motion";

const LearnMore = () => {
  const navigate = useNavigate();

  const howItWorks = [
    {
      step: "01",
      title: "Start with Daily Pulse",
      description: "Begin each day with a quick check-in. Track your mood, energy, and reflect on what matters.",
      icon: Heart
    },
    {
      step: "02",
      title: "Get Personalized Missions",
      description: "Receive AI-curated tasks across 9 life buckets: Body, Mind, Connect, Create, Learn, Earn, Home, Reset, and Reflect.",
      icon: Target
    },
    {
      step: "03",
      title: "Track Progress Visually",
      description: "Watch your growth unfold through beautiful analytics, badges, and milestone celebrations.",
      icon: TrendingUp
    },
    {
      step: "04",
      title: "Get Guidance from AI Mentor",
      description: "Ask questions, seek advice, and get context-aware support whenever you need it.",
      icon: MessageCircle
    }
  ];

  const deepDives = [
    {
      icon: Heart,
      title: "Daily Pulse",
      features: [
        "Mood and energy tracking",
        "Reflection prompts tailored to you",
        "Pattern recognition over time",
        "Visual mood history"
      ]
    },
    {
      icon: Target,
      title: "Smart Missions",
      features: [
        "9 life buckets for holistic growth",
        "XP and coins reward system",
        "Streak tracking for motivation",
        "Difficulty levels that adapt to you"
      ]
    },
    {
      icon: TrendingUp,
      title: "Progress Map",
      features: [
        "Beautiful visual analytics",
        "Achievement badges and milestones",
        "Weekly and monthly insights",
        "Growth trajectory visualization"
      ]
    },
    {
      icon: MessageCircle,
      title: "Mentor Chat",
      features: [
        "24/7 AI-powered guidance",
        "Context-aware conversations",
        "Personalized advice based on your journey",
        "Safe space for any question"
      ]
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Build Consistency",
      description: "Daily check-ins and missions help you build sustainable habits that stick."
    },
    {
      icon: Brain,
      title: "Data-Driven Insights",
      description: "Understand patterns in your mood, energy, and progress with AI-powered analytics."
    },
    {
      icon: Shield,
      title: "Accountability",
      description: "Streaks, XP, and your AI mentor keep you motivated and on track."
    },
    {
      icon: Clock,
      title: "Flexible to Your Life",
      description: "Missions adapt to your schedule, energy, and current life situation."
    }
  ];

  const faqs = [
    {
      question: "Is there a free trial?",
      answer: "Yes! Get started with full access to explore all features."
    },
    {
      question: "How does the AI work?",
      answer: "Our AI analyzes your patterns, preferences, and goals to personalize missions and provide relevant guidance."
    },
    {
      question: "Is my data private?",
      answer: "Absolutely. Your data is encrypted and never shared. Privacy is our priority."
    },
    {
      question: "Can I use this on mobile?",
      answer: "Yes! Horizon works seamlessly on all devices—desktop, tablet, and mobile."
    },
    {
      question: "What are the 9 life buckets?",
      answer: "Body, Mind, Connect, Create, Learn, Earn, Home, Reset, and Reflect—covering all aspects of personal growth."
    }
  ];

  return (
    <div className="min-h-screen gradient-subtle">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <img src={logo} alt="Horizon Logo" className="w-10 h-10 rounded-xl" />
            <span className="text-xl font-semibold">Horizon</span>
          </div>
          <Button onClick={() => navigate("/auth")} variant="default">
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-32 pb-20">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeRiseIn}
          className="text-center max-w-3xl mx-auto"
        >
          <h1 className="text-5xl font-bold mb-6">
            Everything you need to <span className="gradient-text">grow, reflect, and thrive</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Horizon combines AI-powered guidance, habit tracking, and personal analytics 
            to help you become your best self—one day at a time.
          </p>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="space-y-8">
            {howItWorks.map((item, index) => (
              <motion.div
                key={item.step}
                variants={fadeRiseIn}
                className="flex gap-6 items-start"
              >
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
                    <item.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono text-muted-foreground">{item.step}</span>
                    <h3 className="text-xl font-semibold">{item.title}</h3>
                  </div>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Feature Deep Dives */}
      <section className="container mx-auto px-4 py-20 bg-card/30">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <h2 className="text-3xl font-bold text-center mb-12">Feature Deep Dive</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {deepDives.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={fadeRiseIn}
                className="bg-card rounded-2xl p-8 shadow-soft hover:shadow-medium transition-shadow"
              >
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
                <ul className="space-y-3">
                  {feature.features.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-horizon-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <h2 className="text-3xl font-bold text-center mb-4">Why Horizon Works</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Built on proven principles of habit formation, self-reflection, and personalized guidance
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                variants={fadeRiseIn}
                className="bg-card rounded-2xl p-6 shadow-soft"
              >
                <div className="w-12 h-12 rounded-xl bg-horizon-primary/10 flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-horizon-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-20 bg-card/30">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                variants={fadeRiseIn}
                className="bg-card rounded-xl p-6 shadow-soft"
              >
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-horizon-primary" />
                  {faq.question}
                </h3>
                <p className="text-muted-foreground pl-7">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeRiseIn}
          className="bg-card rounded-2xl p-12 text-center shadow-medium max-w-3xl mx-auto"
        >
          <Sparkles className="w-12 h-12 text-horizon-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Ready to start your journey?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join Horizon today and discover what you're truly capable of. No credit card required.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="rounded-2xl">
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/")} className="rounded-2xl">
              Back to Home
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default LearnMore;

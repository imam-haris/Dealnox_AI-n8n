'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Store, Bot, Users, Gavel, TrendingDown, CheckCircle2, Zap, ArrowRight } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  const features = [
    {
      icon: Bot,
      title: 'AI Chatbot Agent',
      description: 'Intelligent procurement assistant collects tender requirements through natural conversation',
      color: 'from-blue-600 to-cyan-600',
    },
    {
      icon: Users,
      title: 'Smart Vendor Shortlisting',
      description: 'AI analyzes and ranks vendors based on specialization, certifications, and fit score',
      color: 'from-purple-600 to-pink-600',
    },
    {
      icon: TrendingDown,
      title: 'Automated Negotiation',
      description: 'AI agents negotiate terms and pricing with vendors to get the best deals',
      color: 'from-orange-600 to-red-600',
    },
    {
      icon: Gavel,
      title: 'Reverse Auction',
      description: 'Live bidding competition drives prices down and ensures maximum value',
      color: 'from-green-600 to-emerald-600',
    },
    {
      icon: CheckCircle2,
      title: 'Intelligent Evaluation',
      description: 'Multi-criteria assessment recommends the best vendor based on price, quality, and delivery',
      color: 'from-indigo-600 to-purple-600',
    },
    {
      icon: Zap,
      title: 'End-to-End Automation',
      description: 'Complete tender lifecycle managed by AI agents with zero manual intervention',
      color: 'from-yellow-600 to-orange-600',
    },
  ];

  const stats = [
    { label: 'Faster Procurement', value: '60%', icon: Zap },
    { label: 'More Vendor Participation', value: '40%', icon: Users },
    { label: 'Cost Savings', value: '15%', icon: TrendingDown },
    { label: 'Automation Rate', value: '100%', icon: Bot },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-16 pt-12">
          <div className="inline-block mb-6">
            <div className="flex items-center space-x-3 bg-white px-6 py-3 rounded-full shadow-lg border border-blue-200">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full p-2">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Dealnox.AI
              </h1>
            </div>
          </div>

          <h2 className="text-5xl font-bold text-slate-900 mb-6 leading-tight">
            Multi-Agent AI Platform for
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Chemical Procurement
            </span>
          </h2>

          <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto">
            Automate your entire procurement lifecycle with intelligent AI agents.
            From tender creation to vendor selection, experience procurement without manual intervention.
          </p>

          <div className="flex items-center justify-center space-x-6">
            <Button
              size="lg"
              onClick={() => router.push('/company')}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-6 text-lg"
            >
              <Building2 className="h-6 w-6 mr-3" />
              Company Dashboard
              <ArrowRight className="h-5 w-5 ml-3" />
            </Button>

            <Button
              size="lg"
              onClick={() => router.push('/vendor')}
              variant="outline"
              className="border-2 border-green-600 text-green-600 hover:bg-green-50 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-lg"
            >
              <Store className="h-6 w-6 mr-3" />
              Vendor Portal
              <ArrowRight className="h-5 w-5 ml-3" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <stat.icon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-4xl font-bold text-slate-900 mb-2">{stat.value}</div>
                <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-slate-900 mb-4">AI-Powered Agent Workflow</h3>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Six specialized agents work together seamlessly to handle your entire procurement process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white hover:-translate-y-2"
              >
                <CardContent className="p-8">
                  <div className={`bg-gradient-to-br ${feature.color} rounded-2xl p-4 w-16 h-16 mb-6 flex items-center justify-center shadow-lg`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h4>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
          <CardContent className="p-12 relative">
            <div className="max-w-4xl mx-auto text-center">
              <h3 className="text-4xl font-bold mb-6">
                Transform Your Procurement Process Today
              </h3>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Join leading companies using AI to streamline chemical procurement.
                Reduce time, increase vendor participation, and save costs automatically.
              </p>
              <div className="flex items-center justify-center space-x-6">
                <Button
                  size="lg"
                  onClick={() => router.push('/company/tender/new')}
                  className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-6 text-lg"
                >
                  <Zap className="h-6 w-6 mr-3" />
                  Start Procurement
                  <ArrowRight className="h-5 w-5 ml-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-16 pb-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            <h4 className="text-2xl font-bold text-slate-900 mb-6 text-center">How It Works</h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { step: '1', label: 'Chat with AI', desc: 'Define requirements' },
                { step: '2', label: 'Auto Shortlist', desc: 'AI finds vendors' },
                { step: '3', label: 'Negotiate', desc: 'AI optimizes terms' },
                { step: '4', label: 'Live Auction', desc: 'Competitive bidding' },
                { step: '5', label: 'Select Winner', desc: 'AI recommends best' },
              ].map((item, idx) => (
                <div key={idx} className="text-center">
                  <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 text-white font-bold text-lg shadow-lg">
                    {item.step}
                  </div>
                  <h5 className="font-semibold text-slate-900 mb-1">{item.label}</h5>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

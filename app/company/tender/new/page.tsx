'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Company } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Send, ArrowLeft } from 'lucide-react';
import { runVendorShortlistingAgent } from '@/lib/agents';

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}

export default function NewTenderPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello! I\'m your AI procurement assistant. I\'ll help you create a tender. Let\'s start with the basics. What chemical do you need to procure?' },
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [tenderData, setTenderData] = useState({
    chemical_name: '',
    quantity: '',
    unit: '',
    delivery_location: '',
    deadline: '',
    budget_range: '',
    specifications: '',
  });
  const [step, setStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  async function loadCompanies() {
    const { data } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setCompanies(data);
      setSelectedCompany(data[0]);
    }
  }

  const questions = [
    { field: 'chemical_name', question: 'What chemical do you need to procure?', placeholder: 'e.g., Sulfuric Acid, Ethanol, etc.' },
    { field: 'quantity', question: 'What quantity do you need?', placeholder: 'e.g., 1000' },
    { field: 'unit', question: 'What is the unit of measurement?', placeholder: 'e.g., kg, liters, tons' },
    { field: 'delivery_location', question: 'Where should it be delivered?', placeholder: 'e.g., Mumbai, Maharashtra' },
    { field: 'deadline', question: 'What is your deadline? (YYYY-MM-DD)', placeholder: 'e.g., 2025-12-31' },
    { field: 'budget_range', question: 'What is your budget range?', placeholder: 'e.g., ₹50,000 - ₹100,000' },
    { field: 'specifications', question: 'Any specific requirements or specifications?', placeholder: 'e.g., Purity ≥ 98%, ISO certified vendor required' },
  ];

  const handleSend = async () => {
    if (!currentInput.trim()) return;

    const userMessage = currentInput;
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setCurrentInput('');

    const currentQuestion = questions[step];
    setTenderData((prev) => ({ ...prev, [currentQuestion.field]: userMessage }));

    if (step < questions.length - 1) {
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: 'assistant', content: questions[step + 1].question }]);
        setStep(step + 1);
      }, 500);
    } else {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Perfect! I have all the information. Creating your tender and initiating vendor shortlisting...' }]);
      await createTender();
    }
  };

  const createTender = async () => {
    if (!selectedCompany) return;
    setIsProcessing(true);

    try {
      const { data: tender, error } = await supabase
        .from('tenders')
        .insert({
          company_id: selectedCompany.id,
          title: `${tenderData.chemical_name} Procurement`,
          chemical_name: tenderData.chemical_name,
          quantity: parseFloat(tenderData.quantity),
          unit: tenderData.unit,
          delivery_location: tenderData.delivery_location,
          deadline: tenderData.deadline,
          budget_range: tenderData.budget_range,
          specifications: { details: tenderData.specifications },
          status: 'shortlisting',
          current_agent: 'vendor_shortlisting',
        })
        .select()
        .single();

      if (error) throw error;

      await runVendorShortlistingAgent(tender.id);

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Tender created successfully! Our AI has shortlisted the top vendors. Redirecting to tender details...' },
      ]);

      setTimeout(() => {
        router.push(`/company/tender/${tender.id}`);
      }, 2000);
    } catch (error) {
      console.error('Error creating tender:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, there was an error creating the tender. Please try again.' },
      ]);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.push('/company')} className="hover:bg-slate-100">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl p-3 shadow-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">AI Procurement Assistant</h1>
                <p className="text-sm text-slate-600">Let's create your tender together</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <Card className="border-0 shadow-xl h-[600px] flex flex-col">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-cyan-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Chatbot Agent</CardTitle>
                <CardDescription>Answer questions to build your procurement tender</CardDescription>
              </div>
              {selectedCompany && (
                <select
                  value={selectedCompany.id}
                  onChange={(e) => {
                    const company = companies.find((c) => c.id === e.target.value);
                    setSelectedCompany(company || null);
                  }}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl px-4 py-3 ${message.role === 'user' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
          </CardContent>

          <div className="border-t p-4">
            <div className="flex space-x-2">
              <Input
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={questions[step]?.placeholder || 'Type your response...'}
                disabled={isProcessing}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!currentInput.trim() || isProcessing}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

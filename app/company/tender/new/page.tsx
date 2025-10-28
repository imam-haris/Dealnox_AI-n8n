'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Bot, Send, ArrowLeft } from 'lucide-react';

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}

export default function ChatbotDialog() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const eventSource = new EventSource('/api/n8n-message');

    eventSource.onopen = () => {
      console.log(' SSE connection established');
      setMessages([
        { role: 'assistant', content: 'Hello! I’m your AI procurement assistant. How can I help you today?' },
      ]);
    };

    eventSource.onmessage = (event) => {
      console.log(' Raw event:', event.data);
      try {
        const data = JSON.parse(event.data);
        if (data.ping || data.connected) return;

        let messageText = data.message;

        // Auto-format vendor-style messages
        if (messageText.includes('Vendors supplying')) {
          messageText = messageText
            .replace(/Vendors supplying ([A-Za-z0-9\s]+) are /, 'Vendors supplying $1:\n\n')
            .replace(/\bwith quantity\b/g, '\n - Quantity:')
            .replace(/\btarget price\b/g, '\n - Target Price:')
            .replace(/\bmin price\b/g, '\n - Min Price:')
            .replace(/\bdelivery days\b/g, '\n - Delivery Days:')
            .replace(/\brating\b/g, '\n - Rating:')
            .replace(/\bcontact email\b/g, '\n - Contact Email:')
            .replace(/([a-z]\.com)\s+([A-Z][a-zA-Z]+)/g, '$1\n\n$2');
        }

        setMessages((prev) => [...prev, { role: 'assistant', content: messageText }]);
      } catch (err) {
        console.error(' Error parsing message:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error(' SSE error:', err);
      eventSource.close();
      setTimeout(() => window.location.reload(), 2000);
    };

    return () => {
      console.log(' Closing SSE connection');
      eventSource.close();
    };
  }, []);

  const handleSend = async () => {
    if (!currentInput.trim()) return;

    const userMessage = currentInput;
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setCurrentInput('');

    try {
      await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });
    } catch (error) {
      console.error(' Error sending message:', error);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
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
                <p className="text-sm text-slate-600">Chat with your automation workflow in real-time</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Section */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <Card className="border-0 shadow-xl h-[600px] flex flex-col">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-cyan-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Chatbot Agent</CardTitle>
                <CardDescription>Connected live with your n8n automation</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 whitespace-pre-wrap ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                      : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
          </CardContent>

          {/* Input Box */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <Input
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!currentInput.trim()}
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

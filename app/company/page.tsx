'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Tender, Company } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, MessageSquare, Users, Gavel, TrendingUp, Plus, Clock, CheckCircle2 } from 'lucide-react';

export default function CompanyDashboard() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      loadTenders();
    }
  }, [selectedCompany]);

  async function loadCompanies() {
    const { data } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setCompanies(data);
      setSelectedCompany(data[0]);
    }
    setLoading(false);
  }

  async function loadTenders() {
    if (!selectedCompany) return;
    const { data } = await supabase
      .from('tenders')
      .select('*')
      .eq('company_id', selectedCompany.id)
      .order('created_at', { ascending: false });
    if (data) setTenders(data);
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-500',
      collecting_info: 'bg-blue-500',
      shortlisting: 'bg-cyan-500',
      awaiting_approval: 'bg-yellow-500',
      negotiating: 'bg-orange-500',
      auction: 'bg-red-500',
      evaluating: 'bg-purple-500',
      completed: 'bg-green-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const stats = [
    { label: 'Active Tenders', value: tenders.filter((t) => !['completed', 'cancelled'].includes(t.status)).length, icon: Clock, color: 'text-blue-600' },
    { label: 'Completed', value: tenders.filter((t) => t.status === 'completed').length, icon: CheckCircle2, color: 'text-green-600' },
    { label: 'In Negotiation', value: tenders.filter((t) => t.status === 'negotiating').length, icon: MessageSquare, color: 'text-orange-600' },
    { label: 'In Auction', value: tenders.filter((t) => t.status === 'auction').length, icon: Gavel, color: 'text-red-600' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl p-3 shadow-lg">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Dealnox.AI</h1>
                <p className="text-sm text-slate-600">Company Procurement Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedCompany?.id || ''}
                onChange={(e) => {
                  const company = companies.find((c) => c.id === e.target.value);
                  setSelectedCompany(company || null);
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              <Button onClick={() => router.push('/company/tender/new')} size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg">
                <Plus className="h-5 w-5 mr-2" />
                Start Procurement
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} bg-opacity-10 rounded-full p-3`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900">All Tenders</CardTitle>
            <CardDescription>Track your procurement lifecycle across all stages</CardDescription>
          </CardHeader>
          <CardContent>
            {tenders.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No tenders yet</h3>
                <p className="text-slate-600 mb-6">Start your first procurement process to see it here</p>
                <Button onClick={() => router.push('/company/tender/new')} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Tender
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {tenders.map((tender) => (
                  <div
                    key={tender.id}
                    onClick={() => router.push(`/company/tender/${tender.id}`)}
                    className="p-6 border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all duration-200 cursor-pointer bg-white"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">{tender.title}</h3>
                        <p className="text-sm text-slate-600">
                          {tender.chemical_name} • {tender.quantity} {tender.unit}
                        </p>
                      </div>
                      <Badge className={`${getStatusColor(tender.status)} text-white`}>
                        {tender.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4 text-slate-600">
                        <span className="flex items-center">
                          <Building2 className="h-4 w-4 mr-1" />
                          {tender.delivery_location}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Due: {new Date(tender.deadline).toLocaleDateString()}
                        </span>
                      </div>
                      <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-300">
                        View Details →
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

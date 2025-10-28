'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Tender, Vendor, ShortlistedVendor, Bid } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, FileText, TrendingUp, CheckCircle2, Clock, DollarSign, MapPin, Calendar } from 'lucide-react';

export default function VendorDashboard() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [availableTenders, setAvailableTenders] = useState<(Tender & { shortlisted?: ShortlistedVendor })[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVendors();
  }, []);

  useEffect(() => {
    if (selectedVendor) {
      loadData();
      const interval = setInterval(loadData, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedVendor]);

  async function loadVendors() {
    const { data } = await supabase.from('vendors').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setVendors(data);
      setSelectedVendor(data[0]);
    }
    setLoading(false);
  }

  async function loadData() {
    if (!selectedVendor) return;

    const { data: shortlistedData } = await supabase
      .from('shortlisted_vendors')
      .select('*, tender:tenders(*)')
      .eq('vendor_id', selectedVendor.id)
      .eq('status', 'approved');

    if (shortlistedData) {
      const tenders = shortlistedData
        .map((s: any) => ({ ...s.tender, shortlisted: s }))
        .filter((t: any) => !['completed', 'cancelled'].includes(t.status));
      setAvailableTenders(tenders);
    }

    const { data: bidsData } = await supabase
      .from('bids')
      .select('*, tender:tenders(*)')
      .eq('vendor_id', selectedVendor.id)
      .order('created_at', { ascending: false });

    if (bidsData) {
      setMyBids(bidsData as any);
    }
  }

  const stats = [
    { label: 'Available Tenders', value: availableTenders.length, icon: FileText, color: 'text-blue-600' },
    { label: 'Active Bids', value: myBids.filter((b) => ['submitted', 'under_negotiation', 'accepted'].includes(b.status)).length, icon: TrendingUp, color: 'text-orange-600' },
    { label: 'Won Tenders', value: myBids.filter((b) => b.status === 'accepted').length, icon: CheckCircle2, color: 'text-green-600' },
    { label: 'Total Bids', value: myBids.length, icon: DollarSign, color: 'text-purple-600' },
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
              <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-3 shadow-lg">
                <Store className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Dealnox.AI</h1>
                <p className="text-sm text-slate-600">Vendor Portal</p>
              </div>
            </div>
            <select
              value={selectedVendor?.id || ''}
              onChange={(e) => {
                const vendor = vendors.find((v) => v.id === e.target.value);
                setSelectedVendor(vendor || null);
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {selectedVendor && (
          <Card className="border-0 shadow-lg mb-8 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedVendor.name}</h2>
                  <p className="text-sm text-slate-600 mb-4">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    {selectedVendor.location} • Rating: {selectedVendor.rating}/5.0
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedVendor.specializations.map((spec, idx) => (
                      <Badge key={idx} variant="outline" className="bg-white">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedVendor.certifications.map((cert, idx) => (
                    <Badge key={idx} className="bg-green-600">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

        <Tabs defaultValue="available" className="space-y-6">
          <TabsList className="bg-white border shadow-sm p-1">
            <TabsTrigger value="available" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <FileText className="h-4 w-4 mr-2" />
              Available Tenders ({availableTenders.length})
            </TabsTrigger>
            <TabsTrigger value="mybids" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4 mr-2" />
              My Bids ({myBids.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Available Tenders</CardTitle>
                <CardDescription>Tenders where you have been shortlisted</CardDescription>
              </CardHeader>
              <CardContent>
                {availableTenders.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No available tenders</h3>
                    <p className="text-slate-600">Check back later for new opportunities</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableTenders.map((tender) => (
                      <div
                        key={tender.id}
                        onClick={() => router.push(`/vendor/tender/${tender.id}`)}
                        className="p-6 border border-slate-200 rounded-xl hover:border-green-400 hover:shadow-md transition-all duration-200 cursor-pointer bg-white"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">{tender.title}</h3>
                            <p className="text-sm text-slate-600">
                              {tender.chemical_name} • {tender.quantity} {tender.unit}
                            </p>
                          </div>
                          {tender.shortlisted && (
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600">{tender.shortlisted.fit_score}</div>
                              <p className="text-xs text-slate-600">Fit Score</p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-slate-600">
                            <span className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {tender.delivery_location}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(tender.deadline).toLocaleDateString()}
                            </span>
                          </div>
                          <Button variant="outline" size="sm" className="hover:bg-green-50 hover:border-green-300">
                            Submit Bid →
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mybids">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>My Bids</CardTitle>
                <CardDescription>Track all your submitted bids</CardDescription>
              </CardHeader>
              <CardContent>
                {myBids.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No bids yet</h3>
                    <p className="text-slate-600">Submit your first bid to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myBids.map((bid) => (
                      <div key={bid.id} className="p-6 border border-slate-200 rounded-xl bg-white">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">{(bid as any).tender?.title || 'Tender'}</h3>
                            <p className="text-sm text-slate-600">
                              Delivery: {bid.delivery_time} days • Submitted: {new Date(bid.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={bid.status === 'accepted' ? 'bg-green-500' : bid.status === 'rejected' ? 'bg-red-500' : 'bg-blue-500'}>
                            {bid.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6">
                            <div>
                              <p className="text-sm text-slate-600">Initial Price</p>
                              <p className="text-lg font-bold text-slate-900">₹{bid.initial_price.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-600">Current Price</p>
                              <p className="text-lg font-bold text-green-600">₹{bid.current_price.toLocaleString()}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => router.push(`/vendor/tender/${bid.tender_id}`)}>
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

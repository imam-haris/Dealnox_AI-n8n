'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Tender, ShortlistedVendor, Bid, Negotiation, Auction, Evaluation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, CheckCircle2, Building2, MapPin, Calendar, DollarSign, TrendingUp, Users, Gavel, Award } from 'lucide-react';
import { initiateNegotiations, startAuction, evaluateVendors } from '@/lib/agents';

export default function TenderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tenderId = params.id as string;

  const [tender, setTender] = useState<Tender | null>(null);
  const [shortlisted, setShortlisted] = useState<ShortlistedVendor[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [tenderId]);

  async function loadData() {
    const { data: tenderData } = await supabase.from('tenders').select('*').eq('id', tenderId).single();
    if (tenderData) setTender(tenderData);

    const { data: shortlistedData } = await supabase
      .from('shortlisted_vendors')
      .select('*, vendor:vendors(*)')
      .eq('tender_id', tenderId)
      .order('fit_score', { ascending: false });
    if (shortlistedData) setShortlisted(shortlistedData as any);

    const { data: bidsData } = await supabase
      .from('bids')
      .select('*, vendor:vendors(*)')
      .eq('tender_id', tenderId)
      .order('current_price', { ascending: true });
    if (bidsData) setBids(bidsData as any);

    const { data: negotiationsData } = await supabase
      .from('negotiations')
      .select('*, vendor:vendors(*)')
      .eq('tender_id', tenderId);
    if (negotiationsData) setNegotiations(negotiationsData as any);

    const { data: auctionData } = await supabase
      .from('auctions')
      .select('*, current_leader:vendors(*)')
      .eq('tender_id', tenderId)
      .single();
    if (auctionData) setAuction(auctionData as any);

    const { data: evaluationsData } = await supabase
      .from('evaluations')
      .select('*, vendor:vendors(*)')
      .eq('tender_id', tenderId)
      .order('overall_score', { ascending: false });
    if (evaluationsData) setEvaluations(evaluationsData as any);

    setLoading(false);
  }

  async function approveVendors() {
    await supabase
      .from('shortlisted_vendors')
      .update({ status: 'approved' })
      .eq('tender_id', tenderId)
      .eq('status', 'pending');

    await initiateNegotiations(tenderId);
    await loadData();
  }

  async function startAuctionPhase() {
    await startAuction(tenderId);
    await loadData();
  }

  async function runEvaluation() {
    await evaluateVendors(tenderId);
    await loadData();
  }

  if (loading || !tender) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading tender details...</p>
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
              <Button variant="ghost" onClick={() => router.push('/company')} className="hover:bg-slate-100">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{tender.title}</h1>
                <p className="text-sm text-slate-600">Tender ID: {tender.id.slice(0, 8)}</p>
              </div>
            </div>
            <Badge className={`${tender.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'} text-white text-sm px-4 py-2`}>
              {tender.status.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <p className="text-sm font-medium text-slate-600">Chemical</p>
              </div>
              <p className="text-xl font-bold text-slate-900">{tender.chemical_name}</p>
              <p className="text-sm text-slate-600 mt-1">
                {tender.quantity} {tender.unit}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-2">
                <MapPin className="h-5 w-5 text-green-600" />
                <p className="text-sm font-medium text-slate-600">Delivery Location</p>
              </div>
              <p className="text-lg font-bold text-slate-900">{tender.delivery_location}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                <p className="text-sm font-medium text-slate-600">Deadline</p>
              </div>
              <p className="text-lg font-bold text-slate-900">{new Date(tender.deadline).toLocaleDateString()}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="shortlisted" className="space-y-6">
          <TabsList className="bg-white border shadow-sm p-1">
            <TabsTrigger value="shortlisted" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Users className="h-4 w-4 mr-2" />
              Shortlisted Vendors ({shortlisted.length})
            </TabsTrigger>
            <TabsTrigger value="negotiation" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4 mr-2" />
              Negotiations ({negotiations.length})
            </TabsTrigger>
            <TabsTrigger value="auction" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Gavel className="h-4 w-4 mr-2" />
              Auction
            </TabsTrigger>
            <TabsTrigger value="evaluation" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Award className="h-4 w-4 mr-2" />
              Evaluation ({evaluations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shortlisted">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Shortlisted Vendors</CardTitle>
                    <CardDescription>AI-selected vendors based on fit score</CardDescription>
                  </div>
                  {shortlisted.some((v) => v.status === 'pending') && (
                    <Button onClick={approveVendors} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve & Start Negotiation
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shortlisted.map((item) => (
                    <div key={item.id} className="p-4 border border-slate-200 rounded-lg bg-white">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{item.vendor?.name}</h3>
                          <p className="text-sm text-slate-600">{item.vendor?.location}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{item.fit_score}</div>
                          <p className="text-xs text-slate-600">Fit Score</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 mb-3">{item.reasoning}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {item.vendor?.specializations.slice(0, 3).map((spec, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                        <Badge className={item.status === 'approved' ? 'bg-green-500' : 'bg-yellow-500'}>
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="negotiation">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Ongoing Negotiations</CardTitle>
                    <CardDescription>AI-driven negotiations with approved vendors</CardDescription>
                  </div>
                  {bids.length > 0 && tender.status === 'negotiating' && (
                    <Button onClick={startAuctionPhase} className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700">
                      <Gavel className="h-4 w-4 mr-2" />
                      Start Reverse Auction
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {bids.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-600">Waiting for vendor bids...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bids.map((bid) => (
                      <div key={bid.id} className="p-4 border border-slate-200 rounded-lg bg-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">{bid.vendor?.name}</h3>
                            <p className="text-sm text-slate-600">Delivery: {bid.delivery_time} days</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">₹{bid.current_price.toLocaleString()}</div>
                            <Badge className="mt-1 bg-blue-500">{bid.status}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auction">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Reverse Auction</CardTitle>
                    <CardDescription>Live bidding competition</CardDescription>
                  </div>
                  {auction && auction.status === 'completed' && (
                    <Button onClick={runEvaluation} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                      <Award className="h-4 w-4 mr-2" />
                      Run Final Evaluation
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!auction ? (
                  <div className="text-center py-12">
                    <Gavel className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">Auction not started yet</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-xl border border-red-200">
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-600 mb-2">Current Lowest Bid</p>
                        <p className="text-4xl font-bold text-red-600">₹{auction.current_lowest_price.toLocaleString()}</p>
                        {auction.current_leader && (
                          <p className="text-sm text-slate-600 mt-2">Leading: {auction.current_leader.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Start: {new Date(auction.start_time).toLocaleString()}</span>
                      <Badge className={auction.status === 'live' ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}>
                        {auction.status}
                      </Badge>
                      <span>End: {new Date(auction.end_time).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evaluation">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Final Evaluation</CardTitle>
                <CardDescription>AI-powered vendor assessment</CardDescription>
              </CardHeader>
              <CardContent>
                {evaluations.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">Evaluation pending</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {evaluations.map((evaluation, index) => (
                      <div key={evaluation.id} className={`p-6 rounded-xl border-2 ${index === 0 ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50' : 'border-slate-200 bg-white'}`}>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center space-x-3">
                              <h3 className="text-xl font-bold text-slate-900">{evaluation.vendor?.name}</h3>
                              {index === 0 && <Badge className="bg-green-500">Recommended</Badge>}
                            </div>
                            <p className="text-sm text-slate-600 mt-1">{evaluation.recommendation}</p>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-green-600">{evaluation.overall_score}</div>
                            <p className="text-xs text-slate-600">Overall Score</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{evaluation.price_score}</p>
                            <p className="text-xs text-slate-600">Price Score</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">{evaluation.quality_score}</p>
                            <p className="text-xs text-slate-600">Quality Score</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-orange-600">{evaluation.delivery_score}</p>
                            <p className="text-xs text-slate-600">Delivery Score</p>
                          </div>
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

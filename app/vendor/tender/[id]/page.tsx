'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Tender, Vendor, Bid, Negotiation, Auction, AuctionBid } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Building2, MapPin, Calendar, DollarSign, Send, Gavel } from 'lucide-react';

export default function VendorTenderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tenderId = params.id as string;

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [tender, setTender] = useState<Tender | null>(null);
  const [myBid, setMyBid] = useState<Bid | null>(null);
  const [negotiation, setNegotiation] = useState<Negotiation | null>(null);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [auctionBids, setAuctionBids] = useState<AuctionBid[]>([]);
  const [loading, setLoading] = useState(true);

  const [bidForm, setBidForm] = useState({
    price: '',
    deliveryTime: '',
    terms: '',
  });

  const [negotiationMessage, setNegotiationMessage] = useState('');
  const [auctionBidAmount, setAuctionBidAmount] = useState('');

  useEffect(() => {
    loadVendors();
  }, []);

  useEffect(() => {
    if (selectedVendor) {
      loadData();
      const interval = setInterval(loadData, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedVendor, tenderId]);

  async function loadVendors() {
    const { data } = await supabase.from('vendors').select('*');
    if (data && data.length > 0) {
      setVendors(data);
      setSelectedVendor(data[0]);
    }
    setLoading(false);
  }

  async function loadData() {
    if (!selectedVendor) return;

    const { data: tenderData } = await supabase.from('tenders').select('*').eq('id', tenderId).single();
    if (tenderData) setTender(tenderData);

    const { data: bidData } = await supabase
      .from('bids')
      .select('*')
      .eq('tender_id', tenderId)
      .eq('vendor_id', selectedVendor.id)
      .maybeSingle();
    if (bidData) setMyBid(bidData);

    const { data: negotiationData } = await supabase
      .from('negotiations')
      .select('*')
      .eq('tender_id', tenderId)
      .eq('vendor_id', selectedVendor.id)
      .maybeSingle();
    if (negotiationData) setNegotiation(negotiationData);

    const { data: auctionData } = await supabase
      .from('auctions')
      .select('*')
      .eq('tender_id', tenderId)
      .maybeSingle();
    if (auctionData) {
      setAuction(auctionData);

      const { data: auctionBidsData } = await supabase
        .from('auction_bids')
        .select('*, vendor:vendors(*)')
        .eq('auction_id', auctionData.id)
        .order('bid_amount', { ascending: true });
      if (auctionBidsData) setAuctionBids(auctionBidsData as any);
    }
  }

  async function submitBid() {
    if (!selectedVendor || !bidForm.price || !bidForm.deliveryTime) return;

    const price = parseFloat(bidForm.price);

    const { data: bid } = await supabase
      .from('bids')
      .insert({
        tender_id: tenderId,
        vendor_id: selectedVendor.id,
        initial_price: price,
        current_price: price,
        delivery_time: parseInt(bidForm.deliveryTime),
        terms: { notes: bidForm.terms },
        status: 'submitted',
      })
      .select()
      .single();

    if (bid && negotiation) {
      const newMessage = {
        sender: 'vendor',
        message: `Initial bid submitted: ₹${price.toLocaleString()}. Delivery time: ${bidForm.deliveryTime} days.`,
        timestamp: new Date().toISOString(),
      };

      await supabase
        .from('negotiations')
        .update({
          bid_id: bid.id,
          messages: [...(negotiation.messages || []), newMessage],
        })
        .eq('id', negotiation.id);

      setTimeout(async () => {
        const agentResponse = {
          sender: 'agent',
          message: `Thank you for your bid. We're reviewing your offer. Can you improve the price by 5% to be more competitive?`,
          timestamp: new Date().toISOString(),
        };

        await supabase
          .from('negotiations')
          .update({
            messages: [...(negotiation.messages || []), newMessage, agentResponse],
          })
          .eq('id', negotiation.id);

        await supabase
          .from('bids')
          .update({ status: 'under_negotiation' })
          .eq('id', bid.id);
      }, 2000);
    }

    await loadData();
  }

  async function sendNegotiationMessage() {
    if (!negotiationMessage.trim() || !negotiation || !myBid) return;

    const newMessage = {
      sender: 'vendor',
      message: negotiationMessage,
      timestamp: new Date().toISOString(),
    };

    const messages = [...(negotiation.messages || []), newMessage];

    await supabase
      .from('negotiations')
      .update({ messages })
      .eq('id', negotiation.id);

    if (negotiationMessage.toLowerCase().includes('accept') || negotiationMessage.toLowerCase().includes('agree')) {
      const currentPrice = myBid.current_price;
      const newPrice = Math.round(currentPrice * 0.95);

      await supabase
        .from('bids')
        .update({
          current_price: newPrice,
          status: 'accepted',
        })
        .eq('id', myBid.id);

      setTimeout(async () => {
        const agentResponse = {
          sender: 'agent',
          message: `Excellent! We've updated your bid to ₹${newPrice.toLocaleString()}. Your bid has been accepted for the auction phase.`,
          timestamp: new Date().toISOString(),
        };

        await supabase
          .from('negotiations')
          .update({
            messages: [...messages, agentResponse],
            status: 'completed',
            final_terms: { agreed_price: newPrice, delivery_time: myBid.delivery_time },
          })
          .eq('id', negotiation.id);
      }, 1500);
    }

    setNegotiationMessage('');
    await loadData();
  }

  async function submitAuctionBid() {
    if (!selectedVendor || !auction || !auctionBidAmount) return;

    const bidAmount = parseFloat(auctionBidAmount);

    if (bidAmount >= auction.current_lowest_price) {
      alert('Your bid must be lower than the current lowest bid!');
      return;
    }

    await supabase.from('auction_bids').insert({
      auction_id: auction.id,
      vendor_id: selectedVendor.id,
      bid_amount: bidAmount,
    });

    await supabase
      .from('auctions')
      .update({
        current_lowest_price: bidAmount,
        current_leader_id: selectedVendor.id,
      })
      .eq('id', auction.id);

    setAuctionBidAmount('');
    await loadData();
  }

  if (loading || !tender) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
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
              <Button variant="ghost" onClick={() => router.push('/vendor')} className="hover:bg-slate-100">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{tender.title}</h1>
                <p className="text-sm text-slate-600">Tender ID: {tender.id.slice(0, 8)}</p>
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

      <div className="container mx-auto px-6 py-8 max-w-6xl">
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

        {!myBid && tender.status === 'negotiating' && (
          <Card className="border-0 shadow-lg mb-8">
            <CardHeader>
              <CardTitle>Submit Your Bid</CardTitle>
              <CardDescription>Provide your best offer for this tender</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="price">Bid Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="e.g., 75000"
                    value={bidForm.price}
                    onChange={(e) => setBidForm({ ...bidForm, price: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryTime">Delivery Time (days)</Label>
                  <Input
                    id="deliveryTime"
                    type="number"
                    placeholder="e.g., 30"
                    value={bidForm.deliveryTime}
                    onChange={(e) => setBidForm({ ...bidForm, deliveryTime: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="terms">Additional Terms</Label>
                  <Textarea
                    id="terms"
                    placeholder="Any special conditions or notes..."
                    value={bidForm.terms}
                    onChange={(e) => setBidForm({ ...bidForm, terms: e.target.value })}
                    className="mt-2"
                    rows={3}
                  />
                </div>
              </div>
              <Button onClick={submitBid} className="mt-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                <DollarSign className="h-4 w-4 mr-2" />
                Submit Bid
              </Button>
            </CardContent>
          </Card>
        )}

        {myBid && negotiation && (
          <Card className="border-0 shadow-lg mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Negotiation</CardTitle>
                  <CardDescription>Chat with AI agent to finalize terms</CardDescription>
                </div>
                <Badge className={negotiation.status === 'completed' ? 'bg-green-500' : 'bg-orange-500'}>
                  {negotiation.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
                {(negotiation.messages || []).map((msg: any, idx: number) => (
                  <div key={idx} className={`flex ${msg.sender === 'vendor' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-xl px-4 py-3 ${msg.sender === 'vendor' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                      <p className="text-xs font-semibold mb-1">{msg.sender === 'vendor' ? 'You' : 'AI Agent'}</p>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
              {negotiation.status === 'ongoing' && (
                <div className="flex space-x-2">
                  <Input
                    value={negotiationMessage}
                    onChange={(e) => setNegotiationMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendNegotiationMessage()}
                    placeholder="Type your message..."
                  />
                  <Button onClick={sendNegotiationMessage} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {auction && auction.status === 'live' && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gavel className="h-5 w-5 mr-2 text-red-600" />
                Live Reverse Auction
              </CardTitle>
              <CardDescription>Submit your best competitive bid</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-xl border border-red-200 mb-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-600 mb-2">Current Lowest Bid</p>
                  <p className="text-4xl font-bold text-red-600 mb-2">₹{auction.current_lowest_price.toLocaleString()}</p>
                  <Badge className="bg-red-500 animate-pulse">LIVE</Badge>
                </div>
              </div>

              <div className="flex space-x-4 mb-6">
                <Input
                  type="number"
                  placeholder="Enter your bid amount"
                  value={auctionBidAmount}
                  onChange={(e) => setAuctionBidAmount(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={submitAuctionBid} className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700">
                  <Gavel className="h-4 w-4 mr-2" />
                  Place Bid
                </Button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Recent Bids</h4>
                {auctionBids.slice(0, 5).map((bid, idx) => (
                  <div key={bid.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge className={idx === 0 ? 'bg-green-500' : 'bg-slate-400'}>
                        #{idx + 1}
                      </Badge>
                      <span className="text-sm font-medium text-slate-900">{bid.vendor?.name}</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">₹{bid.bid_amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

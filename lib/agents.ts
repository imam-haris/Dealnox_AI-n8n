import { supabase } from './supabase';
import { AgentType, Tender, Vendor, ShortlistedVendor } from './types';

export async function logWorkflow(
  tenderId: string,
  agentName: AgentType,
  action: string,
  inputData: any,
  outputData: any
) {
  await supabase.from('workflow_logs').insert({
    tender_id: tenderId,
    agent_name: agentName,
    action,
    input_data: inputData,
    output_data: outputData,
    timestamp: new Date().toISOString(),
  });
}

export async function updateTenderStatus(
  tenderId: string,
  status: string,
  currentAgent: AgentType
) {
  await supabase
    .from('tenders')
    .update({
      status,
      current_agent: currentAgent,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tenderId);
}

export async function runVendorShortlistingAgent(tenderId: string) {
  const { data: tender } = await supabase
    .from('tenders')
    .select('*')
    .eq('id', tenderId)
    .single();

  if (!tender) return;

  const { data: vendors } = await supabase.from('vendors').select('*');

  if (!vendors) return;

  const shortlisted: Partial<ShortlistedVendor>[] = [];

  for (const vendor of vendors) {
    const matchScore = calculateVendorFitScore(tender, vendor);

    if (matchScore >= 60) {
      shortlisted.push({
        tender_id: tenderId,
        vendor_id: vendor.id,
        fit_score: matchScore,
        reasoning: generateShortlistReasoning(tender, vendor, matchScore),
        status: 'pending',
      });
    }
  }

  shortlisted.sort((a, b) => (b.fit_score || 0) - (a.fit_score || 0));
  const top5 = shortlisted.slice(0, 5);

  if (top5.length > 0) {
    await supabase.from('shortlisted_vendors').insert(top5);
  }

  await logWorkflow(tenderId, 'vendor_shortlisting', 'shortlist_vendors', { tender }, { count: top5.length });
  await updateTenderStatus(tenderId, 'awaiting_approval', 'manager');
}

function calculateVendorFitScore(tender: Tender, vendor: Vendor): number {
  let score = 0;

  const chemicalMatch = vendor.specializations.some((spec) =>
    tender.chemical_name.toLowerCase().includes(spec.toLowerCase().split(' ')[0])
  );

  if (chemicalMatch) score += 40;

  if (vendor.certifications.length >= 2) score += 20;

  score += vendor.rating * 8;

  const locationMatch = vendor.location.toLowerCase().includes(tender.delivery_location.toLowerCase().split(',')[0]);
  if (locationMatch) score += 20;

  return Math.min(Math.round(score), 100);
}

function generateShortlistReasoning(tender: Tender, vendor: Vendor, score: number): string {
  const reasons: string[] = [];

  const chemicalMatch = vendor.specializations.some((spec) =>
    tender.chemical_name.toLowerCase().includes(spec.toLowerCase().split(' ')[0])
  );

  if (chemicalMatch) {
    reasons.push(`Specializes in ${tender.chemical_name} or related chemicals`);
  }

  if (vendor.certifications.length >= 2) {
    reasons.push(`Holds ${vendor.certifications.length} relevant certifications`);
  }

  if (vendor.rating >= 4.5) {
    reasons.push(`High vendor rating of ${vendor.rating}/5.0`);
  }

  const locationMatch = vendor.location.toLowerCase().includes(tender.delivery_location.toLowerCase().split(',')[0]);
  if (locationMatch) {
    reasons.push('Located near delivery location');
  }

  return reasons.join('. ') + '.';
}

export async function initiateNegotiations(tenderId: string) {
  const { data: shortlisted } = await supabase
    .from('shortlisted_vendors')
    .select('*, vendor:vendors(*)')
    .eq('tender_id', tenderId)
    .eq('status', 'approved');

  if (!shortlisted || shortlisted.length === 0) return;

  for (const item of shortlisted) {
    const initialMessage = {
      sender: 'agent',
      message: `Hello ${item.vendor.name}, we invite you to participate in our tender. Please submit your best bid for this opportunity.`,
      timestamp: new Date().toISOString(),
    };

    await supabase.from('negotiations').insert({
      tender_id: tenderId,
      vendor_id: item.vendor_id,
      bid_id: null,
      messages: [initialMessage],
      status: 'ongoing',
    });
  }

  await logWorkflow(tenderId, 'negotiation', 'initiate_negotiations', { vendorCount: shortlisted.length }, {});
  await updateTenderStatus(tenderId, 'negotiating', 'negotiation');
}

export async function startAuction(tenderId: string) {
  const { data: bids } = await supabase
    .from('bids')
    .select('*, vendor:vendors(*)')
    .eq('tender_id', tenderId)
    .eq('status', 'accepted');

  if (!bids || bids.length === 0) return;

  const lowestBid = Math.min(...bids.map((b) => b.current_price));

  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

  await supabase.from('auctions').insert({
    tender_id: tenderId,
    starting_price: lowestBid,
    current_lowest_price: lowestBid,
    current_leader_id: null,
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    status: 'live',
  });

  await logWorkflow(tenderId, 'auction', 'start_auction', { startingPrice: lowestBid }, {});
  await updateTenderStatus(tenderId, 'auction', 'auction');
}

export async function evaluateVendors(tenderId: string) {
  const { data: auction } = await supabase
    .from('auctions')
    .select('*')
    .eq('tender_id', tenderId)
    .single();

  if (!auction) return;

  const { data: auctionBids } = await supabase
    .from('auction_bids')
    .select('*, vendor:vendors(*)')
    .eq('auction_id', auction.id)
    .order('bid_amount', { ascending: true });

  if (!auctionBids || auctionBids.length === 0) return;

  const evaluations = auctionBids.slice(0, 3).map((bid, index) => {
    const priceScore = 100 - (index * 15);
    const qualityScore = (bid.vendor.rating / 5) * 100;
    const deliveryScore = 85 + Math.random() * 10;
    const overallScore = (priceScore * 0.5 + qualityScore * 0.3 + deliveryScore * 0.2);

    return {
      tender_id: tenderId,
      vendor_id: bid.vendor_id,
      overall_score: Math.round(overallScore),
      price_score: Math.round(priceScore),
      quality_score: Math.round(qualityScore),
      delivery_score: Math.round(deliveryScore),
      recommendation: index === 0 ? 'Highly recommended - best overall value' : index === 1 ? 'Good alternative option' : 'Acceptable fallback choice',
    };
  });

  await supabase.from('evaluations').insert(evaluations);
  await logWorkflow(tenderId, 'evaluation', 'evaluate_vendors', { bidCount: auctionBids.length }, { evaluationCount: evaluations.length });
  await updateTenderStatus(tenderId, 'completed', 'manager');
}

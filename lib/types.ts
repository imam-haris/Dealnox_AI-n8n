export type AgentType =
  | 'chatbot'
  | 'vendor_shortlisting'
  | 'manager'
  | 'negotiation'
  | 'auction'
  | 'evaluation'
  | 'vendor_portal';

export type TenderStatus =
  | 'draft'
  | 'collecting_info'
  | 'shortlisting'
  | 'awaiting_approval'
  | 'negotiating'
  | 'auction'
  | 'evaluating'
  | 'completed'
  | 'cancelled';

export type NegotiationStatus = 'ongoing' | 'completed' | 'failed';
export type AuctionStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';
export type BidStatus = 'submitted' | 'under_negotiation' | 'accepted' | 'rejected';

export interface Company {
  id: string;
  name: string;
  industry: string;
  created_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  specializations: string[];
  certifications: string[];
  rating: number;
  location: string;
  created_at: string;
}

export interface Tender {
  id: string;
  company_id: string;
  title: string;
  chemical_name: string;
  quantity: number;
  unit: string;
  delivery_location: string;
  deadline: string;
  budget_range: string;
  specifications: Record<string, any>;
  status: TenderStatus;
  current_agent: AgentType;
  created_at: string;
  updated_at: string;
}

export interface ShortlistedVendor {
  id: string;
  tender_id: string;
  vendor_id: string;
  fit_score: number;
  reasoning: string;
  status: string;
  created_at: string;
  vendor?: Vendor;
}

export interface Bid {
  id: string;
  tender_id: string;
  vendor_id: string;
  initial_price: number;
  current_price: number;
  delivery_time: number;
  terms: Record<string, any>;
  status: BidStatus;
  created_at: string;
  updated_at: string;
  vendor?: Vendor;
}

export interface Negotiation {
  id: string;
  tender_id: string;
  vendor_id: string;
  bid_id: string;
  messages: NegotiationMessage[];
  status: NegotiationStatus;
  final_terms: Record<string, any>;
  created_at: string;
  updated_at: string;
  vendor?: Vendor;
}

export interface NegotiationMessage {
  sender: 'system' | 'vendor' | 'agent';
  message: string;
  timestamp: string;
  data?: Record<string, any>;
}

export interface Auction {
  id: string;
  tender_id: string;
  starting_price: number;
  current_lowest_price: number;
  current_leader_id: string | null;
  start_time: string;
  end_time: string;
  status: AuctionStatus;
  created_at: string;
  current_leader?: Vendor;
}

export interface AuctionBid {
  id: string;
  auction_id: string;
  vendor_id: string;
  bid_amount: number;
  timestamp: string;
  created_at: string;
  vendor?: Vendor;
}

export interface Evaluation {
  id: string;
  tender_id: string;
  vendor_id: string;
  overall_score: number;
  price_score: number;
  quality_score: number;
  delivery_score: number;
  recommendation: string;
  created_at: string;
  vendor?: Vendor;
}

export interface WorkflowLog {
  id: string;
  tender_id: string;
  agent_name: AgentType;
  action: string;
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  timestamp: string;
  created_at: string;
}

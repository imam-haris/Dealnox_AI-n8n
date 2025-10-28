/*
  # Dealnox.AI Multi-Agent Procurement Platform Schema

  ## Overview
  This migration creates the complete database schema for a B2B chemical procurement platform
  that uses AI agents to automate the tender lifecycle from initiation to vendor selection.

  ## New Tables

  1. **companies**
     - `id` (uuid, primary key) - Company identifier
     - `name` (text) - Company name
     - `industry` (text) - Industry type
     - `created_at` (timestamptz) - Record creation timestamp

  2. **vendors**
     - `id` (uuid, primary key) - Vendor identifier
     - `name` (text) - Vendor company name
     - `specializations` (text[]) - Array of chemical specializations
     - `certifications` (text[]) - Array of certifications
     - `rating` (numeric) - Vendor rating (0-5)
     - `location` (text) - Vendor location
     - `created_at` (timestamptz) - Record creation timestamp

  3. **tenders**
     - `id` (uuid, primary key) - Tender identifier
     - `company_id` (uuid, foreign key) - Reference to company
     - `title` (text) - Tender title
     - `chemical_name` (text) - Required chemical
     - `quantity` (numeric) - Required quantity
     - `unit` (text) - Unit of measurement
     - `delivery_location` (text) - Delivery address
     - `deadline` (date) - Submission deadline
     - `budget_range` (text) - Budget constraints
     - `specifications` (jsonb) - Additional specifications
     - `status` (text) - Current status
     - `current_agent` (text) - Active agent in workflow
     - `created_at` (timestamptz) - Record creation timestamp
     - `updated_at` (timestamptz) - Last update timestamp

  4. **shortlisted_vendors**
     - `id` (uuid, primary key) - Record identifier
     - `tender_id` (uuid, foreign key) - Reference to tender
     - `vendor_id` (uuid, foreign key) - Reference to vendor
     - `fit_score` (numeric) - AI-calculated fit score (0-100)
     - `reasoning` (text) - Why vendor was shortlisted
     - `status` (text) - Approval status
     - `created_at` (timestamptz) - Record creation timestamp

  5. **bids**
     - `id` (uuid, primary key) - Bid identifier
     - `tender_id` (uuid, foreign key) - Reference to tender
     - `vendor_id` (uuid, foreign key) - Reference to vendor
     - `initial_price` (numeric) - Initial bid amount
     - `current_price` (numeric) - Current negotiated price
     - `delivery_time` (integer) - Delivery time in days
     - `terms` (jsonb) - Bid terms and conditions
     - `status` (text) - Bid status
     - `created_at` (timestamptz) - Record creation timestamp
     - `updated_at` (timestamptz) - Last update timestamp

  6. **negotiations**
     - `id` (uuid, primary key) - Negotiation identifier
     - `tender_id` (uuid, foreign key) - Reference to tender
     - `vendor_id` (uuid, foreign key) - Reference to vendor
     - `bid_id` (uuid, foreign key) - Reference to bid
     - `messages` (jsonb) - Negotiation message history
     - `status` (text) - Negotiation status
     - `final_terms` (jsonb) - Agreed terms
     - `created_at` (timestamptz) - Record creation timestamp
     - `updated_at` (timestamptz) - Last update timestamp

  7. **auctions**
     - `id` (uuid, primary key) - Auction identifier
     - `tender_id` (uuid, foreign key) - Reference to tender
     - `starting_price` (numeric) - Starting bid price
     - `current_lowest_price` (numeric) - Current lowest bid
     - `current_leader_id` (uuid, foreign key) - Leading vendor
     - `start_time` (timestamptz) - Auction start time
     - `end_time` (timestamptz) - Auction end time
     - `status` (text) - Auction status
     - `created_at` (timestamptz) - Record creation timestamp

  8. **auction_bids**
     - `id` (uuid, primary key) - Auction bid identifier
     - `auction_id` (uuid, foreign key) - Reference to auction
     - `vendor_id` (uuid, foreign key) - Reference to vendor
     - `bid_amount` (numeric) - Bid amount
     - `timestamp` (timestamptz) - When bid was placed
     - `created_at` (timestamptz) - Record creation timestamp

  9. **evaluations**
     - `id` (uuid, primary key) - Evaluation identifier
     - `tender_id` (uuid, foreign key) - Reference to tender
     - `vendor_id` (uuid, foreign key) - Reference to vendor
     - `overall_score` (numeric) - Final evaluation score
     - `price_score` (numeric) - Price competitiveness score
     - `quality_score` (numeric) - Quality assessment score
     - `delivery_score` (numeric) - Delivery capability score
     - `recommendation` (text) - AI recommendation
     - `created_at` (timestamptz) - Record creation timestamp

  10. **workflow_logs**
      - `id` (uuid, primary key) - Log identifier
      - `tender_id` (uuid, foreign key) - Reference to tender
      - `agent_name` (text) - Agent that performed action
      - `action` (text) - Action performed
      - `input_data` (jsonb) - Input data for agent
      - `output_data` (jsonb) - Output data from agent
      - `timestamp` (timestamptz) - When action occurred
      - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - RLS enabled on all tables
  - Public access policies for demo purposes (to be refined based on auth requirements)

  ## Notes
  - All tables use UUIDs for primary keys
  - Timestamps use timezone-aware types
  - JSONB used for flexible data structures
  - Text arrays used for multi-value fields
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  industry text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to companies"
  ON companies FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specializations text[] DEFAULT '{}',
  certifications text[] DEFAULT '{}',
  rating numeric DEFAULT 0,
  location text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to vendors"
  ON vendors FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create tenders table
CREATE TABLE IF NOT EXISTS tenders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  chemical_name text NOT NULL,
  quantity numeric NOT NULL,
  unit text NOT NULL,
  delivery_location text NOT NULL,
  deadline date NOT NULL,
  budget_range text DEFAULT '',
  specifications jsonb DEFAULT '{}',
  status text DEFAULT 'draft',
  current_agent text DEFAULT 'chatbot',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to tenders"
  ON tenders FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create shortlisted_vendors table
CREATE TABLE IF NOT EXISTS shortlisted_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id uuid REFERENCES tenders(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE,
  fit_score numeric DEFAULT 0,
  reasoning text DEFAULT '',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shortlisted_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to shortlisted_vendors"
  ON shortlisted_vendors FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create bids table
CREATE TABLE IF NOT EXISTS bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id uuid REFERENCES tenders(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE,
  initial_price numeric NOT NULL,
  current_price numeric NOT NULL,
  delivery_time integer DEFAULT 0,
  terms jsonb DEFAULT '{}',
  status text DEFAULT 'submitted',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to bids"
  ON bids FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create negotiations table
CREATE TABLE IF NOT EXISTS negotiations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id uuid REFERENCES tenders(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE,
  bid_id uuid REFERENCES bids(id) ON DELETE CASCADE,
  messages jsonb DEFAULT '[]',
  status text DEFAULT 'ongoing',
  final_terms jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to negotiations"
  ON negotiations FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create auctions table
CREATE TABLE IF NOT EXISTS auctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id uuid REFERENCES tenders(id) ON DELETE CASCADE,
  starting_price numeric NOT NULL,
  current_lowest_price numeric NOT NULL,
  current_leader_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to auctions"
  ON auctions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create auction_bids table
CREATE TABLE IF NOT EXISTS auction_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid REFERENCES auctions(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE,
  bid_amount numeric NOT NULL,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to auction_bids"
  ON auction_bids FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id uuid REFERENCES tenders(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE,
  overall_score numeric DEFAULT 0,
  price_score numeric DEFAULT 0,
  quality_score numeric DEFAULT 0,
  delivery_score numeric DEFAULT 0,
  recommendation text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to evaluations"
  ON evaluations FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create workflow_logs table
CREATE TABLE IF NOT EXISTS workflow_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id uuid REFERENCES tenders(id) ON DELETE CASCADE,
  agent_name text NOT NULL,
  action text NOT NULL,
  input_data jsonb DEFAULT '{}',
  output_data jsonb DEFAULT '{}',
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workflow_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to workflow_logs"
  ON workflow_logs FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenders_company_id ON tenders(company_id);
CREATE INDEX IF NOT EXISTS idx_tenders_status ON tenders(status);
CREATE INDEX IF NOT EXISTS idx_shortlisted_vendors_tender_id ON shortlisted_vendors(tender_id);
CREATE INDEX IF NOT EXISTS idx_bids_tender_id ON bids(tender_id);
CREATE INDEX IF NOT EXISTS idx_bids_vendor_id ON bids(vendor_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_tender_id ON negotiations(tender_id);
CREATE INDEX IF NOT EXISTS idx_auctions_tender_id ON auctions(tender_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_id ON auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_tender_id ON workflow_logs(tender_id);

-- Insert sample companies
INSERT INTO companies (name, industry) VALUES
  ('ChemCorp Industries', 'Chemical Manufacturing'),
  ('PharmaTech Solutions', 'Pharmaceuticals'),
  ('GreenChem Ltd', 'Sustainable Chemistry')
ON CONFLICT DO NOTHING;

-- Insert sample vendors
INSERT INTO vendors (name, specializations, certifications, rating, location) VALUES
  ('Global Chemicals Inc', ARRAY['Industrial Solvents', 'Bulk Chemicals'], ARRAY['ISO 9001', 'ISO 14001'], 4.5, 'Mumbai, India'),
  ('PureChem Suppliers', ARRAY['Laboratory Reagents', 'Fine Chemicals'], ARRAY['ISO 9001', 'GMP'], 4.8, 'Delhi, India'),
  ('ChemSource Ltd', ARRAY['Petrochemicals', 'Polymers'], ARRAY['ISO 9001'], 4.2, 'Bangalore, India'),
  ('EcoChem Solutions', ARRAY['Green Chemistry', 'Bio-based Chemicals'], ARRAY['ISO 14001', 'LEED'], 4.6, 'Pune, India'),
  ('IndustrialChem Pro', ARRAY['Industrial Chemicals', 'Specialty Chemicals'], ARRAY['ISO 9001', 'OSHA'], 4.3, 'Chennai, India')
ON CONFLICT DO NOTHING;
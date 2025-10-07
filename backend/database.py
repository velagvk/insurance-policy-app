"""
Database setup and models for the insurance policy application.
"""
import sqlite3
import json
import os
from typing import List, Dict, Any, Optional
from pathlib import Path

class PolicyDatabase:
    def __init__(self, db_path: str = "policies.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the database with required tables."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create policies table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS policies (
                id TEXT PRIMARY KEY,
                provider_name TEXT NOT NULL,
                plan_name TEXT NOT NULL,
                policy_category TEXT NOT NULL,
                product_uin TEXT,
                provider_id TEXT,
                claim_settlement_ratio REAL,
                solvency_ratio REAL,
                network_hospitals_count INTEGER,
                sum_insured_options TEXT, -- JSON array
                payment_modes TEXT, -- JSON array
                base_premium REAL,
                is_tax_benefit_eligible BOOLEAN,
                room_rent_limit_type TEXT,
                room_rent_description TEXT,
                icu_limit_type TEXT,
                icu_description TEXT,
                pre_hospitalization_days INTEGER,
                post_hospitalization_days INTEGER,
                daycare_covered BOOLEAN,
                ambulance_covered BOOLEAN,
                ambulance_limit INTEGER,
                no_claim_bonus_available BOOLEAN,
                restoration_benefit_available BOOLEAN,
                maternity_covered BOOLEAN,
                maternity_waiting_period INTEGER,
                waiting_period_initial INTEGER,
                waiting_period_specific_ailments INTEGER,
                waiting_period_pre_existing INTEGER,
                co_payment_applicable BOOLEAN,
                co_payment_details TEXT,
                raw_json TEXT, -- Store complete JSON for complex queries
                source_file TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Create indexes for performance optimization
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_provider_name ON policies(provider_name)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_policy_category ON policies(policy_category)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_maternity_covered ON policies(maternity_covered)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_daycare_covered ON policies(daycare_covered)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_claim_ratio ON policies(claim_settlement_ratio)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_network_hospitals ON policies(network_hospitals_count)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_created_at ON policies(created_at)")

        # Table for structured section summaries per policy
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS policy_section_summaries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                policy_id TEXT NOT NULL,
                section_name TEXT NOT NULL,
                summary TEXT NOT NULL,
                metadata TEXT,
                UNIQUE(policy_id, section_name)
            )
        """)

        # Table for semantic search chunks with embeddings
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS policy_chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                policy_id TEXT NOT NULL,
                section_name TEXT,
                chunk_text TEXT NOT NULL,
                chunk_index INTEGER,
                embedding BLOB,
                metadata TEXT,
                UNIQUE(policy_id, chunk_index)
            )
        """)

        # Create indexes for chunks table
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_chunks_policy_id ON policy_chunks(policy_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_chunks_section ON policy_chunks(section_name)")

        # Create index for summaries table
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_summaries_policy_id ON policy_section_summaries(policy_id)")

        conn.commit()
        conn.close()
    
    def load_policy_from_json(self, json_file_path: str) -> bool:
        """Load a single policy from JSON file into the database."""
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                policy_data = json.load(f)
            
            # Extract key fields for easy querying
            provider_info = policy_data.get('provider_information', {})
            policy_id_info = policy_data.get('policy_identification', {})
            core_financials = policy_data.get('core_financials_and_terms', {})
            coverage = policy_data.get('coverage_and_benefits', {})
            conditions = policy_data.get('conditions_and_cost_sharing', {})
            
            # Prepare data for insertion
            policy_record = {
                'id': policy_id_info.get('policy_id', f"policy_{Path(json_file_path).stem}"),
                'provider_name': provider_info.get('provider_name', ''),
                'plan_name': policy_id_info.get('plan_name', ''),
                'policy_category': policy_id_info.get('policy_category', ''),
                'product_uin': policy_id_info.get('product_uin', ''),
                'provider_id': provider_info.get('provider_id', ''),
                'claim_settlement_ratio': provider_info.get('claim_settlement_ratio', 0.0),
                'solvency_ratio': provider_info.get('solvency_ratio', 0.0),
                'network_hospitals_count': provider_info.get('network_hospitals_count', 0),
                'sum_insured_options': json.dumps(core_financials.get('sum_insured_options', [])),
                'payment_modes': json.dumps(core_financials.get('premium_details', {}).get('payment_modes', [])),
                'base_premium': core_financials.get('premium_details', {}).get('base_premium_for_standard_profile', 0.0),
                'is_tax_benefit_eligible': core_financials.get('is_tax_benefit_eligible_80d', False),
                'room_rent_limit_type': coverage.get('room_rent_limits', {}).get('limit_type', ''),
                'room_rent_description': coverage.get('room_rent_limits', {}).get('description', ''),
                'icu_limit_type': coverage.get('icu_charge_limits', {}).get('limit_type', ''),
                'icu_description': coverage.get('icu_charge_limits', {}).get('description', ''),
                'pre_hospitalization_days': coverage.get('in_patient_hospitalization', {}).get('pre_hospitalization_days_covered', 0),
                'post_hospitalization_days': coverage.get('in_patient_hospitalization', {}).get('post_hospitalization_days_covered', 0),
                'daycare_covered': coverage.get('daycare_procedures', {}).get('is_covered', False),
                'ambulance_covered': coverage.get('ambulance_cover', {}).get('is_covered', False),
                'ambulance_limit': coverage.get('ambulance_cover', {}).get('limit_per_hospitalization', 0),
                'no_claim_bonus_available': coverage.get('no_claim_bonus', {}).get('is_available', False),
                'restoration_benefit_available': coverage.get('restoration_benefit', {}).get('is_available', False),
                'maternity_covered': coverage.get('maternity_cover', {}).get('is_available', False),
                'maternity_waiting_period': coverage.get('maternity_cover', {}).get('waiting_period_months', 0),
                'waiting_period_initial': conditions.get('waiting_periods', {}).get('initial_period_days', 0),
                'waiting_period_specific_ailments': conditions.get('waiting_periods', {}).get('specific_ailments_period_years', 0),
                'waiting_period_pre_existing': conditions.get('waiting_periods', {}).get('pre_existing_diseases_period_years', 0),
                'co_payment_applicable': conditions.get('co_payment', {}).get('is_applicable', False),
                'co_payment_details': conditions.get('co_payment', {}).get('details', ''),
                'raw_json': json.dumps(policy_data),
                'source_file': json_file_path
            }
            
            # Insert into database
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Use INSERT OR REPLACE to handle duplicates
            cursor.execute("""
                INSERT OR REPLACE INTO policies (
                    id, provider_name, plan_name, policy_category, product_uin, provider_id,
                    claim_settlement_ratio, solvency_ratio, network_hospitals_count,
                    sum_insured_options, payment_modes, base_premium, is_tax_benefit_eligible,
                    room_rent_limit_type, room_rent_description, icu_limit_type, icu_description,
                    pre_hospitalization_days, post_hospitalization_days, daycare_covered,
                    ambulance_covered, ambulance_limit, no_claim_bonus_available,
                    restoration_benefit_available, maternity_covered, maternity_waiting_period,
                    waiting_period_initial, waiting_period_specific_ailments, waiting_period_pre_existing,
                    co_payment_applicable, co_payment_details, raw_json, source_file
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                )
            """, tuple(policy_record.values()))
            
            conn.commit()
            conn.close()
            
            print(f"✅ Successfully loaded policy: {policy_record['plan_name']}")
            return True
            
        except Exception as e:
            print(f"❌ Error loading {json_file_path}: {str(e)}")
            return False
    
    def load_all_policies_from_directory(self, directory_path: str) -> int:
        """Load all extracted JSON files from a directory."""
        loaded_count = 0
        directory = Path(directory_path)
        
        # Look for *_extracted.json files
        for json_file in directory.glob("*_extracted.json"):
            if self.load_policy_from_json(str(json_file)):
                loaded_count += 1
        
        return loaded_count

    # --- New methods for summaries and chunks ---

    def upsert_section_summaries(self, policy_id: str, summaries: Dict[str, Dict[str, Any]]) -> None:
        """Store structured summaries for policy sections."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        for section, data in summaries.items():
            summary_text = data.get("summary", "")
            metadata = json.dumps({k: v for k, v in data.items() if k != "summary"})
            cursor.execute(
                """
                INSERT INTO policy_section_summaries (policy_id, section_name, summary, metadata)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(policy_id, section_name) DO UPDATE SET
                    summary=excluded.summary,
                    metadata=excluded.metadata
                """,
                (policy_id, section, summary_text, metadata)
            )

        conn.commit()
        conn.close()

    def upsert_policy_chunks(self, policy_id: str, chunks: List[Dict[str, Any]]) -> None:
        """Store semantic chunks with embeddings for a policy."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        for chunk in chunks:
            section = chunk.get("section_name")
            text = chunk.get("chunk_text", "")
            index = chunk.get("chunk_index")
            embedding = chunk.get("embedding")
            metadata = json.dumps(chunk.get("metadata", {}))

            cursor.execute(
                """
                INSERT INTO policy_chunks (policy_id, section_name, chunk_text, chunk_index, embedding, metadata)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(policy_id, chunk_index) DO UPDATE SET
                    section_name=excluded.section_name,
                    chunk_text=excluded.chunk_text,
                    embedding=excluded.embedding,
                    metadata=excluded.metadata
                """,
                (policy_id, section, text, index, embedding, metadata)
            )

        conn.commit()
        conn.close()

    def get_section_summaries(self, policy_id: str) -> Dict[str, Dict[str, Any]]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute(
            "SELECT section_name, summary, metadata FROM policy_section_summaries WHERE policy_id = ?",
            (policy_id,)
        )
        rows = cursor.fetchall()
        conn.close()

        summaries = {}
        for row in rows:
            metadata = json.loads(row["metadata"]) if row["metadata"] else {}
            summaries[row["section_name"]] = {"summary": row["summary"], **metadata}
        return summaries

    def get_chunks_for_policy(self, policy_id: str) -> List[Dict[str, Any]]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute(
            "SELECT section_name, chunk_text, chunk_index, embedding, metadata FROM policy_chunks WHERE policy_id = ? ORDER BY chunk_index",
            (policy_id,)
        )
        rows = cursor.fetchall()
        conn.close()

        result = []
        for row in rows:
            embedding = row["embedding"]
            metadata = json.loads(row["metadata"]) if row["metadata"] else {}
            result.append({
                "section_name": row["section_name"],
                "chunk_text": row["chunk_text"],
                "chunk_index": row["chunk_index"],
                "embedding": embedding,
                "metadata": metadata
            })
        return result
    
    def get_all_policies(self) -> List[Dict[str, Any]]:
        """Get all policies from the database."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # This allows us to access columns by name
        cursor = conn.cursor()

        cursor.execute("""
            SELECT p.*,
                   pf.claim_settlement_ratio, pf.hospital_network, pf.room_rent, pf.copayment,
                   pf.restoration_benefit, pf.pre_post_hospitalization_coverage,
                   pf.waiting_period, pf.no_claim_bonus, pf.disease_sub_limits,
                   pf.alternate_treatment_coverage, pf.maternity_care, pf.newborn_care,
                   pf.health_checkups, pf.domiciliary, pf.outpatient_department,
                   pf.lifelong_renewal, pf.critical_illness_rider, pf.accident_disability_rider,
                   pf.extraction_source, pf.confidence_score
            FROM policies p
            LEFT JOIN policy_features pf ON p.id = pf.policy_id
        """)
        rows = cursor.fetchall()
        conn.close()

        policies = []
        for row in rows:
            policy = dict(row)
            # Parse JSON fields
            policy['sum_insured_options'] = json.loads(policy['sum_insured_options'])
            policy['payment_modes'] = json.loads(policy['payment_modes'])
            policies.append(policy)

        return policies
    
    def get_policy_by_id(self, policy_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific policy by ID."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT p.*,
                   pf.claim_settlement_ratio, pf.hospital_network, pf.room_rent, pf.copayment,
                   pf.restoration_benefit, pf.pre_post_hospitalization_coverage,
                   pf.waiting_period, pf.no_claim_bonus, pf.disease_sub_limits,
                   pf.alternate_treatment_coverage, pf.maternity_care, pf.newborn_care,
                   pf.health_checkups, pf.domiciliary, pf.outpatient_department,
                   pf.lifelong_renewal, pf.critical_illness_rider, pf.accident_disability_rider,
                   pf.extraction_source, pf.confidence_score
            FROM policies p
            LEFT JOIN policy_features pf ON p.id = pf.policy_id
            WHERE p.id = ?
        """, (policy_id,))
        row = cursor.fetchone()
        conn.close()

        if row:
            policy = dict(row)
            policy['sum_insured_options'] = json.loads(policy['sum_insured_options'])
            policy['payment_modes'] = json.loads(policy['payment_modes'])
            policy['raw_json'] = json.loads(policy['raw_json'])
            return policy

        return None
    
    def search_policies(self, 
                       provider_name: Optional[str] = None,
                       policy_category: Optional[str] = None,
                       min_sum_insured: Optional[int] = None,
                       max_premium: Optional[float] = None,
                       maternity_required: Optional[bool] = None,
                       daycare_required: Optional[bool] = None) -> List[Dict[str, Any]]:
        """Search policies with various filters."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        query = "SELECT * FROM policies WHERE 1=1"
        params = []
        
        if provider_name:
            query += " AND provider_name LIKE ?"
            params.append(f"%{provider_name}%")
        
        if policy_category:
            query += " AND policy_category = ?"
            params.append(policy_category)
        
        if maternity_required is not None:
            query += " AND maternity_covered = ?"
            params.append(maternity_required)
        
        if daycare_required is not None:
            query += " AND daycare_covered = ?"
            params.append(daycare_required)
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        policies = []
        for row in rows:
            policy = dict(row)
            policy['sum_insured_options'] = json.loads(policy['sum_insured_options'])
            policy['payment_modes'] = json.loads(policy['payment_modes'])
            
            # Apply additional filters that require JSON parsing
            if min_sum_insured and policy['sum_insured_options']:
                if max(policy['sum_insured_options']) < min_sum_insured:
                    continue
            
            policies.append(policy)
        
        return policies
    
    def get_policy_statistics(self) -> Dict[str, Any]:
        """Get statistics about the policies in the database."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        stats = {}
        
        # Total policies
        cursor.execute("SELECT COUNT(*) FROM policies")
        stats['total_policies'] = cursor.fetchone()[0]
        
        # Policies by category
        cursor.execute("SELECT policy_category, COUNT(*) FROM policies GROUP BY policy_category")
        stats['by_category'] = dict(cursor.fetchall())
        
        # Providers
        cursor.execute("SELECT COUNT(DISTINCT provider_name) FROM policies")
        stats['total_providers'] = cursor.fetchone()[0]
        
        # Average claim settlement ratio
        cursor.execute("SELECT AVG(claim_settlement_ratio) FROM policies WHERE claim_settlement_ratio > 0")
        result = cursor.fetchone()[0]
        stats['avg_claim_settlement_ratio'] = result if result else 0
        
        conn.close()
        return stats

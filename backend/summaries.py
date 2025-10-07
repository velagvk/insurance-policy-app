import json
from pathlib import Path
from typing import Dict, Any, List

from sentence_transformers import SentenceTransformer
import numpy as np

from .database import PolicyDatabase


SECTION_KEYS = {
    "policy_overview": ["policy_identification", "provider_information"],
    "coverage_and_benefits": ["coverage_and_benefits"],
    "financials": ["core_financials_and_terms"],
    "waiting_periods": ["conditions_and_cost_sharing", "coverage_and_benefits"],
    "exclusions": ["exclusions"],
    "claim_process": ["claims_process"]
}


class PolicySummariesGenerator:
    def __init__(self, db: PolicyDatabase, model_name: str = "all-MiniLM-L6-v2"):
        self.db = db
        self.embedding_model = SentenceTransformer(model_name)

    def _collect_section_text(self, policy_json: Dict[str, Any], keys: List[str]) -> str:
        parts = []
        for key in keys:
            section = policy_json.get(key, {})
            if isinstance(section, dict):
                parts.append(json.dumps(section, indent=2))
            elif isinstance(section, list):
                parts.append(json.dumps(section, indent=2))
            elif section:
                parts.append(str(section))
        return "\n".join(parts)

    def _split_into_chunks(self, text: str, chunk_size: int = 600, overlap: int = 100) -> List[str]:
        if not text:
            return []
        if not text:
            return []
        words = text.split()
        chunks = []
        start = 0
        while start < len(words):
            end = min(len(words), start + chunk_size)
            chunk = " ".join(words[start:end])
            if chunk:
                chunks.append(chunk)
            if end == len(words):
                break
            start = end - overlap
            if start < 0:
                start = 0
        return chunks

    def generate_for_policy(self, policy_id: str, policy_json: Dict[str, Any]) -> None:
        summaries = {}
        chunks_data = []

        for section_name, keys in SECTION_KEYS.items():
            text = self._collect_section_text(policy_json, keys)
            if not text:
                continue

            # Create a concise summary string (anchor for future LLM summarizer if needed)
            # For now use first 120 words as proxy summary
            words = text.split()
            summary = " ".join(words[:120]) + ("..." if len(words) > 120 else "")
            summaries[section_name] = {
                "summary": summary,
                "source_keys": keys
            }

            chunks = self._split_into_chunks(text)
            for idx, chunk in enumerate(chunks):
                chunks_data.append({
                    "section_name": section_name,
                    "chunk_text": chunk,
                    "chunk_index": len(chunks_data),
                    "metadata": {"source_keys": keys}
                })

        # Generate embeddings in batch
        if chunks_data:
            embeddings = self.embedding_model.encode([c["chunk_text"] for c in chunks_data])
            for i, emb in enumerate(embeddings):
                chunks_data[i]["embedding"] = np.asarray(emb, dtype=np.float32).tobytes()

        self.db.upsert_section_summaries(policy_id, summaries)
        self.db.upsert_policy_chunks(policy_id, chunks_data)

    def generate_for_all(self, data_dir: Path) -> None:
        for json_file in data_dir.glob("*_extracted.json"):
            with open(json_file, "r", encoding="utf-8") as f:
                policy_json = json.load(f)
            policy_id = policy_json.get("policy_identification", {}).get("policy_id")
            if not policy_id:
                policy_id = f"policy_{json_file.stem}"
            self.generate_for_policy(policy_id, policy_json)

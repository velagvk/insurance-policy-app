"""
Gemini service for policy document analysis
"""
import os
import json
import re
from pathlib import Path
from typing import List, Dict, Any, Optional

import numpy as np
from sentence_transformers import SentenceTransformer, CrossEncoder
import google.genai as genai
from google.genai import types
from dotenv import load_dotenv

from .database import PolicyDatabase
from .cache import cache
from .prompts import (
    POLICY_QA_PROMPT,
    POLICY_SUMMARY_PROMPT,
    ERROR_POLICY_NOT_FOUND,
    ERROR_GEMINI_FAILURE,
    DEFAULT_FOLLOW_UPS
)

# Load environment variables
load_dotenv()


class ModelRouter:
    """Routes queries to appropriate Gemini model based on complexity"""

    # Simple factual queries that can use the cheaper Flash model
    SIMPLE_PATTERNS = [
        "what is the premium",
        "premium amount",
        "coverage amount",
        "sum insured",
        "waiting period",
        "claim process",
        "claim settlement ratio",
        "csr",
        "hospital network",
        "how many hospitals",
        "room rent",
        "copayment",
        "co-payment",
        "restoration",
        "pre hospitalization",
        "post hospitalization",
        "maternity",
        "daycare"
    ]

    def select_model(self, question: str, relevance_scores: List[float] = None) -> str:
        """
        Select appropriate model based on question complexity.

        Args:
            question: User's question
            relevance_scores: Optional list of relevance scores from retrieval

        Returns:
            Model name to use
        """
        question_lower = question.lower()

        # Check if it's a simple lookup question
        is_simple = any(pattern in question_lower for pattern in self.SIMPLE_PATTERNS)

        # Calculate average relevance if provided
        high_relevance = False
        if relevance_scores and len(relevance_scores) > 0:
            avg_score = sum(relevance_scores) / len(relevance_scores)
            high_relevance = avg_score > 0.7  # High confidence retrieval

        # Use Flash for simple queries or high-confidence retrievals
        if is_simple or high_relevance:
            return "gemini-flash-2.0"  # 95% cheaper than Pro

        # Use Pro for complex reasoning and comparisons
        return "gemini-2.5-pro"


class GeminiPolicyService:
    def __init__(self):
        self.api_key = os.getenv('GOOGLE_API_KEY')
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY must be set in the environment")

        # Initialize the new Google GenAI client
        self.client = genai.Client(api_key=self.api_key)

        # Initialize database
        self.db = PolicyDatabase()

        # Lazy load models (only when first needed to save memory at startup)
        self._embedding_model = None
        self._reranker = None

        # Initialize model router for cost optimization
        self.model_router = ModelRouter()

        # Path to extracted policy data (fallback)
        self.policy_data_dir = Path("results/health_file_api")

    @property
    def embedding_model(self):
        """Lazy load embedding model only when needed"""
        if self._embedding_model is None:
            self._embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
        return self._embedding_model

    @property
    def reranker(self):
        """Lazy load reranker model only when needed"""
        if self._reranker is None:
            self._reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
        return self._reranker
    
    def get_policy_document(self, policy_id: str) -> Optional[Dict[str, Any]]:
        """
        Load policy document data, preferring the database copy.
        """
        policy_record = self.db.get_policy_by_id(policy_id)
        if policy_record and policy_record.get("raw_json"):
            return policy_record.get("raw_json")
        
        # Fallback to filesystem if needed
        for json_file in self.policy_data_dir.glob("*_extracted.json"):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    policy_data = json.load(f)
                if (policy_data.get("policy_identification", {}).get("policy_id") == policy_id or
                    policy_data.get("policy_identification", {}).get("plan_name", "").lower() in policy_id.lower()):
                    return policy_data
            except (json.JSONDecodeError, KeyError):
                continue
        return None
    
    def format_chat_history(self, chat_history: List[Dict[str, Any]]) -> str:
        """
        Format chat history for context
        """
        if not chat_history:
            return ""
        
        formatted_history = "\n\nPrevious conversation:\n"
        for message in chat_history[-5:]:  # Last 5 messages for context
            sender = "User" if message.get("sender") == "user" else "Assistant"
            formatted_history += f"{sender}: {message.get('text', '')}\n"
        
        return formatted_history
    
    def retrieve_policy_context(self, policy_id: str, question: str, top_k: int = 4) -> Dict[str, Any]:
        """
        Fetch section summaries and the most relevant semantic chunks for the question.
        Uses two-stage retrieval: (1) initial embedding search, (2) cross-encoder reranking
        """
        summaries = self.db.get_section_summaries(policy_id)
        chunks = self.db.get_chunks_for_policy(policy_id)
        relevant_chunks: List[Dict[str, Any]] = []

        if chunks:
            # STAGE 1: Initial retrieval with embeddings (get top 10)
            question_embedding = self.embedding_model.encode([question])[0]
            question_embedding = question_embedding / (np.linalg.norm(question_embedding) + 1e-10)

            scored_chunks = []
            for chunk in chunks:
                embedding_blob = chunk.get("embedding")
                if not embedding_blob:
                    continue
                chunk_embedding = np.frombuffer(embedding_blob, dtype=np.float32)
                norm = np.linalg.norm(chunk_embedding)
                if norm == 0:
                    continue
                chunk_embedding = chunk_embedding / norm
                score = float(np.dot(question_embedding, chunk_embedding))
                scored_chunks.append((score, chunk))

            scored_chunks.sort(key=lambda x: x[0], reverse=True)

            # Get top 10 candidates for reranking (or fewer if not enough chunks)
            initial_top_k = min(10, len(scored_chunks))
            candidate_chunks = [chunk for _, chunk in scored_chunks[:initial_top_k]]

            # STAGE 2: Rerank with cross-encoder for better relevance
            if len(candidate_chunks) > top_k:
                # Create pairs of (question, chunk_text) for reranking
                pairs = [(question, chunk["chunk_text"]) for chunk in candidate_chunks]

                # Get reranking scores from cross-encoder
                rerank_scores = self.reranker.predict(pairs)

                # Sort by reranking scores and take top_k
                reranked = sorted(zip(rerank_scores, candidate_chunks), key=lambda x: x[0], reverse=True)
                final_chunks = [(score, chunk) for score, chunk in reranked[:top_k]]
            else:
                # If we have fewer candidates than top_k, use them all with original scores
                final_chunks = [(scored_chunks[i][0], candidate_chunks[i]) for i in range(len(candidate_chunks))]

            # Format final results
            for score, chunk in final_chunks:
                snippet = chunk["chunk_text"]
                if len(snippet) > 900:
                    snippet = snippet[:900] + "..."
                relevant_chunks.append({
                    "section_name": chunk.get("section_name"),
                    "chunk_text": snippet,
                    "score": float(score)
                })

        return {
            "summaries": summaries,
            "relevant_chunks": relevant_chunks
        }

    def build_context_block(self, policy_data: Dict[str, Any], context: Dict[str, Any]) -> str:
        sections = []
        summaries = context.get("summaries") or {}
        relevant_chunks = context.get("relevant_chunks") or []

        if summaries:
            summary_lines = []
            for section, data in summaries.items():
                title = section.replace("_", " ").title()
                summary_text = data.get("summary", "")
                summary_lines.append(f"- {title}: {summary_text}")
            sections.append("POLICY SECTION SUMMARIES:\n" + "\n".join(summary_lines))

        if relevant_chunks:
            chunk_lines = []
            for idx, chunk in enumerate(relevant_chunks, 1):
                section = (chunk.get("section_name") or "Unknown Section").replace("_", " ").title()
                chunk_lines.append(f"{idx}. [{section}] {chunk['chunk_text']}")
            sections.append("RELEVANT POLICY EXCERPTS:\n" + "\n\n".join(chunk_lines))

        # ALWAYS include full policy data for maximum accuracy (instead of just fallback)
        # This ensures Gemini has complete information even if RAG chunks miss something
        sections.append("COMPLETE POLICY DETAILS:\n" + json.dumps(policy_data, indent=2))

        return "\n\n".join(sections)
    
    def create_policy_prompt(
        self,
        policy_data: Dict[str, Any],
        question: str,
        chat_history: List[Dict[str, Any]],
        context_block: str
    ) -> str:
        """
        Create a comprehensive prompt for policy analysis using retrieved context
        """
        policy_name = policy_data.get("policy_identification", {}).get("plan_name", "Unknown Policy")
        provider_name = policy_data.get("provider_information", {}).get("provider_name", "Unknown Provider")

        history_context = self.format_chat_history(chat_history)

        # Use template from prompts.py
        return POLICY_QA_PROMPT.format(
            policy_name=policy_name,
            provider_name=provider_name,
            context_block=context_block,
            question=question,
            history_context=history_context
        )
    
    async def ask_policy_question(
        self,
        policy_id: str,
        question: str,
        chat_history: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Ask a question about a specific policy using Gemini (with caching and smart model routing)
        """
        try:
            # Generate cache key for question + policy + recent context
            # Only include last 2 messages to avoid cache misses from full history
            recent_history = ""
            if chat_history and len(chat_history) > 0:
                recent_history = str(chat_history[-2:])

            cache_key = cache._make_key((
                "gemini_qa",
                policy_id,
                question.lower().strip(),
                recent_history
            ))

            # Check cache first
            cached_response = cache.get(cache_key)
            if cached_response:
                return cached_response

            # Load policy document
            policy_data = self.get_policy_document(policy_id)
            if not policy_data:
                return {
                    "success": False,
                    "error": f"Policy document not found for ID: {policy_id}",
                    "response": ERROR_POLICY_NOT_FOUND
                }

            retrieval_context = self.retrieve_policy_context(policy_id, question)
            context_block = self.build_context_block(policy_data, retrieval_context)

            # Extract relevance scores for model routing
            relevance_scores = [chunk.get('score', 0) for chunk in retrieval_context.get('relevant_chunks', [])]

            # Select appropriate model based on question complexity
            selected_model = self.model_router.select_model(question, relevance_scores)

            # Create prompt with retrieved policy context
            prompt = self.create_policy_prompt(policy_data, question, chat_history or [], context_block)

            # Call Gemini API with selected model
            response = self.client.models.generate_content(
                model=selected_model,
                contents=prompt
            )
            response_text = response.text or ""

            # Extract follow-up questions from the model response
            follow_up_questions: List[str] = []
            follow_up_pattern = r"FOLLOW_UP_QUESTIONS:(.*)"
            match = re.search(follow_up_pattern, response_text)
            if match:
                questions_part = match.group(1).strip()
                # Remove the follow-up line from the main response
                response_text = re.sub(follow_up_pattern, "", response_text).strip()
                follow_up_questions = [
                    q.strip().lstrip("-•").strip()
                    for q in questions_part.split("|")
                    if q.strip()
                ][:2]

            if not follow_up_questions:
                follow_up_questions = DEFAULT_FOLLOW_UPS

            result = {
                "success": True,
                "response_text": response_text,
                "follow_up_questions": follow_up_questions,
                "policy_name": policy_data.get("policy_identification", {}).get("plan_name"),
                "provider_name": policy_data.get("provider_information", {}).get("provider_name"),
                "model_used": selected_model  # Add for transparency
            }

            # Cache successful responses for 1 hour
            cache.set(cache_key, result, ttl=3600)

            return result

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "response": ERROR_GEMINI_FAILURE
            }
    
    async def get_policy_summary(self, policy_id: str) -> Dict[str, Any]:
        """
        Get a comprehensive summary of a policy
        """
        try:
            policy_data = self.get_policy_document(policy_id)
            if not policy_data:
                return {
                    "success": False,
                    "error": f"Policy document not found for ID: {policy_id}"
                }
            
            # Use template from prompts.py
            summary_prompt = POLICY_SUMMARY_PROMPT.format(
                policy_data=json.dumps(policy_data, indent=2)
            )
            
            response = self.client.models.generate_content(
                model='gemini-2.5-pro',
                contents=summary_prompt
            )
            
            return {
                "success": True,
                "summary": response.text,
                "policy_name": policy_data.get("policy_identification", {}).get("plan_name"),
                "provider_name": policy_data.get("provider_information", {}).get("provider_name")
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

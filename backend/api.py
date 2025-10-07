"""
FastAPI backend for the insurance policy application.
"""
from fastapi import FastAPI, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator
from typing import List, Dict, Any, Optional
import uvicorn
from .database import PolicyDatabase
from .gemini_service import GeminiPolicyService
from .cache import cache, cached
import markdown
import logging
from datetime import datetime, timedelta, timezone
import traceback
from collections import defaultdict
import asyncio

# Configure structured logging
import os
log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
os.makedirs(log_dir, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(log_dir, 'backend.log')),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Insurance Policy API", version="1.0.0")

# Rate limiting storage
rate_limit_storage = defaultdict(list)
RATE_LIMIT_REQUESTS = 10  # max requests per window
RATE_LIMIT_WINDOW = 60  # seconds

# Rate limiting middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Rate limiting middleware for Gemini API endpoints"""

    # Only apply rate limiting to Gemini endpoints
    if "/api/gemini" in request.url.path:
        client_ip = request.client.host
        current_time = datetime.now(timezone.utc)

        # Clean old requests
        rate_limit_storage[client_ip] = [
            req_time for req_time in rate_limit_storage[client_ip]
            if current_time - req_time < timedelta(seconds=RATE_LIMIT_WINDOW)
        ]

        # Check rate limit
        if len(rate_limit_storage[client_ip]) >= RATE_LIMIT_REQUESTS:
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "Rate limit exceeded",
                    "message": f"Maximum {RATE_LIMIT_REQUESTS} requests per {RATE_LIMIT_WINDOW} seconds allowed",
                    "retry_after": RATE_LIMIT_WINDOW
                }
            )

        # Add current request
        rate_limit_storage[client_ip].append(current_time)
        logger.debug(f"Request count for {client_ip}: {len(rate_limit_storage[client_ip])}")

    response = await call_next(request)
    return response

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred. Please try again later.",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    )

# Add CORS middleware - allow frontend from Render and local development
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.onrender\.com",  # Allow all Render deployments
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://10.0.0.207:3000",
        "https://insurance-frontend-1olt.onrender.com",  # Production frontend on Render
        "https://insurance-policy-app.vercel.app",  # Vercel (if still needed)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database and services with error handling
try:
    db = PolicyDatabase()
    gemini_service = GeminiPolicyService()
    logger.info("Successfully initialized database and Gemini service")
except Exception as e:
    logger.critical(f"Failed to initialize services: {str(e)}", exc_info=True)
    raise

# Pydantic models for API requests with validation
class GeminiQuestionRequest(BaseModel):
    policy_id: str
    policy_name: str
    policy_company: str
    product_uin: Optional[str] = None
    question: str
    chat_history: List[Dict[str, Any]] = []
    model: str = "gemini-2.5-pro"

    @field_validator('question')
    @classmethod
    def validate_question(cls, v):
        if not v or len(v.strip()) < 3:
            raise ValueError('Question must be at least 3 characters long')
        if len(v) > 1000:
            raise ValueError('Question must not exceed 1000 characters')
        return v.strip()

    @field_validator('policy_id')
    @classmethod
    def validate_policy_id(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Policy ID is required')
        return v.strip()

class PolicyAnalysisRequest(BaseModel):
    policy_id: str
    policy_name: str
    product_uin: Optional[str] = None

    @field_validator('policy_id')
    @classmethod
    def validate_policy_id(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Policy ID is required')
        return v.strip()

@app.get("/")
async def root():
    """Health check endpoint."""
    logger.info("Health check endpoint accessed")
    return {
        "message": "Insurance Policy API is running",
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Detailed health check with service status."""
    try:
        # Check database connection
        db_status = "healthy"
        try:
            db.get_policy_statistics()
        except Exception as e:
            db_status = f"unhealthy: {str(e)}"
            logger.error(f"Database health check failed: {str(e)}")

        # Check Gemini service
        gemini_status = "healthy" if gemini_service.api_key else "not configured"

        # Get cache stats
        cache_stats = cache.stats()

        health_data = {
            "status": "healthy" if db_status == "healthy" else "degraded",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "services": {
                "database": db_status,
                "gemini": gemini_status,
                "cache": cache_stats
            }
        }
        logger.info(f"Health check completed: {health_data['status']}")
        return health_data
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/cache/clear")
async def clear_cache():
    """Clear all cache entries (admin endpoint)"""
    try:
        cache.clear()
        logger.info("Cache cleared by admin request")
        return {"message": "Cache cleared successfully", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"Failed to clear cache: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/policies", response_model=List[Dict[str, Any]])
async def get_policies(
    provider_name: Optional[str] = Query(None, description="Filter by provider name"),
    policy_category: Optional[str] = Query(None, description="Filter by policy category"),
    min_sum_insured: Optional[int] = Query(None, description="Minimum sum insured amount"),
    max_premium: Optional[float] = Query(None, description="Maximum premium amount"),
    maternity_required: Optional[bool] = Query(None, description="Filter by maternity coverage"),
    daycare_required: Optional[bool] = Query(None, description="Filter by daycare coverage"),
    limit: Optional[int] = Query(100, description="Limit number of results"),
    offset: Optional[int] = Query(0, description="Offset for pagination")
):
    """Get all policies with optional filtering and pagination."""
    try:
        logger.info(f"Fetching policies with filters: provider={provider_name}, category={policy_category}, limit={limit}, offset={offset}")

        # Generate cache key from query parameters
        cache_key = cache._make_key(("policies", provider_name, policy_category, min_sum_insured,
                                      max_premium, maternity_required, daycare_required, limit, offset))

        # Check cache first
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            logger.info(f"Returning {len(cached_result)} policies from cache")
            return JSONResponse(
                content=cached_result,
                headers={
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0"
                }
            )
        if any([provider_name, policy_category, min_sum_insured, max_premium, maternity_required, daycare_required]):
            policies = db.search_policies(
                provider_name=provider_name,
                policy_category=policy_category,
                min_sum_insured=min_sum_insured,
                max_premium=max_premium,
                maternity_required=maternity_required,
                daycare_required=daycare_required
            )
        else:
            policies = db.get_all_policies()
        
        # Apply pagination
        total_count = len(policies)
        if offset:
            policies = policies[offset:]
        if limit:
            policies = policies[:limit]

        logger.info(f"Returning {len(policies)} policies (total: {total_count})")

        # Transform to frontend-compatible format
        frontend_policies = []
        for policy in policies:
            # Calculate a rating based on available data (mock calculation)
            rating = calculate_policy_rating(policy)
            
            # Generate price range from sum insured options
            price_range = generate_price_range(policy)
            
            frontend_policy = {
                "id": policy['id'],
                "type": "Health",  # All our policies are health policies
                "company": policy['provider_name'],
                "name": policy['plan_name'],
                "shortDescription": generate_description(policy),
                "priceRange": price_range,
                "benefits": extract_benefits(policy),
                "exclusions": extract_exclusions(policy),
                "eligibility": extract_eligibility(policy),
                "rating": rating,
                "reviewsCount": generate_review_count(policy),
                # Additional fields for detailed view
                "product_uin": policy['product_uin'],
                "policy_category": policy['policy_category'],
                "sum_insured_options": policy['sum_insured_options'],
                "payment_modes": policy['payment_modes'],
                "network_hospitals": policy['network_hospitals_count'],
                "claim_settlement_ratio": policy['claim_settlement_ratio'],
                "solvency_ratio": policy['solvency_ratio'],
                # Policy features from policy_features table
                "hospital_network": policy.get('hospital_network'),
                "room_rent": policy.get('room_rent'),
                "copayment": policy.get('copayment'),
                "restoration_benefit": policy.get('restoration_benefit'),
                "pre_post_hospitalization_coverage": policy.get('pre_post_hospitalization_coverage'),
                "waiting_period": policy.get('waiting_period'),
                "no_claim_bonus": policy.get('no_claim_bonus'),
                "disease_sub_limits": policy.get('disease_sub_limits'),
                "alternate_treatment_coverage": policy.get('alternate_treatment_coverage'),
                "maternity_care": policy.get('maternity_care'),
                "newborn_care": policy.get('newborn_care'),
                "health_checkups": policy.get('health_checkups'),
                "domiciliary": policy.get('domiciliary'),
                "outpatient_department": policy.get('outpatient_department'),
                "lifelong_renewal": policy.get('lifelong_renewal'),
                "critical_illness_rider": policy.get('critical_illness_rider'),
                "accident_disability_rider": policy.get('accident_disability_rider')
            }
            frontend_policies.append(frontend_policy)

        # Cache the result for 5 minutes
        cache.set(cache_key, frontend_policies, ttl=300)

        # Return with cache-busting headers to prevent browser caching
        return JSONResponse(
            content=frontend_policies,
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
    except Exception as e:
        logger.error(f"Error fetching policies: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch policies: {str(e)}")

@app.get("/api/policies/{policy_id}")
async def get_policy(policy_id: str):
    """Get a specific policy by ID."""
    try:
        logger.info(f"Fetching policy with ID: {policy_id}")
        policy = db.get_policy_by_id(policy_id)
        if not policy:
            logger.warning(f"Policy not found: {policy_id}")
            raise HTTPException(status_code=404, detail=f"Policy with ID '{policy_id}' not found")

        logger.info(f"Successfully retrieved policy: {policy.get('plan_name', 'Unknown')}")
        # Return the complete policy data including raw JSON
        return {
            "policy": policy,
            "raw_data": policy['raw_json']
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching policy {policy_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch policy: {str(e)}")

@app.get("/api/statistics")
async def get_statistics():
    """Get database statistics."""
    try:
        return db.get_policy_statistics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/providers")
async def get_providers():
    """Get list of all providers."""
    try:
        policies = db.get_all_policies()
        providers = list(set(policy['provider_name'] for policy in policies))
        return sorted(providers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/categories")
async def get_categories():
    """Get list of all policy categories."""
    try:
        policies = db.get_all_policies()
        categories = list(set(policy['policy_category'] for policy in policies))
        return sorted(categories)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Helper functions to transform database data to frontend format
def calculate_policy_rating(policy: Dict[str, Any]) -> float:
    """Calculate a policy rating based on available features."""
    rating = 3.0  # Base rating
    
    # Boost rating based on features
    if policy['claim_settlement_ratio'] > 90:
        rating += 0.5
    elif policy['claim_settlement_ratio'] > 85:
        rating += 0.3
    
    if policy['network_hospitals_count'] > 10000:
        rating += 0.3
    elif policy['network_hospitals_count'] > 5000:
        rating += 0.2
    
    if policy['maternity_covered']:
        rating += 0.2
    
    if policy['daycare_covered']:
        rating += 0.2
    
    if policy['no_claim_bonus_available']:
        rating += 0.2
    
    if policy['restoration_benefit_available']:
        rating += 0.3
    
    if policy['ambulance_covered']:
        rating += 0.1
    
    # Cap at 5.0
    return min(5.0, rating)

def generate_price_range(policy: Dict[str, Any]) -> str:
    """Generate a price range string based on sum insured options."""
    if policy['sum_insured_options']:
        try:
            # Convert all values to int (handles both int and string inputs)
            coverage_values = [int(x) if isinstance(x, (int, float)) else int(str(x).replace(',', ''))
                             for x in policy['sum_insured_options'] if x]

            if coverage_values:
                min_coverage = min(coverage_values)
                max_coverage = max(coverage_values)

                # Rough estimation: premium is typically 1-3% of sum insured
                min_premium = int(min_coverage * 0.01)
                max_premium = int(max_coverage * 0.03)

                return f"₹{min_premium:,} - ₹{max_premium:,} / year"
        except (ValueError, TypeError):
            pass

    return "₹5,000 - ₹50,000 / year"

def generate_description(policy: Dict[str, Any]) -> str:
    """Generate a short description for the policy."""
    category = policy['policy_category'].lower()
    features = []
    
    if policy['maternity_covered']:
        features.append("maternity coverage")
    if policy['daycare_covered']:
        features.append("daycare procedures")
    if policy['restoration_benefit_available']:
        features.append("restoration benefit")
    
    if features:
        return f"Comprehensive {category} health insurance with {', '.join(features[:2])}."
    else:
        return f"Reliable {category} health insurance plan with essential coverage."

def extract_benefits(policy: Dict[str, Any]) -> List[str]:
    """Extract benefits from policy data."""
    benefits = []
    
    if policy['claim_settlement_ratio'] > 0:
        benefits.append(f"Claim Settlement Ratio: {policy['claim_settlement_ratio']:.1f}%")
    
    if policy['network_hospitals_count'] > 0:
        benefits.append(f"Network Hospitals: {policy['network_hospitals_count']:,}")
    
    if policy['room_rent_description']:
        benefits.append(f"Room Rent: {policy['room_rent_description']}")
    
    if policy['pre_hospitalization_days'] > 0:
        benefits.append(f"Pre-hospitalization: {policy['pre_hospitalization_days']} days")
    
    if policy['post_hospitalization_days'] > 0:
        benefits.append(f"Post-hospitalization: {policy['post_hospitalization_days']} days")
    
    if policy['ambulance_covered'] and policy['ambulance_limit'] > 0:
        benefits.append(f"Ambulance Cover: ₹{policy['ambulance_limit']:,}")
    
    # Add more benefits as needed
    return benefits[:6]  # Limit to 6 benefits

def extract_exclusions(policy: Dict[str, Any]) -> List[str]:
    """Extract exclusions/waiting periods from policy data."""
    exclusions = []
    
    if policy['waiting_period_initial'] > 0:
        exclusions.append(f"Initial waiting period: {policy['waiting_period_initial']} days")
    
    if policy['waiting_period_pre_existing'] > 0:
        exclusions.append(f"Pre-existing diseases: {policy['waiting_period_pre_existing']} years")
    
    if policy['waiting_period_specific_ailments'] > 0:
        exclusions.append(f"Specific ailments: {policy['waiting_period_specific_ailments']} years")
    
    if policy['co_payment_applicable'] and policy['co_payment_details']:
        exclusions.append(f"Co-payment: {policy['co_payment_details']}")
    
    if policy['maternity_waiting_period'] > 0:
        exclusions.append(f"Maternity waiting period: {policy['maternity_waiting_period']} months")
    
    # Add standard exclusions
    exclusions.extend([
        "Pre-existing conditions (as per waiting period)",
        "Cosmetic treatments",
        "Dental treatments (unless due to accident)"
    ])
    
    return exclusions[:6]  # Limit to 6 exclusions

def extract_eligibility(policy: Dict[str, Any]) -> List[str]:
    """Extract eligibility/additional features from policy data."""
    eligibility = []
    
    if policy['daycare_covered']:
        eligibility.append("Day-care procedures covered")
    
    if policy['maternity_covered']:
        eligibility.append("Maternity benefits available")
    
    if policy['no_claim_bonus_available']:
        eligibility.append("No Claim Bonus")
    
    if policy['restoration_benefit_available']:
        eligibility.append("Sum Insured Restoration")
    
    if policy['is_tax_benefit_eligible']:
        eligibility.append("Tax benefits under 80D")
    
    if policy['payment_modes']:
        modes = ", ".join(policy['payment_modes'][:3])  # Show first 3 modes
        eligibility.append(f"Payment modes: {modes}")
    
    return eligibility[:5]  # Limit to 5 eligibility items

def generate_review_count(policy: Dict[str, Any]) -> int:
    """Generate a mock review count based on policy features."""
    base_count = 500
    
    # More features = more reviews
    if policy['maternity_covered']:
        base_count += 200
    if policy['daycare_covered']:
        base_count += 150
    if policy['restoration_benefit_available']:
        base_count += 300
    if policy['network_hospitals_count'] > 10000:
        base_count += 500
    
    return base_count

def format_gemini_response(text: str) -> str:
    """
    Convert Gemini's Markdown response to structured HTML for better frontend rendering.
    """
    # Basic Markdown to HTML conversion using the library, which is more robust
    # The 'nl2br' extension handles line breaks correctly.
    html = markdown.markdown(text, extensions=['fenced_code', 'tables', 'nl2br'])
    
    # Custom styling for better readability
    html = f"""
    <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
        {html}
    </div>
    """
    return html

# Gemini API endpoints
@app.post("/api/gemini")
async def ask_policy_question(request: GeminiQuestionRequest):
    """
    Ask a question about a specific policy using Gemini 2.5 Pro
    """
    try:
        logger.info(f"Gemini question for policy {request.policy_id}: '{request.question[:100]}...'")

        result = await gemini_service.ask_policy_question(
            policy_id=request.policy_id,
            question=request.question,
            chat_history=request.chat_history
        )

        if not result["success"]:
            logger.warning(f"Gemini service returned error: {result.get('error', 'Unknown error')}")
            raise HTTPException(status_code=400, detail=result["error"])

        logger.info(f"Gemini response generated successfully for policy {request.policy_id}")

        return {
            "response": format_gemini_response(result["response_text"]),
            "follow_up_questions": result.get("follow_up_questions", []),
            "policy_name": result.get("policy_name"),
            "provider_name": result.get("provider_name"),
            "model_used": request.model
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing Gemini question: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing question: {str(e)}")

@app.post("/api/gemini/analyze")
async def get_policy_analysis(request: PolicyAnalysisRequest):
    """
    Get a comprehensive analysis of a policy document
    """
    try:
        logger.info(f"Gemini analysis requested for policy: {request.policy_id}")

        result = await gemini_service.get_policy_summary(request.policy_id)

        if not result["success"]:
            logger.warning(f"Gemini analysis failed: {result.get('error', 'Unknown error')}")
            raise HTTPException(status_code=400, detail=result["error"])

        logger.info(f"Gemini analysis completed for policy {request.policy_id}")

        return {
            "summary": format_gemini_response(result["summary"]),
            "policy_name": result.get("policy_name"),
            "provider_name": result.get("provider_name")
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing policy: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error analyzing policy: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

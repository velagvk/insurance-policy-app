"""
Simple in-memory caching layer for API responses
"""
from typing import Any, Optional
from datetime import datetime, timedelta
from functools import wraps
import hashlib
import json
import logging

logger = logging.getLogger(__name__)


class SimpleCache:
    """Simple in-memory cache with TTL support"""

    def __init__(self, default_ttl: int = 300):
        """
        Initialize cache

        Args:
            default_ttl: Default time-to-live in seconds (default: 5 minutes)
        """
        self.cache = {}
        self.default_ttl = default_ttl

    def _make_key(self, key_parts: tuple) -> str:
        """Generate cache key from tuple of parts"""
        key_str = json.dumps(key_parts, sort_keys=True)
        return hashlib.md5(key_str.encode()).hexdigest()

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired"""
        if key in self.cache:
            value, expiry = self.cache[key]
            if datetime.utcnow() < expiry:
                logger.debug(f"Cache HIT for key: {key[:16]}...")
                return value
            else:
                # Remove expired entry
                del self.cache[key]
                logger.debug(f"Cache EXPIRED for key: {key[:16]}...")
        else:
            logger.debug(f"Cache MISS for key: {key[:16]}...")
        return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set value in cache with TTL"""
        ttl = ttl or self.default_ttl
        expiry = datetime.utcnow() + timedelta(seconds=ttl)
        self.cache[key] = (value, expiry)
        logger.debug(f"Cache SET for key: {key[:16]}... (TTL: {ttl}s)")

    def delete(self, key: str) -> None:
        """Delete value from cache"""
        if key in self.cache:
            del self.cache[key]
            logger.debug(f"Cache DELETE for key: {key[:16]}...")

    def clear(self) -> None:
        """Clear all cache entries"""
        count = len(self.cache)
        self.cache.clear()
        logger.info(f"Cache CLEARED ({count} entries removed)")

    def cleanup(self) -> int:
        """Remove expired entries and return count of removed items"""
        now = datetime.utcnow()
        expired_keys = [k for k, (_, expiry) in self.cache.items() if now >= expiry]
        for key in expired_keys:
            del self.cache[key]
        if expired_keys:
            logger.info(f"Cache cleanup removed {len(expired_keys)} expired entries")
        return len(expired_keys)

    def stats(self) -> dict:
        """Get cache statistics"""
        now = datetime.utcnow()
        active = sum(1 for _, expiry in self.cache.values() if now < expiry)
        expired = len(self.cache) - active
        return {
            "total_entries": len(self.cache),
            "active_entries": active,
            "expired_entries": expired
        }


def cached(ttl: int = 300, key_prefix: str = ""):
    """
    Decorator for caching function results

    Args:
        ttl: Time to live in seconds
        key_prefix: Prefix for cache key
    """
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            cache_key_parts = (key_prefix or func.__name__, args, tuple(sorted(kwargs.items())))
            cache_key = cache.make_key(cache_key_parts)

            # Try to get from cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                return cached_value

            # Call function and cache result
            result = await func(*args, **kwargs)
            cache.set(cache_key, result, ttl=ttl)
            return result

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            cache_key_parts = (key_prefix or func.__name__, args, tuple(sorted(kwargs.items())))
            cache_key = cache._make_key(cache_key_parts)

            # Try to get from cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                return cached_value

            # Call function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl=ttl)
            return result

        # Return appropriate wrapper based on function type
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator


# Global cache instance
cache = SimpleCache(default_ttl=300)  # 5 minutes default

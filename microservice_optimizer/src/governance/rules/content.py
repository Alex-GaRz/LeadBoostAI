"""
Content Governance Rules - Tone, messaging, and compliance checks.

These rules enforce content guidelines defined in the Brand Genome.
They ensure messaging aligns with brand voice and avoids prohibited content.
"""

import logging
import re
from typing import Dict, Any, List

# Import from shared_lib contracts
from contracts import QualityCheck, Severity

# Import local types
from ..engine.context import AuditContext
from .base import GovernanceRule

logger = logging.getLogger(__name__)


class KeywordBlacklistRule(GovernanceRule):
    """
    Rule: TXT_001 - Forbidden Keywords Check
    
    Scans content for forbidden words defined in the Brand Genome.
    Uses case-insensitive matching and detects word boundaries.
    
    Severity: CRITICAL - Forbidden words are absolute blockers.
    """
    
    rule_id = "TXT_001_KEYWORD_BLACKLIST"
    severity = Severity.CRITICAL
    
    async def evaluate(self, ctx: AuditContext) -> QualityCheck:
        """
        Check for forbidden keywords in core message.
        
        Args:
            ctx: AuditContext with payload and genome
            
        Returns:
            FAIL if forbidden words found, PASS otherwise
        """
        # Check if strategy exists
        if not ctx.has_strategy():
            return self.fail_check(
                reason="NO_STRATEGY_DEFINED",
                evidence={"message": "Cannot check content without strategy"}
            )
        
        # Get core message
        core_message = ctx.get_core_message()
        
        if not core_message:
            return self.fail_check(
                reason="NO_CONTENT_TO_CHECK",
                evidence={"message": "Core message is empty"}
            )
        
        # Get forbidden words from genome
        forbidden_words = ctx.genome.tone.forbidden_words
        
        if not forbidden_words:
            # No forbidden words defined, pass automatically
            return self.pass_check(
                evidence={"message": "No forbidden words defined in genome"}
            )
        
        # Check for forbidden words (case-insensitive, word boundaries)
        violations = []
        message_lower = core_message.lower()
        
        for word in forbidden_words:
            # Use word boundary regex for exact word matching
            pattern = r'\b' + re.escape(word.lower()) + r'\b'
            if re.search(pattern, message_lower):
                # Find all occurrences for evidence
                matches = re.finditer(pattern, message_lower)
                positions = [match.start() for match in matches]
                violations.append({
                    "word": word,
                    "positions": positions,
                    "count": len(positions)
                })
        
        # Log check
        logger.info(
            f"[{self.rule_id}] Checked {len(forbidden_words)} forbidden words "
            f"in message of length {len(core_message)}"
        )
        
        # If violations found, fail
        if violations:
            total_violations = sum(v['count'] for v in violations)
            violated_words = [v['word'] for v in violations]
            
            return self.fail_check(
                reason="FORBIDDEN_WORDS_DETECTED",
                evidence={
                    "core_message_preview": core_message[:100] + "..." if len(core_message) > 100 else core_message,
                    "violations": violations,
                    "violated_words": violated_words,
                    "total_violations": total_violations,
                    "message": f"Found {total_violations} occurrence(s) of forbidden words: {', '.join(violated_words)}"
                }
            )
        
        # No violations
        return self.pass_check(
            evidence={
                "core_message_length": len(core_message),
                "forbidden_words_checked": len(forbidden_words),
                "message": f"No forbidden words detected (checked {len(forbidden_words)} words)"
            }
        )


class RequiredDisclaimerRule(GovernanceRule):
    """
    Rule: TXT_002 - Required Disclaimers Check
    
    Validates that all required legal disclaimers are present in content.
    
    Severity: HIGH - Legal compliance is important but may be added later.
    """
    
    rule_id = "TXT_002_REQUIRED_DISCLAIMERS"
    severity = Severity.HIGH
    
    async def evaluate(self, ctx: AuditContext) -> QualityCheck:
        """
        Check for required disclaimers.
        
        Args:
            ctx: AuditContext
            
        Returns:
            FAIL if disclaimers missing, PASS if all present
        """
        # Check if strategy exists
        if not ctx.has_strategy():
            return self.fail_check(
                reason="NO_STRATEGY_DEFINED",
                evidence={"message": "Cannot check disclaimers without strategy"}
            )
        
        # Get core message
        core_message = ctx.get_core_message()
        
        if not core_message:
            return self.warn_check(
                reason="NO_CONTENT_TO_CHECK",
                evidence={"message": "Core message is empty, cannot verify disclaimers"}
            )
        
        # Get required disclaimers from genome
        required_disclaimers = ctx.genome.tone.required_disclaimers
        
        if not required_disclaimers:
            # No disclaimers required, pass
            return self.pass_check(
                evidence={"message": "No disclaimers required by genome"}
            )
        
        # Check for each required disclaimer
        missing_disclaimers = []
        message_lower = core_message.lower()
        
        for disclaimer in required_disclaimers:
            # Case-insensitive substring search
            if disclaimer.lower() not in message_lower:
                missing_disclaimers.append(disclaimer)
        
        logger.info(
            f"[{self.rule_id}] Checked {len(required_disclaimers)} required disclaimers"
        )
        
        # If any missing, fail
        if missing_disclaimers:
            return self.fail_check(
                reason="MISSING_REQUIRED_DISCLAIMERS",
                evidence={
                    "required_disclaimers": required_disclaimers,
                    "missing_disclaimers": missing_disclaimers,
                    "message": f"Missing {len(missing_disclaimers)} required disclaimer(s): {', '.join(missing_disclaimers)}"
                }
            )
        
        # All disclaimers present
        return self.pass_check(
            evidence={
                "required_disclaimers": required_disclaimers,
                "message": f"All {len(required_disclaimers)} required disclaimer(s) present"
            }
        )


class MessageLengthRule(GovernanceRule):
    """
    Rule: TXT_003 - Message Length Validation
    
    Validates that content length is within reasonable bounds.
    Too short = lack of substance, too long = poor engagement.
    
    Severity: MEDIUM - Advisory guideline, not blocking.
    """
    
    rule_id = "TXT_003_MESSAGE_LENGTH"
    severity = Severity.MEDIUM
    
    # Configurable thresholds
    MIN_LENGTH = 10
    MAX_LENGTH = 500
    OPTIMAL_MIN = 50
    OPTIMAL_MAX = 200
    
    async def evaluate(self, ctx: AuditContext) -> QualityCheck:
        """
        Validate message length.
        
        Args:
            ctx: AuditContext
            
        Returns:
            FAIL if too short/long, WARN if suboptimal, PASS if good
        """
        # Check if strategy exists
        if not ctx.has_strategy():
            return self.warn_check(
                reason="NO_STRATEGY_DEFINED",
                evidence={"message": "Cannot check length without strategy"}
            )
        
        # Get core message
        core_message = ctx.get_core_message()
        message_length = len(core_message)
        
        logger.info(
            f"[{self.rule_id}] Message length: {message_length} chars"
        )
        
        # Too short - fail
        if message_length < self.MIN_LENGTH:
            return self.fail_check(
                reason="MESSAGE_TOO_SHORT",
                evidence={
                    "message_length": message_length,
                    "min_length": self.MIN_LENGTH,
                    "message": f"Message too short ({message_length} chars, minimum {self.MIN_LENGTH})"
                }
            )
        
        # Too long - fail
        if message_length > self.MAX_LENGTH:
            return self.fail_check(
                reason="MESSAGE_TOO_LONG",
                evidence={
                    "message_length": message_length,
                    "max_length": self.MAX_LENGTH,
                    "excess_chars": message_length - self.MAX_LENGTH,
                    "message": f"Message too long ({message_length} chars, maximum {self.MAX_LENGTH})"
                }
            )
        
        # Suboptimal but acceptable - warn
        if message_length < self.OPTIMAL_MIN or message_length > self.OPTIMAL_MAX:
            return self.warn_check(
                reason="MESSAGE_LENGTH_SUBOPTIMAL",
                evidence={
                    "message_length": message_length,
                    "optimal_range": [self.OPTIMAL_MIN, self.OPTIMAL_MAX],
                    "message": f"Message length ({message_length} chars) outside optimal range ({self.OPTIMAL_MIN}-{self.OPTIMAL_MAX})"
                }
            )
        
        # Optimal length
        return self.pass_check(
            evidence={
                "message_length": message_length,
                "optimal_range": [self.OPTIMAL_MIN, self.OPTIMAL_MAX],
                "message": f"Message length optimal ({message_length} chars)"
            }
        )


class ToneVoiceRule(GovernanceRule):
    """
    Rule: TXT_004 - Brand Voice Consistency (Placeholder)
    
    Validates that content matches the brand voice description.
    
    NOTE: This is a placeholder for LLM-based tone validation.
    Real implementation would use LLM-as-a-Judge pattern.
    
    Severity: HIGH - Brand voice is important but subjective.
    """
    
    rule_id = "TXT_004_TONE_VOICE"
    severity = Severity.HIGH
    
    async def evaluate(self, ctx: AuditContext) -> QualityCheck:
        """
        Placeholder for tone/voice validation.
        
        Real implementation would use LLM to judge tone against
        the voice_description in the genome.
        
        Args:
            ctx: AuditContext
            
        Returns:
            PASS (placeholder - always passes for now)
        """
        # Check if strategy exists
        if not ctx.has_strategy():
            return self.warn_check(
                reason="NO_STRATEGY_DEFINED",
                evidence={"message": "Cannot check tone without strategy"}
            )
        
        voice_description = ctx.genome.tone.voice_description
        core_message = ctx.get_core_message()
        
        logger.info(
            f"[{self.rule_id}] Tone check (placeholder): "
            f"voice='{voice_description}', message_length={len(core_message)}"
        )
        
        # Placeholder: In production, would call LLM service here
        # For now, just pass with a note
        return self.pass_check(
            evidence={
                "voice_description": voice_description,
                "message_length": len(core_message),
                "message": "Tone validation skipped (LLM integration pending)",
                "note": "Production implementation would use LLM-as-a-Judge pattern"
            }
        )

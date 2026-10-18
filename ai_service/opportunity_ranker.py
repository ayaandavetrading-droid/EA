"""
Apex AI Trader - Opportunity Ranker & Uncertainty Estimator
Multi-Objective Alpha Scoring with Strict Execution Cost Friction
"""
from typing import Dict, List, Any


class OpportunityRanker:
    """
    Ranks candidates using expected net payoff after spreads, commission, and slippage.
    """

    def score_candidate(
        self,
        symbol: str,
        regime_info: Dict[str, Any],
        signal_conviction: float,  # 0 to 100
        spread_points: int,
        atr_points: float,
        reward_risk_ratio: float,
        correlated_count: int = 0
    ) -> Dict[str, Any]:
        # Cost friction ratio
        cost_ratio = (spread_points / atr_points) if atr_points > 0 else 1.0

        # Disqualifying conditions
        if not regime_info.get("is_tradeable", False):
            return {
                "symbol": symbol,
                "score": 10.0,
                "is_approved": False,
                "skip_reason": regime_info.get("reason", "Untradeable regime")
            }

        if regime_info.get("uncertainty", 0.5) > 0.40:
            return {
                "symbol": symbol,
                "score": 15.0,
                "is_approved": False,
                "skip_reason": f"High model uncertainty ({round(regime_info['uncertainty'], 2)} > 0.40)"
            }

        if cost_ratio > 0.25:
            return {
                "symbol": symbol,
                "score": 18.0,
                "is_approved": False,
                "skip_reason": f"Spread eats {round(cost_ratio * 100, 1)}% of typical range (max 25%)"
            }

        if correlated_count >= 2:
            return {
                "symbol": symbol,
                "score": 25.0,
                "is_approved": False,
                "skip_reason": f"Correlated currency limit reached ({correlated_count} active pairs)"
            }

        # Multi-factor scoring
        base_score = signal_conviction * 0.50
        rr_bonus = min(25.0, (reward_risk_ratio - 1.0) * 20.0)
        cost_penalty = cost_ratio * 40.0
        uncertainty_penalty = regime_info.get("uncertainty", 0.3) * 35.0
        trend_clarity = min(15.0, regime_info.get("trend_strength", 20.0) * 0.2)

        composite = base_score + rr_bonus - cost_penalty - uncertainty_penalty + trend_clarity
        final_score = max(5.0, min(99.0, composite))

        return {
            "symbol": symbol,
            "score": round(final_score, 1),
            "is_approved": final_score >= 70.0,
            "reward_risk": round(reward_risk_ratio, 2),
            "cost_friction_pct": round(cost_ratio * 100, 1),
            "model_uncertainty": round(regime_info.get("uncertainty", 0.0), 2),
            "skip_reason": "PASS" if final_score >= 70.0 else "Composite score below 70 threshold"
        }

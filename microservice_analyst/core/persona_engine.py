# microservice_analyst/core/persona_engine.py

import json
import uuid
import os
import asyncio
from typing import List
from microservice_analyst.models.schemas import PersonaProfile
from openai import AsyncOpenAI

class PersonaFactory:
    def __init__(self):
        # In a real scenario, API key comes from env. 
        # For safety, we default to a check or mock if missing.
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None

    async def generate_cohort(self, target_description: str, quantity: int) -> List[PersonaProfile]:
        """
        Generates N psychographically distinct personas based on a target description.
        """
        if not self.client:
            # Fallback for demo/no-key environment
            return self._generate_mock_cohort(quantity)

        prompt = f"""
        ACT AS A BEHAVIORAL PSYCHOLOGIST.
        Create {quantity} distinct, realistic user personas for a target audience described as: "{target_description}".
        
        CRITICAL RULES:
        1. Diversity: Vary ages, incomes, and especially COGNITIVE BIASES.
        2. Depth: Include current life stressors (e.g., debt, health) that affect buying power.
        3. Output: Return ONLY a JSON list of objects matching this schema:
        [{{
            "name": "str", "age": int, "occupation": "str", "financial_status": "str",
            "cognitive_biases": ["bias1", "bias2"],
            "current_stressors": ["stress1"],
            "media_diet": ["source1"],
            "values": ["value1"]
        }}]
        """

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini", # Cost effective model
                messages=[{"role": "system", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.9 # High temperature for diversity
            )
            content = response.choices[0].message.content
            data = json.loads(content)
            
            # Handle if the LLM wraps it in a key like "personas": [...]
            raw_list = data.get("personas", data) if isinstance(data, dict) else data
            
            personas = []
            for p in raw_list:
                p['id'] = str(uuid.uuid4())
                personas.append(PersonaProfile(**p))
            
            return personas[:quantity]

        except Exception as e:
            print(f"⚠️ Error generating cohort: {e}")
            return self._generate_mock_cohort(quantity)

    def _generate_mock_cohort(self, quantity: int) -> List[PersonaProfile]:
        """Fallback generator for testing without costs."""
        mock_personas = []
        for i in range(quantity):
            mock_personas.append(PersonaProfile(
                id=str(uuid.uuid4()),
                name=f"Simulated Agent {i+1}",
                age=25 + (i * 2),
                occupation="Mock Analyst",
                financial_status="Stable" if i % 2 == 0 else "Stressed",
                cognitive_biases=["Loss Aversion", "Social Proof"],
                current_stressors=["Inflation"],
                media_diet=["Twitter", "News"],
                values=["Security", "Freedom"]
            ))
        return mock_personas
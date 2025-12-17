"""
Base models with UUIDs and time mixins.
"""

from pydantic import BaseModel, Field
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional


class UUIDMixin(BaseModel):
    """Mixin for models that need a UUID identifier."""
    id: UUID = Field(default_factory=uuid4)


class TimeMixin(BaseModel):
    """Mixin for models that need timestamp tracking."""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    def mark_updated(self):
        """Mark this model as updated."""
        self.updated_at = datetime.utcnow()

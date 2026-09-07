from datetime import datetime, timezone

from extensions.db import db


class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    __table_args__ = (
        db.CheckConstraint(
            'value > 0',
            name='ck_subscriptions_value_positive',
        ),
        db.CheckConstraint(
            "recurrence IN ('weekly', 'monthly', 'quarterly', 'yearly')",
            name='ck_subscriptions_recurrence',
        ),
    )

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    value = db.Column(db.Numeric(12, 2), nullable=False)
    recurrence = db.Column(db.String(16), nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

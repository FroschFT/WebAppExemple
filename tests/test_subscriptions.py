import unittest
from decimal import Decimal

from app.subscriptions.models import Subscription
from app.subscriptions.service import annualize_value
from extensions.db import db
from tests.base import AppTestCase


class SubscriptionServiceTests(unittest.TestCase):
    def test_values_are_annualized_for_each_recurrence(self):
        cases = (
            ('weekly', '10.00', '520.00'),
            ('monthly', '10.00', '120.00'),
            ('quarterly', '10.00', '40.00'),
            ('yearly', '10.00', '10.00'),
        )

        for recurrence, value, expected in cases:
            with self.subTest(recurrence=recurrence):
                self.assertEqual(
                    annualize_value(Decimal(value), recurrence),
                    Decimal(expected),
                )


class SubscriptionRouteTests(AppTestCase):
    def _get_csrf_token(self):
        response = self.client.get('/subscriptions/')
        self.assertEqual(response.status_code, 200)

        with self.client.session_transaction() as session:
            return session['subscription_csrf_token']

    def _create_subscription(
        self,
        token,
        name='Design Suite',
        value='19.90',
        recurrence='monthly',
    ):
        return self.client.post('/subscriptions/', data={
            'csrf_token': token,
            'name': name,
            'value': value,
            'recurrence': recurrence,
        })

    def test_empty_page_renders_zero_summary(self):
        response = self.client.get('/subscriptions/')

        self.assertEqual(response.status_code, 200)
        self.assertIn(b'id="subscriptionApp"', response.data)
        self.assertIn(b'id="subscriptionsEmptyState"', response.data)
        self.assertIn(b'id="subscriptionCount">0</strong>', response.data)
        self.assertIn(b'$0.00', response.data)

    def test_subscriptions_are_persisted_and_summarized(self):
        token = self._get_csrf_token()

        monthly_response = self._create_subscription(token)
        yearly_response = self._create_subscription(
            token,
            name='Domain renewal',
            value='120.00',
            recurrence='yearly',
        )

        self.assertEqual(monthly_response.status_code, 303)
        self.assertEqual(yearly_response.status_code, 303)

        response = self.client.get('/subscriptions/')
        self.assertIn(b'Design Suite', response.data)
        self.assertIn(b'Domain renewal', response.data)
        self.assertIn(b'$29.90', response.data)
        self.assertIn(b'$358.80', response.data)

        with self.app.app_context():
            subscriptions = db.session.execute(
                db.select(Subscription).order_by(Subscription.name)
            ).scalars().all()

            self.assertEqual(len(subscriptions), 2)
            self.assertEqual(subscriptions[0].name, 'Design Suite')
            self.assertEqual(subscriptions[0].value, Decimal('19.90'))
            self.assertEqual(subscriptions[0].recurrence, 'monthly')

    def test_invalid_fields_are_rejected_without_writing(self):
        token = self._get_csrf_token()
        response = self._create_subscription(
            token,
            name='',
            value='12.345',
            recurrence='daily',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn(b'Enter a subscription name.', response.data)
        self.assertIn(b'Use no more than two decimal places.', response.data)
        self.assertIn(b'Choose a valid recurrence.', response.data)

        with self.app.app_context():
            subscriptions = db.session.execute(
                db.select(Subscription)
            ).scalars().all()
            self.assertEqual(subscriptions, [])

    def test_state_changes_require_a_valid_form_token(self):
        response = self._create_subscription('invalid-token')

        self.assertEqual(response.status_code, 400)

        with self.app.app_context():
            subscriptions = db.session.execute(
                db.select(Subscription)
            ).scalars().all()
            self.assertEqual(subscriptions, [])

    def test_subscription_can_be_deleted(self):
        token = self._get_csrf_token()
        self._create_subscription(token)

        with self.app.app_context():
            subscription_id = db.session.execute(
                db.select(Subscription.id)
            ).scalar_one()

        response = self.client.post(
            f'/subscriptions/{subscription_id}/delete/',
            data={'csrf_token': token},
        )

        self.assertEqual(response.status_code, 303)

        page = self.client.get('/subscriptions/')
        self.assertIn(b'Design Suite was removed.', page.data)
        self.assertIn(b'id="subscriptionsEmptyState"', page.data)

        missing = self.client.post(
            '/subscriptions/999/delete/',
            data={'csrf_token': token},
        )
        self.assertEqual(missing.status_code, 404)

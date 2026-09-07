from decimal import Decimal, InvalidOperation, ROUND_HALF_UP


CENT = Decimal('0.01')
MAX_SUBSCRIPTION_NAME_LENGTH = 100
MAX_SUBSCRIPTION_VALUE = Decimal('9999999999.99')
RECURRENCE_OPTIONS = (
    {
        'value': 'weekly',
        'label': 'Weekly',
        'periods_per_year': Decimal('52'),
    },
    {
        'value': 'monthly',
        'label': 'Monthly',
        'periods_per_year': Decimal('12'),
    },
    {
        'value': 'quarterly',
        'label': 'Quarterly',
        'periods_per_year': Decimal('4'),
    },
    {
        'value': 'yearly',
        'label': 'Yearly',
        'periods_per_year': Decimal('1'),
    },
)
_RECURRENCE_BY_VALUE = {
    option['value']: option for option in RECURRENCE_OPTIONS
}


def _form_text(form, field):
    value = form.get(field, '')
    return value.strip() if isinstance(value, str) else ''


def validate_subscription_form(form):
    form_values = {
        'name': _form_text(form, 'name'),
        'value': _form_text(form, 'value'),
        'recurrence': _form_text(form, 'recurrence'),
    }
    errors = {}

    name = form_values['name']
    if not name:
        errors['name'] = 'Enter a subscription name.'
    elif len(name) > MAX_SUBSCRIPTION_NAME_LENGTH:
        errors['name'] = (
            'Use no more than '
            f'{MAX_SUBSCRIPTION_NAME_LENGTH} characters.'
        )

    parsed_value = None
    raw_value = form_values['value']
    if not raw_value:
        errors['value'] = 'Enter the recurring amount.'
    else:
        try:
            parsed_value = Decimal(raw_value)
        except InvalidOperation:
            errors['value'] = 'Enter a valid monetary amount.'
        else:
            if not parsed_value.is_finite() or parsed_value <= 0:
                errors['value'] = 'The amount must be greater than zero.'
            elif parsed_value > MAX_SUBSCRIPTION_VALUE:
                errors['value'] = 'The amount is too large.'
            elif parsed_value.as_tuple().exponent < -2:
                errors['value'] = 'Use no more than two decimal places.'
            else:
                parsed_value = parsed_value.quantize(
                    CENT,
                    rounding=ROUND_HALF_UP,
                )

    recurrence = form_values['recurrence']
    if recurrence not in _RECURRENCE_BY_VALUE:
        errors['recurrence'] = 'Choose a valid recurrence.'

    if errors:
        return None, errors, form_values

    return {
        'name': name,
        'value': parsed_value,
        'recurrence': recurrence,
    }, {}, form_values


def get_recurrence(recurrence):
    try:
        return _RECURRENCE_BY_VALUE[recurrence]
    except KeyError as error:
        raise ValueError(
            f'Unsupported subscription recurrence: {recurrence}'
        ) from error


def annualize_value(value, recurrence):
    option = get_recurrence(recurrence)
    return (
        Decimal(value) * option['periods_per_year']
    ).quantize(CENT, rounding=ROUND_HALF_UP)


def build_subscription_summary(subscriptions):
    annual_total = Decimal('0.00')
    recurrence_counts = {
        option['value']: 0 for option in RECURRENCE_OPTIONS
    }

    for subscription in subscriptions:
        annual_total += annualize_value(
            subscription.value,
            subscription.recurrence,
        )
        recurrence_counts[subscription.recurrence] += 1

    annual_total = annual_total.quantize(CENT, rounding=ROUND_HALF_UP)
    monthly_total = (annual_total / Decimal('12')).quantize(
        CENT,
        rounding=ROUND_HALF_UP,
    )

    return {
        'count': len(subscriptions),
        'monthly_total': monthly_total,
        'annual_total': annual_total,
        'recurrence_counts': tuple(
            {
                'label': option['label'],
                'count': recurrence_counts[option['value']],
            }
            for option in RECURRENCE_OPTIONS
        ),
    }

from flask import abort, render_template, request, url_for

from app.chat import bp


CONVERSATIONS = (
    {
        'id': 'sofia-martinez',
        'name': 'Sofia Martinez',
        'avatar': 'img/undraw_profile_1.svg',
        'status': 'online',
        'status_label': 'Online',
        'preview': 'I shared the updated brief in the project folder.',
        'time': '9:42 AM',
        'date_label': 'Today',
        'unread': 2,
        'messages': (
            {
                'direction': 'incoming',
                'text': 'Hi Douglas, I finished the dashboard handoff. Do you have a minute to review it?',
                'time': '9:28 AM',
            },
            {
                'direction': 'outgoing',
                'text': 'Absolutely. Send it over and I will take a look.',
                'time': '9:31 AM',
            },
            {
                'direction': 'incoming',
                'text': 'Great - I shared the updated brief in the project folder.',
                'time': '9:42 AM',
            },
        ),
    },
    {
        'id': 'marcus-johnson',
        'name': 'Marcus Johnson',
        'avatar': 'img/undraw_profile_2.svg',
        'status': 'away',
        'status_label': 'Away',
        'preview': 'The client call moved to 3:30 PM.',
        'time': 'Yesterday',
        'date_label': 'Yesterday',
        'unread': 0,
        'messages': (
            {
                'direction': 'incoming',
                'text': 'Quick update: the client call moved to 3:30 PM.',
                'time': 'Yesterday, 2:14 PM',
            },
            {
                'direction': 'outgoing',
                'text': 'Thanks for the heads-up. I updated my calendar.',
                'time': 'Yesterday, 2:18 PM',
            },
        ),
    },
    {
        'id': 'emily-stone',
        'name': 'Emily Stone',
        'avatar': 'img/undraw_profile_3.svg',
        'status': 'online',
        'status_label': 'Online',
        'preview': 'That works perfectly, thank you!',
        'time': 'Mon',
        'date_label': 'Monday',
        'unread': 0,
        'messages': (
            {
                'direction': 'outgoing',
                'text': 'I can have the report ready by Monday morning.',
                'time': 'Monday, 10:06 AM',
            },
            {
                'direction': 'incoming',
                'text': 'That works perfectly, thank you!',
                'time': 'Monday, 10:08 AM',
            },
        ),
    },
    {
        'id': 'design-team',
        'name': 'Design Team',
        'avatar': 'img/undraw_profile.svg',
        'status': 'online',
        'status_label': '4 members',
        'preview': 'Maya: The new color tokens are ready.',
        'time': 'Fri',
        'date_label': 'Friday',
        'unread': 4,
        'messages': (
            {
                'direction': 'incoming',
                'sender': 'Maya',
                'text': 'The new color tokens are ready for review.',
                'time': 'Friday, 4:12 PM',
            },
            {
                'direction': 'incoming',
                'sender': 'Liam',
                'text': 'Nice. I will apply them to the component library next.',
                'time': 'Friday, 4:16 PM',
            },
        ),
    },
    {
        'id': 'product-support',
        'name': 'Product Support',
        'avatar': 'img/undraw_profile_2.svg',
        'status': 'offline',
        'status_label': 'Usually replies within a day',
        'preview': 'Your request has been marked as resolved.',
        'time': 'Aug 24',
        'date_label': 'August 24',
        'unread': 0,
        'messages': (
            {
                'direction': 'incoming',
                'sender': 'Product Support',
                'text': 'Your request has been marked as resolved. Reply here if you still need help.',
                'time': 'August 24, 11:50 AM',
            },
        ),
    },
)


@bp.route('/')
def index():
    conversations = [
        dict(conversation, avatar_url=url_for('static', filename=conversation['avatar']))
        for conversation in CONVERSATIONS
    ]
    requested_conversation_id = request.args.get('conversation')
    active_conversation = conversations[0]
    open_conversation = requested_conversation_id is not None

    if open_conversation:
        active_conversation = next(
            (
                conversation
                for conversation in conversations
                if conversation['id'] == requested_conversation_id
            ),
            None,
        )

        if active_conversation is None:
            abort(404, description='The requested conversation was not found.')

    return render_template(
        'chat/index.html',
        conversations=conversations,
        active_conversation=active_conversation,
        open_conversation=open_conversation,
    )

MCP_EXAMPLE_SERVERS = (
    {
        'id': 'workspace-files-example',
        'name': 'Workspace Files',
        'description': (
            'Local file tools for exploring and updating a project workspace '
            'through a controlled stdio process.'
        ),
        'transport': 'stdio',
        'transport_label': 'stdio',
        'status': 'ready',
        'status_label': 'Example ready',
        'scope': 'Local workspace',
        'icon': 'fas fa-folder-open',
        'capabilities': ('Files', 'Search', 'Editing'),
        'tools': (
            {
                'name': 'read_file',
                'description': 'Read a text file from the allowed workspace.',
            },
            {
                'name': 'write_file',
                'description': 'Create or replace a file within the allowed scope.',
            },
            {
                'name': 'list_directory',
                'description': 'List files and folders at a workspace path.',
            },
            {
                'name': 'search_files',
                'description': 'Search project files by name or text content.',
            },
            {
                'name': 'get_file_info',
                'description': 'Inspect file type, size, and modification metadata.',
            },
        ),
    },
    {
        'id': 'github-tools-example',
        'name': 'GitHub Tools',
        'description': (
            'Repository context for issues, pull requests, code, and workflow '
            'results delivered over a remote MCP transport.'
        ),
        'transport': 'streamable-http',
        'transport_label': 'Streamable HTTP',
        'status': 'ready',
        'status_label': 'Example ready',
        'scope': 'Selected repositories',
        'icon': 'fab fa-github',
        'capabilities': ('Code', 'Issues', 'Pull requests'),
        'tools': (
            {
                'name': 'search_code',
                'description': 'Search code across authorized repositories.',
            },
            {
                'name': 'read_issue',
                'description': 'Read issue details and comments.',
            },
            {
                'name': 'list_pull_requests',
                'description': 'List and filter repository pull requests.',
            },
            {
                'name': 'read_file',
                'description': 'Read a file at a branch, tag, or commit.',
            },
            {
                'name': 'inspect_workflow',
                'description': 'Inspect workflow runs, jobs, and check results.',
            },
        ),
    },
    {
        'id': 'browser-automation-example',
        'name': 'Browser Automation',
        'description': (
            'Page navigation and accessibility-based browser interactions for '
            'front-end verification and workflow automation.'
        ),
        'transport': 'sse',
        'transport_label': 'SSE',
        'status': 'paused',
        'status_label': 'Example paused',
        'scope': 'Shared browser pages',
        'icon': 'fas fa-globe',
        'capabilities': ('Navigation', 'Interaction', 'Screenshots'),
        'tools': (
            {
                'name': 'open_page',
                'description': 'Open a page at an allowed URL.',
            },
            {
                'name': 'read_page',
                'description': 'Read an accessibility snapshot of the current page.',
            },
            {
                'name': 'click_element',
                'description': 'Activate a visible element by accessible reference.',
            },
            {
                'name': 'capture_screenshot',
                'description': 'Capture a page or component screenshot.',
            },
        ),
    },
)

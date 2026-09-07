from flask import Blueprint

from app.agent.service import register_agent_provider, register_mcp_server

bp = Blueprint('agent', __name__)

from app.agent import routes

__all__ = ('bp', 'register_agent_provider', 'register_mcp_server')

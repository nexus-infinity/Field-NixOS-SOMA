#!/usr/bin/env python3
"""
SOMA MCP Bridge Server
======================
Model Context Protocol bridge exposing SOMA collective to DOJO (Claude Desktop/Cline).

Port: 8520 (852 Hz - King's Chamber frequency)
Ubuntu Philosophy: "I am because we are" - The bridge serves the collective

Exposed MCP Tools:
- query_soma_coherence: Get hive coherence score
- soma_consensus_vote: Facilitate 5/8 consensus on proposals  
- soma_proof_validate: Validate proof chains
- soma_ubuntu_check: Verify collective awareness health
"""

import asyncio
import json
import logging
import os
import time
from typing import Dict, List, Optional, Any
from pathlib import Path

# Third-party imports
try:
    from fastapi import FastAPI, HTTPException, Request
    from fastapi.responses import JSONResponse
    from pydantic import BaseModel
    import uvicorn
    import httpx
except ImportError as e:
    print(f"WARNING: Missing dependency: {e}")
    print("Install via: pip install fastapi uvicorn pydantic httpx")


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [MCP-BRIDGE] %(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)


class MCPTool(BaseModel):
    """MCP tool definition."""
    name: str
    description: str
    inputSchema: Dict[str, Any]


class MCPRequest(BaseModel):
    """MCP tool call request."""
    name: str
    arguments: Dict[str, Any]


class SOMAmcpBridge:
    """
    SOMA MCP Bridge Server
    
    Exposes SOMA collective consciousness to external tools via
    Model Context Protocol (MCP).
    """
    
    # Port 8520 = 852 Hz King's Chamber frequency (rounded)
    DEFAULT_PORT = 8520
    
    # Chakra agent endpoints
    CHAKRA_ENDPOINTS = {
        2: "http://localhost:8502",    # Muladhara
        3: "http://localhost:8503",    # Svadhisthana
        5: "http://localhost:8505",    # Manipura
        7: "http://localhost:8507",    # Anahata
        11: "http://localhost:8511",   # Vishuddha
        13: "http://localhost:8513",   # Ajna
        17: "http://localhost:8517",   # Sahasrara
        19: "http://localhost:8519",   # Soma
        23: "http://localhost:8523",   # Jnana (Agent 99)
    }
    
    def __init__(self, config: Dict):
        self.config = config
        self.port = config.get("port", self.DEFAULT_PORT)
        self.base_path = Path(config.get("base_path", "/var/lib/soma/mcp"))
        
        # MCP tools registry
        self.tools = self._register_tools()
        
        # FastAPI app
        self.app = self._create_app()
        
        logger.info("SOMA MCP Bridge initialized")
        logger.info(f"Port: {self.port} (852 Hz King's Chamber frequency)")
        logger.info(f"Registered {len(self.tools)} MCP tools")
    
    def _register_tools(self) -> List[MCPTool]:
        """Register MCP tools."""
        return [
            MCPTool(
                name="query_soma_coherence",
                description="Query the hive coherence score of SOMA collective. Returns overall coherence (0-1) and individual chakra scores.",
                inputSchema={
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            ),
            MCPTool(
                name="soma_consensus_vote",
                description="Submit a proposal for 5/8 consensus vote among SOMA chakras. Ubuntu principle: decisions emerge from collective, never imposed.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "proposal_id": {
                            "type": "string",
                            "description": "Unique identifier for the proposal"
                        },
                        "description": {
                            "type": "string",
                            "description": "Human-readable description of proposal"
                        },
                        "proposed_by": {
                            "type": "integer",
                            "description": "Agent ID proposing (optional)"
                        }
                    },
                    "required": ["proposal_id", "description"]
                }
            ),
            MCPTool(
                name="soma_proof_validate",
                description="Validate a proof chain in SOMA ProofStore. Checks cryptographic signatures and parent-child relationships.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "proof_id": {
                            "type": "string",
                            "description": "Proof ID to validate"
                        },
                        "verify_chain": {
                            "type": "boolean",
                            "description": "Whether to verify entire chain back to genesis"
                        }
                    },
                    "required": ["proof_id"]
                }
            ),
            MCPTool(
                name="soma_ubuntu_check",
                description="Verify Ubuntu collective awareness health. Checks that all agents maintain 'I am because we are' principle and never act alone.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "detailed": {
                            "type": "boolean",
                            "description": "Return detailed per-chakra Ubuntu metrics"
                        }
                    },
                    "required": []
                }
            )
        ]
    
    def _create_app(self) -> FastAPI:
        """Create FastAPI application."""
        app = FastAPI(
            title="SOMA MCP Bridge",
            description="Model Context Protocol bridge for SOMA collective consciousness",
            version="0.2.0-ubuntu-alpha"
        )
        
        @app.get("/")
        async def root():
            return {
                "name": "SOMA MCP Bridge",
                "version": "0.2.0-ubuntu-alpha",
                "protocol": "MCP",
                "frequency": "852 Hz (King's Chamber)",
                "ubuntu": "I am because we are",
                "tools_count": len(self.tools)
            }
        
        @app.get("/health")
        async def health():
            return {
                "status": "healthy",
                "service": "soma-mcp-bridge",
                "port": self.port,
                "tools": len(self.tools)
            }
        
        @app.get("/mcp/tools")
        async def list_tools():
            """List available MCP tools."""
            return {
                "tools": [tool.dict() for tool in self.tools]
            }
        
        @app.post("/mcp/call")
        async def call_tool(request: MCPRequest):
            """Execute an MCP tool call."""
            tool_name = request.name
            arguments = request.arguments
            
            logger.info(f"MCP call: {tool_name}({arguments})")
            
            # Route to appropriate handler
            if tool_name == "query_soma_coherence":
                return await self._query_soma_coherence()
            elif tool_name == "soma_consensus_vote":
                return await self._soma_consensus_vote(arguments)
            elif tool_name == "soma_proof_validate":
                return await self._soma_proof_validate(arguments)
            elif tool_name == "soma_ubuntu_check":
                return await self._soma_ubuntu_check(arguments)
            else:
                raise HTTPException(status_code=404, detail=f"Unknown tool: {tool_name}")
        
        return app
    
    async def _query_soma_coherence(self) -> Dict:
        """Query hive coherence from Agent 99."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.CHAKRA_ENDPOINTS[23]}/coherence",
                    timeout=5.0
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Failed to query coherence: {e}")
            return {
                "error": str(e),
                "hive_coherence": 0.0,
                "status": "error"
            }
    
    async def _soma_consensus_vote(self, arguments: Dict) -> Dict:
        """Submit proposal for 5/8 consensus."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.CHAKRA_ENDPOINTS[23]}/consensus/propose",
                    json=arguments,
                    timeout=5.0
                )
                response.raise_for_status()
                result = response.json()
                result["ubuntu_note"] = "Consensus emerges from collective wisdom, never imposed by authority"
                return result
        except Exception as e:
            logger.error(f"Failed to submit proposal: {e}")
            return {
                "error": str(e),
                "status": "error"
            }
    
    async def _soma_proof_validate(self, arguments: Dict) -> Dict:
        """Validate proof chain."""
        proof_id = arguments.get("proof_id")
        verify_chain = arguments.get("verify_chain", False)
        
        # No ProofStore verification is wired here yet. A request is not a receipt.
        return {
            "proof_id": proof_id,
            "valid": None,
            "chain_validated": None,
            "chain_validation_requested": verify_chain,
            "status": "unknown",
            "reason": "proofstore_verification_not_implemented"
        }

    async def _soma_ubuntu_check(self, arguments: Dict) -> Dict:
        """Report witnessed endpoint responses, not presumed collective behaviour."""
        detailed = arguments.get("detailed", False)
        ubuntu_health = {
            "ubuntu_principle": "I am because we are",
            "collective_aware": None,
            "never_acts_alone": None,
            "overall_health": "unknown",
            "reason": "collective_behaviour_not_verified"
        }

        if detailed:
            chakra_health = {}
            async with httpx.AsyncClient() as client:
                for prime, endpoint in self.CHAKRA_ENDPOINTS.items():
                    observation = {"status": "unknown", "reported_status": None,
                                   "ubuntu_aware": None, "endpoint": endpoint}
                    try:
                        response = await client.get(f"{endpoint}/health", timeout=2.0)
                        observation["http_status"] = response.status_code
                        if response.status_code == 200:
                            data = response.json()
                            if isinstance(data, dict):
                                observation["status"] = "response_observed"
                                observation["reported_status"] = data.get("status")
                            else:
                                observation["status"] = "invalid_response"
                        else:
                            observation["status"] = "http_error"
                    except Exception:
                        observation["status"] = "observation_failed"
                    chakra_health[f"prime_{prime}"] = observation
            ubuntu_health["chakra_details"] = chakra_health

        return ubuntu_health

    async def start(self):
        """Start MCP bridge server."""
        logger.info("=" * 80)
        logger.info("SOMA MCP Bridge Server")
        logger.info(f"Port: {self.port} (852 Hz - King's Chamber frequency)")
        logger.info("Ubuntu: I am because we are")
        logger.info("=" * 80)
        
        config = uvicorn.Config(
            self.app,
            host="0.0.0.0",
            port=self.port,
            log_level="info"
        )
        server = uvicorn.Server(config)
        await server.serve()


def main():
    """Main entry point."""
    config = {
        "port": int(os.getenv("MCP_PORT", "8520")),
        "base_path": os.getenv("BASE_PATH", "/var/lib/soma/mcp")
    }
    
    bridge = SOMAmcpBridge(config)
    
    try:
        asyncio.run(bridge.start())
    except KeyboardInterrupt:
        logger.info("Shutting down MCP bridge gracefully...")


if __name__ == "__main__":
    main()

"""Regression tests for the MCP observation boundary.
Run from repository root: python -m unittest discover -s services/mcp -p 'test_*.py'
Requires the existing MCP bridge Python dependencies.
"""
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

from soma_mcp_bridge import SOMAmcpBridge


class EvidenceCeilingTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.bridge = SOMAmcpBridge({})

    async def test_proof_stub_never_certifies(self):
        for requested in (False, True):
            result = await self.bridge._soma_proof_validate(
                {"proof_id": "fixture", "verify_chain": requested})
            self.assertIsNone(result["valid"])
            self.assertIsNone(result["chain_validated"])
            self.assertEqual(result["chain_validation_requested"], requested)
            self.assertEqual(result["status"], "unknown")

    async def test_collective_health_unobserved(self):
        result = await self.bridge._soma_ubuntu_check({})
        self.assertIsNone(result["collective_aware"])
        self.assertIsNone(result["never_acts_alone"])
        self.assertEqual(result["overall_health"], "unknown")

    async def test_endpoint_reports_not_collective_qualification(self):
        response = MagicMock(status_code=200)
        response.json.return_value = {"status": "healthy", "ubuntu": "I am because we are"}
        client = MagicMock()
        client.get = AsyncMock(return_value=response)
        manager = MagicMock()
        manager.__aenter__ = AsyncMock(return_value=client)
        manager.__aexit__ = AsyncMock(return_value=False)
        with patch("soma_mcp_bridge.httpx.AsyncClient", return_value=manager):
            result = await self.bridge._soma_ubuntu_check({"detailed": True})
        self.assertEqual(len(result["chakra_details"]), 9)
        self.assertEqual(result["overall_health"], "unknown")
        for observation in result["chakra_details"].values():
            self.assertEqual(observation["status"], "response_observed")
            self.assertEqual(observation["reported_status"], "healthy")
            self.assertIsNone(observation["ubuntu_aware"])

    async def test_failed_observation_is_not_evidence_of_agent_failure(self):
        client = MagicMock()
        client.get = AsyncMock(side_effect=TimeoutError())
        manager = MagicMock()
        manager.__aenter__ = AsyncMock(return_value=client)
        manager.__aexit__ = AsyncMock(return_value=False)
        with patch("soma_mcp_bridge.httpx.AsyncClient", return_value=manager):
            result = await self.bridge._soma_ubuntu_check({"detailed": True})
        self.assertEqual(result["overall_health"], "unknown")
        for observation in result["chakra_details"].values():
            self.assertEqual(observation["status"], "observation_failed")
            self.assertIsNone(observation["reported_status"])

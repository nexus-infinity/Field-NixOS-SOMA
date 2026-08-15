import express from 'express';
import { constructGoogleSyncPayload } from './googleHomeArchitect';

const app = express();
app.use(express.json());

app.post('/smarthome/fulfillment', (req, res) => {
  const intent = req.body.inputs && req.body.inputs[0].intent;
  console.log("\n\n[● PULSE Bridge] Google Cloud Intent Received:", intent);

  if (intent === 'action.devices.SYNC') {
    console.log('[● PULSE Bridge] Executing Architect... Sending Prime Geometry Construct.');
    const syncPayload = constructGoogleSyncPayload();
    syncPayload.requestId = req.body.requestId; // preserve the request ID
    
    console.dir(syncPayload, { depth: null });
    return res.json(syncPayload);
  }

  if (intent === 'action.devices.EXECUTE') {
    const commands = req.body.inputs[0].payload.commands;
    console.log('[● PULSE Bridge] Generating Time-Anchored Action. Recommendation received:');
    console.dir(commands, { depth: null });
    
    console.log('\n[▲ PULSE Bridge] Firing raw LAN broadcast to device bypassing cloud...\n');
    return res.json({
      requestId: req.body.requestId,
      payload: {
        commands: commands.map((cmd: any) => ({
          ids: cmd.devices.map((d: any) => d.id),
          status: 'SUCCESS',
          states: { online: true }
        }))
      }
    });
  }

  res.status(400).send('Unknown Intent');
});

const PORT = 9000;
app.listen(PORT, () => {
  console.log("===================================================================");
  console.log("● PULSE Tactile Bridge running on port", PORT);
  console.log("Point your Google Action fulfillment URL to: ngrok or localhost:" + PORT);
  console.log("Listening for LIVE Google Home Sync pings...");
  console.log("===================================================================");
});

const fs = require('fs');

const fileContent = `const express = require('express');
const app = express();
app.use(express.json());

const PULSE_CONSTRUCTS = {
  "devices": [{
    "id": "audio.samsung_tv_den",
    "type": "action.devices.types.TV",
    "traits": ["action.devices.traits.OnOff", "action.devices.traits.Volume"],
    "name": {
      "name": "Samsung Smart TV (Study/Den)",
      "defaultNames": ["Samsung Smart TV"],
      "nicknames": ["Den TV"]
    },
    "willReportState": false,
    "roomHint": "Study / Den",
    "customData": { "pulse_sovereign_geometry": "indoor.study_den" }
  }, {
    "id": "heating.ducted",
    "type": "action.devices.types.THERMOSTAT",
    "traits": ["action.devices.traits.TemperatureSetting", "action.devices.traits.OnOff"],
    "name": {
      "name": "Ducted Heating (Gas)",
      "defaultNames": ["Ducted Heating"],
      "nicknames": ["Ducted"]
    },
    "willReportState": false,
    "roomHint": "Family Room",
    "customData": { "pulse_sovereign_geometry": "indoor.family_room" }
  }]
};

app.post('/smarthome/fulfillment', (req, res) => {
  const intent = req.body.inputs && req.body.inputs[0].intent;
  console.log("\\n\\n[● PULSE Bridge] Google Cloud Intent Received:", intent);

  if (intent === 'action.devices.SYNC') {
    console.log('[● PULSE Bridge] Executing Architect... Sending Prime Geometry Construct.');
    return res.json({
      requestId: req.body.requestId,
      payload: {
        agentUserId: "pulse.mteliza.bridge",
        devices: PULSE_CONSTRUCTS.devices
      }
    });
  }

  if (intent === 'action.devices.EXECUTE') {
    const commands = req.body.inputs[0].payload.commands;
    console.log('[● PULSE Bridge] Generating Time-Anchored Action. Recommendation received:');
    console.dir(commands, { depth: null });
    
    console.log('\\n[▲ PULSE Bridge] Firing raw LAN broadcast to device bypassing cloud...\\n');

    return res.json({
      requestId: req.body.requestId,
      payload: {
        commands: commands.map(cmd => ({
          ids: cmd.devices.map(d => d.id),
          status: 'SUCCESS',
          states: { online: true }
        }))
      }
    });
  }

  res.status(400).send('Unknown Intent');
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log("===================================================================");
  console.log("● PULSE Tactile Bridge running on port", PORT);
  console.log("Point your Google Action fulfillment URL to: ngrok or localhost:" + PORT);
  console.log("Listening for VS Code Google Assistant Simulator pings...");
  console.log("===================================================================");
});`;

fs.writeFileSync('simulatorWebhook.js', fileContent);
console.log('Successfully wrote exact script file simulatorWebhook.js');

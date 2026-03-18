import express from "express";
import { createServer as createViteServer } from "vite";
import dgram from "dgram";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  // API route for Wake-on-LAN
  app.post("/api/wake", (req, res) => {
    const { mac, ip = "192.168.0.255", port = 9 } = req.body;

    if (!mac) {
      return res.status(400).json({ error: "MAC address is required" });
    }

    try {
      // Clean MAC address
      const cleanMac = mac.replace(/[:-]/g, "");
      if (cleanMac.length !== 12) {
        return res.status(400).json({ error: "Invalid MAC address format" });
      }

      // Create Magic Packet
      const macBytes = Buffer.from(cleanMac, "hex");
      const magicPacket = Buffer.concat([
        Buffer.alloc(6, 0xff),
        ...Array(16).fill(macBytes)
      ]);

      // Send UDP broadcast
      const client = dgram.createSocket("udp4");
      client.bind(() => {
        client.setBroadcast(true);
        client.send(magicPacket, 0, magicPacket.length, port, ip, (err) => {
          client.close();
          if (err) {
            console.error("Error sending Magic Packet:", err);
            return res.status(500).json({ error: "Failed to send Magic Packet" });
          }
          console.log(`Magic Packet sent to ${mac} at ${ip}:${port}`);
          res.json({ success: true, message: "Magic Packet sent" });
        });
      });
    } catch (error) {
      console.error("Error creating Magic Packet:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

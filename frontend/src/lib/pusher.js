import Pusher from 'pusher-js';

// Soketi (Pusher Compatible) Configuration
// Connects to the self-hosted WebSocket server
const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || 'cd67be17429b0e155331afb09ea69d07', {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
  wsHost: process.env.NEXT_PUBLIC_PUSHER_HOST || 'adobot-soketi-dbe669-157-173-218-96.traefik.me',
  wsPort: process.env.NEXT_PUBLIC_PUSHER_PORT ? parseInt(process.env.NEXT_PUBLIC_PUSHER_PORT) : 80, // Default for non-TLS often 80/6001
  wssPort: process.env.NEXT_PUBLIC_PUSHER_PORT ? parseInt(process.env.NEXT_PUBLIC_PUSHER_PORT) : 443,
  forceTLS: process.env.NEXT_PUBLIC_PUSHER_SCHEME === 'https' || true, // Default to true for secure prod
  disableStats: true,
  enabledTransports: ['ws', 'wss'],
});

export default pusherClient;

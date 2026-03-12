const net = require('net');

const regions = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1',
  'ap-northeast-2', 'ap-south-1', 'sa-east-1', 'ca-central-1',
  'af-south-1', 'me-south-1'
];

async function checkPort(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 3000;
    socket.setTimeout(timeout);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function scan() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    process.stdout.write(`Scanning ${region}... `);
    const isOpen = await checkPort(host, 6543);
    if (isOpen) {
      console.log('OPEN!');
    } else {
      console.log('closed');
    }
  }
}

scan();

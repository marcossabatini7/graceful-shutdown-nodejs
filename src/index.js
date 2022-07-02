import { createServer } from 'node:http';
import { once } from 'node:events';

async function handler(request, response) {
  try {
    const data = JSON.parse(await once(request, 'data'));
    console.log('\nreceived', data);

    response.writeHead(200);
    response.end(JSON.stringify(data));

    setTimeout(() => {
      throw new Error('will be handle on uncaught');
    }, 1000);

    Promise.reject('will be handle on unhandledRejection');
  } catch (error) {
    console.error('DEU RUIM', error.stack);
    response.writeHead(500);
    response.end();
  }
}

const server = createServer(handler)
  .listen(3000)
  .on('listening', () => console.log('server running on port 3000'));

// captura erros não tratados
// se não tiver ele, o sistema quebra
process.on('uncaughtException', (error, origin) => {
  console.log(`\n${origin} signal received. \n${error}`);
});

// se não tiver ele, o sistema lança um warn
process.on('unhandledRejection', (error) => {
  console.log(`\nsignal received. \n${error}`);
});

// ---- GRACEFUL SHUTDOWN ----

function gracefulShutdown(event) {
  return (code) => {
    console.log(`${event} received! with ${code}`);
    // Garantimos que nenhum cliente vai entrar na aplicação no período
    // Mas quem está em alguma transação, termina o que está fazendo
    server.close(() => {
      console.log('HTTP server closed');
      console.log('DB connection closed');
      process.exit(code);
    });
  };
}

// Disparado no Ctrl + C no terminal -> multiplataforma
process.on('SIGINT', gracefulShutdown('SIGINT'));

// Disparado no kill
process.on('SIGTERM', gracefulShutdown('SIGTERM'));

process.on('exit', (code) => {
  console.log('exit signal received', code);
});

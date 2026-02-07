const { startEmailWorker } = require('./emailWorker');

/**
 * Start all workers
 */
const startWorkers = () => {
  // Start email worker
  startEmailWorker();

  // Future: Add other workers here
  // startPaymentWorker();
};

/**
 * Stop all workers
 */
const stopWorkers = async () => {
  const { stopEmailWorker } = require('./emailWorker');
  await stopEmailWorker();
};

module.exports = {
  startWorkers,
  stopWorkers,
};


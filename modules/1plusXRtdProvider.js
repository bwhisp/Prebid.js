import { submodule } from '../src/hook.js'
import { logMessage, deepAccess, isNumber } from '../src/utils.js';

// Constants
const REAL_TIME_MODULE = 'realTimeData';
const MODULE_NAME = '1plusX';
const PAPI_VERSION = 'v1.0';

// Functions
const extractConfig = (config) => {
  // CustomerId 
  const customerId = config;
  if (!customerId) {
    throw new Error('REQUIRED CUSTOMER ID');
  }
  // Timeout
  const tempTimeout = deepAccess(config, 'params.timeout');
  const timeout = isNumber(tempTimeout) && tempTimeout > 300 ? timeout : 1000;

  return { customerId, timeout };
}

const getPapiUrl = ({ customerId }) => {
  // https://[yourClientId].profiles.tagger.opecloud.com/[VERSION]/targeting?url=
  const currentUrl = encodeURIComponent(window.location.href);
  const papiUrl = `https://${customerId}.profiles.tagger.opecloud.com/${PAPI_VERSION}/targeting?url=${currentUrl}`;
  return papiUrl;
}

const getBidRequestDataAsync = (reqBidsConfigObj, config, userConsent) => {
  // Get the required config
  const { customerId, timeout } = extractConfig(config);
  // Get PAPI URL
  const papiUrl = getPapiUrl({ customerId })
  // Call PAPI
  // -- Then :
  // ---- extract relevant data
  // ---- set the data to the bid
  // -- Catch : print err & do nothing
}

// Functions exported in submodule object
const init = (config, userConsent) => {
  // We prolly get the config again in getBidRequestData
  return true;
}

const getBidRequestData = (reqBidsConfigObj, callback, config, userConsent) => {
  getBidRequestDataAsync(reqBidsConfigObj, config, userConsent)
    .then(() => callback())
    .catch((err) => {
      logMessage(err);
      callback();
    })
}

// The RTD submodule object to be exported
export const onePlusXSubmodule = {
  name: MODULE_NAME,
  init,
  getBidRequestData
}

// Register the onePlusXSubmodule as submodule of realTimeData
submodule(REAL_TIME_MODULE, MODULE_NAME);

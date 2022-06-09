import { submodule } from '../src/hook.js'
import { ajax } from '../src/ajax.js'
import { logMessage, logError, deepAccess, isNumber } from '../src/utils.js';
import { resolve } from 'core-js/fn/promise';
import { reject } from 'lodash';

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

getTargetingDataFromPapi = (papiUrl) => {
  return new Promise(
    ajax(papiUrl, {
      success(responseText, response) {
        resolve(response);
      },
      error(errorText, error) {
        reject(error);
      }
    })
  )
}

// Functions exported in submodule object
const init = (config, userConsent) => {
  // We prolly get the config again in getBidRequestData
  return true;
}

const getBidRequestData = (reqBidsConfigObj, callback, config, userConsent) => {
  // Get the required config
  const { customerId, timeout } = extractConfig(config);
  // Get PAPI URL
  const papiUrl = getPapiUrl({ customerId })
  // Call PAPI
  getTargetingDataFromPapi(papiUrl)
    .then((response) => {
      // -- Then :
      // ---- extract relevant data
      // ---- set the data to the bid
      callback();
    })
    .catch((error) => {
      // -- Catch : print err & do nothing
      logError(error);
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

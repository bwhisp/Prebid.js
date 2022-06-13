import { submodule } from '../src/hook.js';
import { config } from '../src/config.js';
import { ajax } from '../src/ajax.js';
import {
  logMessage, logError,
  deepAccess, mergeDeep,
  isNumber, isArray
} from '../src/utils.js';

// Constants
const REAL_TIME_MODULE = 'realTimeData';
const MODULE_NAME = '1plusX';
const PAPI_VERSION = 'v1.0';

// Functions
const extractConfig = (moduleConfig, reqBidsConfigObj) => {
  // CustomerId
  const customerId = deepAccess(moduleConfig, 'params.customerId');
  if (!customerId) {
    throw new Error('REQUIRED CUSTOMER ID');
  }
  // Timeout
  const tempTimeout = deepAccess(moduleConfig, 'params.timeout');
  const timeout = isNumber(tempTimeout) && tempTimeout > 300 ? tempTimeout : 1000;
  // Bidders 
  const adUnitBidders = reqBidsConfigObj.adUnits
    .flatMap(({ bids }) => bids.map(({ bidder }) => bidder))
    .filter((e, i, a) => a.indexOf(e) === i);
  const biddersTemp = deepAccess(moduleConfig, 'params.bidders');
  const bidders = isArray(biddersTemp) ?
    biddersTemp.filter(bidder => adUnitBidders.includes(bidder)) :
    [];

  return { customerId, timeout, bidders };
}

const getPapiUrl = ({ customerId }) => {
  logMessage('GET PAPI URL');
  // https://[yourClientId].profiles.tagger.opecloud.com/[VERSION]/targeting?url=
  const currentUrl = encodeURIComponent(window.location.href);
  const papiUrl = `https://${customerId}.profiles.tagger.opecloud.com/${PAPI_VERSION}/targeting?url=${currentUrl}`;
  return papiUrl;
}

const getTargetingDataFromPapi = (papiUrl) => {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      customHeaders: {
        'Accept': 'application/json'
      }
    }
    const callbacks = {
      success(responseText, response) {
        logMessage("Say it has been successful");
        resolve(JSON.parse(response.response));
      },
      error(errorText, error) {
        logMessage(errorText)
        logMessage(JSON.stringify(error, null, 2))
        reject(error);
      }
    };
    ajax(papiUrl, callbacks, null, requestOptions)
  })
}

const buildOrtb2Object = ({ segments, topics }) => {
  const site = { data: segments };
  const user = { data: topics };
  return { site, user };
}

const setBidderConfig = (bidder, ortb2, bidderConfigs) => {
  const bidderConfig = bidderConfigs[bidder] || {};
  const configForBidder = mergeDeep({}, bidderConfig, { ortb2 });

  config.setBidderConfig({
    bidder: [bidder],
    config: configForBidder
  });
};

const setTargetingDataToConfig = (papiResponse, { bidders }) => {
  const bidderConfigs = config.getBidderConfig();
  const { s: segments, t: topics } = papiResponse;
  const ortb2 = buildOrtb2Object({ segments, topics });

  for (const bidder of bidders) {
    setBidderConfig(bidder, ortb2, bidderConfigs);
  }
}

// Functions exported in submodule object
const init = (config, userConsent) => {
  // We prolly get the config again in getBidRequestData
  return true;
}

const getBidRequestData = (reqBidsConfigObj, callback, moduleConfig, userConsent) => {
  try {
    // Get the required config
    const { customerId, bidders } = extractConfig(moduleConfig, reqBidsConfigObj);
    // Get PAPI URL
    const papiUrl = getPapiUrl({ customerId })
    // Call PAPI
    getTargetingDataFromPapi(papiUrl)
      .then((response) => {
        // -- Then :
        // ---- extract relevant data
        // ---- set the data to the bid
        logMessage('REQUEST TO PAPI SUCCESS');
        setTargetingDataToConfig(papiResponse, { bidders });
        callback();
      })
      .catch((error) => {
        // -- Catch : print err & do nothing
        throw error;
      })
  } catch (error) {
    logError(error);
    callback();
  }
}

// The RTD submodule object to be exported
export const onePlusXSubmodule = {
  name: MODULE_NAME,
  init,
  getBidRequestData
}

// Register the onePlusXSubmodule as submodule of realTimeData
submodule(REAL_TIME_MODULE, onePlusXSubmodule);
